/**
 * Stop card presented as a native iOS sheet from the map (medium and large
 * detents, grabber, map still interactive at medium). Reads the selected stop
 * from mapStore, so tapping another dot swaps the content in place.
 */
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useDepartures } from '../hooks';
import { stableNow } from '../lib/time';
import { toggleFavorite } from '../favorites';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { LineBadge } from '../ui/LineBadge';
import { DepartureTime, clock } from '../ui/Departure';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import { mapStore } from '../ui/mapStore';
import { useStore } from '../ui/store';
import { useFavorites } from '../ui/useFavorites';
import { useNow } from '../ui/useNow';
import { uniqueLines } from './StopDetail';
import { haptics } from '../design/haptics';

export default function StopSheet() {
  const { t } = useI18n();
  const now = useNow();
  const stop = useStore(mapStore, (s) => s.stop);
  const favs = useFavorites();

  useEffect(() => {
    mapStore.set({ sheetOpen: true });
    return () => mapStore.set({ sheetOpen: false, stop: null });
  }, []);

  const stopId = stop?.stop_id ?? '';
  const depQ = useDepartures(stopId, stableNow(now), 30, Boolean(stopId));
  const deps = useMemo(
    () => (depQ.data?.departures ?? []).filter((d) => new Date(d.scheduled_departure).getTime() >= now.getTime() - 60_000).slice(0, 8),
    [depQ.data, now],
  );
  const lines = useMemo(() => uniqueLines(depQ.data?.departures ?? []), [depQ.data]);
  const isFav = favs.some((f) => f.kind === 'stop' && f.id === stopId);

  const openInTab = (path: string) => {
    router.back();
    router.push(path);
  };

  if (!stop) return <View style={styles.root} />;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} accessibilityRole="header" numberOfLines={2}>{stop.stop_name}</Text>
          <Text style={styles.sub}>{t('stop_number', { id: stop.stop_id })}</Text>
        </View>
        <Pressable
          onPress={() => { haptics.favorite(!isFav); toggleFavorite({ id: stop.stop_id, kind: 'stop', label: stop.stop_name }); }}
          accessibilityRole="button"
          accessibilityLabel={isFav ? t('remove_fav') : t('add_fav')}
          style={styles.circle}
        >
          <SFSymbolIcon name={isFav ? 'heart.fill' : 'heart'} size={17} color={isFav ? C.tint : C.secondary} />
        </Pressable>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('close')} style={styles.circle}>
          <SFSymbolIcon name="xmark" size={14} weight="bold" color={C.secondary} />
        </Pressable>
      </View>

      {lines.length > 0 ? (
        <View style={styles.lines}>
          {lines.map((l) => (
            <Pressable key={l.name} onPress={() => openInTab(`/(tabs)/(map)/route/${encodeURIComponent(l.routeId)}`)} accessibilityRole="button" accessibilityLabel={t('line_n', { n: l.name })}>
              <LineBadge name={l.name} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t('next_departures')}</Text>
      <View style={styles.card}>
        {depQ.isLoading ? (
          <LoadingRow label={t('loading_departures')} />
        ) : depQ.isError ? (
          <MessageRow icon="exclamationmark.triangle" label={t('departures_error')} actionLabel={t('retry')} onAction={() => depQ.refetch()} />
        ) : deps.length === 0 ? (
          <MessageRow icon="clock" label={t('no_departures')} />
        ) : (
          deps.map((d, i) => (
            <View key={`${d.trip_id}-${d.stop_sequence}`}>
              {i > 0 ? <View style={styles.sep} /> : null}
              <View style={styles.row}>
                <View style={styles.badgeCol}><LineBadge name={d.route_short_name} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{d.headsign ? t('toward', { h: d.headsign }) : t('line_n', { n: d.route_short_name })}</Text>
                  <Text style={styles.rowSub}>{clock(d.scheduled_departure)}</Text>
                </View>
                <DepartureTime iso={d.scheduled_departure} now={now} />
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable
        onPress={() => openInTab(`/(tabs)/(map)/stop/${encodeURIComponent(stop.stop_id)}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.moreText}>{t('all_departures')}</Text>
        <SFSymbolIcon name="chevron.forward" size={13} weight="semibold" color={C.tint} />
      </Pressable>
      <Text style={styles.note}>{t('scheduled_note')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: M.margin + 4, paddingTop: 22, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { ...T.title2, color: C.label },
  sub: { ...T.subhead, color: C.secondary, marginTop: 3 },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.fill, alignItems: 'center', justifyContent: 'center' },
  lines: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  sectionTitle: { ...T.headline, color: C.label, marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: C.fill, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 52 },
  rowTitle: { ...T.body, color: C.label },
  rowSub: { ...T.footnote, color: C.secondary, marginTop: 1 },
  badgeCol: { width: 32, alignItems: 'flex-start' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 14 + 44 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, paddingVertical: 10 },
  moreText: { ...T.body, fontWeight: '600', color: C.tint },
  note: { ...T.footnote, color: C.secondary, textAlign: 'center', marginTop: 6 },
});
