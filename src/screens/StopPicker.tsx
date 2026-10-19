/**
 * Stop picker sheet for Viaje, with the native search bar.
 * Bug fix: the "reachable without a transfer" filter applies ONLY when
 * choosing the destination. The origin always lists every stop.
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useReachableStops, useStops } from '../hooks';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { HeaderButton } from '../ui/HeaderButton';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import { pickStop, tripStore } from '../ui/tripStore';
import { useStore } from '../ui/store';
import type { Stop } from '../api/types';

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function StopPickerScreen() {
  const { t } = useI18n();
  const field = useStore(tripStore, (s) => s.picking);
  const from = useStore(tripStore, (s) => s.from);
  const to = useStore(tripStore, (s) => s.to);
  const current = field === 'from' ? from : to;
  const [query, setQuery] = useState('');
  const q = normalize(useDeferredValue(query.trim()));

  const stopsQ = useStops(500);
  const reachable = useReachableStops(field === 'to' ? from?.stop_id ?? null : null);

  const base = useMemo(() => {
    const all = [...(stopsQ.data?.stops ?? [])].sort((a, b) => a.stop_name.localeCompare(b.stop_name, 'es'));
    if (field === 'to' && from && reachable.stopIds) return all.filter((s) => reachable.stopIds!.has(s.stop_id) && s.stop_id !== from.stop_id);
    return all;
  }, [stopsQ.data, field, from, reachable.stopIds]);

  const list = useMemo(() => (q ? base.filter((s) => normalize(s.stop_name).includes(q) || s.stop_id.includes(q)) : base), [base, q]);

  const choose = (s: Stop) => {
    pickStop(field, s);
    router.back();
  };

  const showReachableHint = field === 'to' && Boolean(from) && Boolean(reachable.stopIds);

  return (
    <>
      <Stack.Screen
        options={{
          title: field === 'from' ? t('origin') : t('destination'),
          headerLeft: () => <HeaderButton label={t('cancel')} accessibilityLabel={t('cancel')} onPress={() => router.back()} />,
          headerSearchBarOptions: {
            placeholder: t('search_stop'),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            autoCapitalize: 'none',
            hideWhenScrolling: false,
            placement: 'stacked',
          },
        }}
      />
      <FlatList
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        data={stopsQ.isLoading || (field === 'to' && reachable.isLoading) ? [] : list}
        keyExtractor={(s) => s.stop_id}
        initialNumToRender={20}
        ListHeaderComponent={
          showReachableHint ? <Text style={styles.hint}>{t('reachable_count', { n: base.length })}</Text> : null
        }
        ListEmptyComponent={
          stopsQ.isLoading || reachable.isLoading ? (
            <LoadingRow label={t('loading_stops')} />
          ) : stopsQ.isError ? (
            <MessageRow icon="exclamationmark.triangle" label={t('stops_error')} actionLabel={t('retry')} onAction={() => stopsQ.refetch()} />
          ) : (
            <MessageRow icon="magnifyingglass" label={t('no_match')} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const selected = current?.stop_id === item.stop_id;
          return (
            <Pressable
              onPress={() => choose(item)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.stop_name}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.pressed }]}
            >
              <View style={styles.texts}>
                <Text style={styles.title} numberOfLines={1}>{item.stop_name}</Text>
                <Text style={styles.sub}>{t('stop_number', { id: item.stop_id })}</Text>
              </View>
              {selected ? <SFSymbolIcon name="checkmark" size={17} weight="semibold" color={C.tint} /> : null}
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.plain },
  hint: { ...T.footnote, color: C.secondary, marginHorizontal: M.margin + 4, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: M.margin + 4, paddingVertical: 10, minHeight: 52, gap: 12 },
  texts: { flex: 1, gap: 1 },
  title: { ...T.body, color: C.label },
  sub: { ...T.footnote, color: C.secondary },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: M.margin + 4 },
});
