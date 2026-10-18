import { useState, useCallback, useEffect } from 'react';
import { Text, View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { useStop, useDepartures } from '../../src/hooks';
import { RouteBadge } from '../../src/components/ui-badges';
import { Loading, Empty, ErrorState, StatusChip } from '../../src/components/ui-input';
import { colors, radius, spacing, control, layout, hig } from '../../src/design/tokens';
import { stableNow, countdownLabel, formatClock } from '../../src/lib/time';
import { toggleFavorite, isFavorite } from '../../src/favorites';
import { realtime } from '../../src/realtime';
import type { ScheduledDeparture } from '../../src/api/types';

export default function StopDetailScreen() {
  const { stopId: raw } = useLocalSearchParams<{ stopId: string }>();
  const stopId = Array.isArray(raw) ? raw[0] : raw;

  // FIX (Phase 1): a stable "at" reference captured once per mount.
  // Previously `new Date().toISOString()` ran on every render, producing a
  // different React-Query key each time → per-petual pending (infinite loading).
      const [at, setAt] = useState(() => stableNow(new Date()));
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const forceRefresh = useCallback(() => {
    setNow(new Date());
    setAt(stableNow(new Date()));
  }, []);

  const stopQuery = useStop(stopId);
  const depQuery = useDepartures(stopId, at, 40, Boolean(stopId));

  const stopName = stopQuery.data?.stop_name ?? 'Cargando…';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.stopName}>{stopName}</Text>
          <Text style={styles.stopId}>Stop #{stopId}</Text>
          <Text style={styles.disclaimer}>Scheduled times only — realtime unavailable</Text>
        </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <StatusChip tone={realtime.availability === 'live' ? 'live' : 'muted'} label="Programado" />
          <Pressable onPress={() => toggleFavorite({ id: stopId, kind: 'stop', label: stopName })} accessibilityRole="button" accessibilityLabel="Añadir a favoritos" hitSlop={8}>
            <SFSymbolIcon name={isFavorite(stopId) ? 'heart.fill' : 'heart'} size={22} color={isFavorite(stopId) ? colors.primary : colors.muted48} />
          </Pressable>
          <Pressable onPress={forceRefresh} accessibilityRole="button" accessibilityLabel="Refresh" hitSlop={8}>
            <SFSymbolIcon name="arrow.clockwise" size={20} color={colors.muted48} />
          </Pressable>
        </View>
      </View>

      {depQuery.isLoading ? (
        <Loading label="Cargando llegadas…" />
      ) : depQuery.isError ? (
        <ErrorState label="No se pudieron cargar las llegadas." onRetry={() => depQuery.refetch()} />
      ) : depQuery.data && depQuery.data.departures.length > 0 ? (
                          <FlatList
          data={depQuery.data.departures}
          keyExtractor={(item) => item.trip_id}
          renderItem={({ item }) => <DepRow item={item} now={now} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.depList}
        />
      ) : (
        <Empty label="No hay llegadas programadas para esta parada" />
      )}
    </View>
    );
}

function DepRow({ item, now }: { item: ScheduledDeparture; now: Date }) {
  let pill = 'Programado';
  if (item.realtime_status === 'on_time') pill = 'A tiempo';
  else if (item.realtime_status === 'delayed') pill = 'Con retraso';
  else if (item.realtime_status === 'early') pill = 'Adelantado';
  return (
    <View style={styles.depRow}>
      <RouteBadge shortName={item.route_short_name} size={36} />
      <View style={styles.rowMid}>
        <Text style={styles.headsign} numberOfLines={1}>{item.headsign ?? '—'}</Text>
        <Text style={styles.dirInfo}>{item.direction_id === 0 ? 'Outbound' : 'Inbound'}</Text>
      </View>
      <View style={styles.timeCol}>
        <Text style={styles.depTime}>{countdownLabel(item.scheduled_departure, now)}</Text>
        <Text style={styles.depClock}>{formatClock(item.scheduled_departure)}</Text>
      </View>
      <Text style={[styles.delayPill, item.realtime_status === 'on_time' && { color: colors.success }]}>{pill}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { padding: layout.headerPaddingV + spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  stopName: { fontSize: hig('title2').size, fontWeight: '700', letterSpacing: hig('title2').ls },
  stopId: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 2 },
  disclaimer: { fontSize: hig('caption').size, color: colors.muted48, marginTop: control.groupTitleGap - 2 },
    depList: { paddingHorizontal: spacing.sm },
  depRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 1, paddingHorizontal: spacing.sm, gap: spacing.sm },
  rowMid: { flex: 1 },
  headsign: { fontSize: hig('subheadlineStrong').size, color: colors.ink, fontWeight: '600' },
  dirInfo: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 2 },
  timeCol: { minWidth: 58, alignItems: 'flex-end' },
  depTime: { fontSize: hig('subheadlineStrong').size, fontWeight: '700' },
  depClock: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 1 },
  delayPill: { fontSize: hig('caption2').size, color: colors.muted48, backgroundColor: colors.pearl, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.dividerSoft, marginLeft: 70 },
});