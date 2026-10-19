/**
 * Line detail: the route drawn as a vertical line in the line colour with a
 * stop per row (Apple Maps transit), and a native segmented control for the
 * direction.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useRoute, useRouteStops } from '../hooks';
import { toggleFavorite } from '../favorites';
import { routeColor } from '../design/routeColors';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { ListSection } from '../ui/List';
import { LineBadge } from '../ui/LineBadge';
import { HeaderButton } from '../ui/HeaderButton';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { useFavorites } from '../ui/useFavorites';
import { useTabNav } from '../ui/nav';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import type { RouteStop } from '../api/types';

type Dir = { key: string; label: string; stops: RouteStop[] };

function byDirection(rows: RouteStop[]): Dir[] {
  const groups = new Map<string, RouteStop[]>();
  for (const s of rows) {
    const k = s.direction_id === null ? 'none' : String(s.direction_id);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => {
      const seen = new Map<string, RouteStop>();
      for (const r of [...list].sort((a, b) => a.stop_sequence - b.stop_sequence)) if (!seen.has(r.stop_id)) seen.set(r.stop_id, r);
      const stops = [...seen.values()];
      const label = list.find((r) => r.headsign)?.headsign ?? stops[stops.length - 1]?.stop_name ?? key;
      return { key, label, stops };
    });
}

export default function RouteDetailScreen() {
  const { routeId: raw } = useLocalSearchParams<{ routeId: string }>();
  const routeId = decodeURIComponent((Array.isArray(raw) ? raw[0] : raw) ?? '');
  const { t } = useI18n();
  const { openStop } = useTabNav();
  const routeQ = useRoute(routeId);
  const stopsQ = useRouteStops(routeId);
  const favs = useFavorites();
  const isFav = favs.some((f) => f.kind === 'route' && f.id === routeId);

  const short = routeQ.data?.route_short_name ?? '';
  const long = routeQ.data?.route_long_name ?? '';
  const color = routeColor(short || routeId);
  const dirs = useMemo(() => byDirection(stopsQ.data?.stops ?? []), [stopsQ.data]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index >= dirs.length) setIndex(0);
  }, [dirs.length, index]);
  const dir = dirs[index];

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <HeaderButton
              icon={isFav ? 'heart.fill' : 'heart'}
              accessibilityLabel={isFav ? t('remove_fav') : t('add_fav')}
              onPress={() => short && toggleFavorite({ id: routeId, kind: 'route', label: short, sublabel: long || undefined })}
            />
          ),
        }}
      />
      <ScrollView style={styles.root} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {short ? <LineBadge name={short} size="large" color={color} /> : null}
          <Text style={styles.name} accessibilityRole="header">{long || (short ? t('line_n', { n: short }) : ' ')}</Text>
          <Text style={styles.sub}>{t('bus_line')}</Text>
        </View>

        {dirs.length > 1 ? (
          <View style={styles.segment}>
            <SegmentedControl
              values={dirs.map((d) => d.label)}
              selectedIndex={index}
              onChange={(e) => setIndex(e.nativeEvent.selectedSegmentIndex)}
            />
          </View>
        ) : null}

        <ListSection
          title={dir ? `${t('stops')} · ${dir.stops.length}` : t('stops')}
          prominent
          separatorInset={M.margin + 24 + 12}
          footer={t('scheduled_note')}
        >
          {stopsQ.isLoading ? (
            <LoadingRow label={t('loading_stops')} />
          ) : stopsQ.isError ? (
            <MessageRow icon="exclamationmark.triangle" label={t('stops_error')} actionLabel={t('retry')} onAction={() => stopsQ.refetch()} />
          ) : (
            (dir?.stops ?? []).map((s, i, all) => (
              <RouteStopRow key={s.stop_id} stop={s} color={color} first={i === 0} last={i === all.length - 1} onPress={() => openStop(s.stop_id)} />
            ))
          )}
        </ListSection>
      </ScrollView>
    </>
  );
}

function RouteStopRow({ stop, color, first, last, onPress }: { stop: RouteStop; color: string; first: boolean; last: boolean; onPress: () => void }) {
  const terminal = first || last;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={stop.stop_name} style={({ pressed }) => [styles.stopRow, pressed && { backgroundColor: C.pressed }]}>
      <View style={styles.rail}>
        {!first ? <View style={[styles.bar, styles.barTop, { backgroundColor: color }]} /> : null}
        {!last ? <View style={[styles.bar, styles.barBottom, { backgroundColor: color }]} /> : null}
        <View style={[terminal ? styles.dotTerminal : styles.dot, { borderColor: color }, terminal && { backgroundColor: color }]} />
      </View>
      <Text style={[styles.stopName, terminal && { fontWeight: '600' }]} numberOfLines={2}>{stop.stop_name}</Text>
      <SFSymbolIcon name="chevron.forward" size={14} weight="semibold" color={C.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  hero: { paddingHorizontal: M.margin + 4, paddingTop: 4, alignItems: 'flex-start', gap: 10 },
  name: { ...T.title1, color: C.label },
  sub: { ...T.subhead, color: C.secondary, marginTop: -6 },
  segment: { marginHorizontal: M.margin, marginTop: 20 },
  stopRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingLeft: M.margin, paddingRight: M.margin, gap: 12 },
  rail: { width: 24, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', width: 5, left: 9.5 },
  barTop: { top: 0, bottom: '50%' },
  barBottom: { top: '50%', bottom: 0 },
  dot: { width: 13, height: 13, borderRadius: 6.5, borderWidth: 3, backgroundColor: '#fff' },
  dotTerminal: { width: 17, height: 17, borderRadius: 8.5, borderWidth: 3 },
  stopName: { ...T.body, color: C.label, flex: 1, paddingVertical: 12 },
});
