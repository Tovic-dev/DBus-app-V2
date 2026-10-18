import { useState, useEffect } from 'react';
import { Text, View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { useRoute, useRouteStops, useDepartures } from '../../src/hooks';
import { RouteBadge, Section } from '../../src/components/ui-badges';
import { Loading, Empty, ErrorState, StatusChip } from '../../src/components/ui-input';
import { colors, radius, spacing, control, layout, hig } from '../../src/design/tokens';
import { realtime } from '../../src/realtime';
import { stableNow } from '../../src/lib/time';
import { toggleFavorite, isFavorite } from '../../src/favorites';

export default function LiveTripScreen() {
  const { routeId: raw } = useLocalSearchParams<{ routeId: string }>();
  const routeId = Array.isArray(raw) ? raw[0] : raw;

  const routeQ = useRoute(routeId);
  const stopsQ = useRouteStops(routeId);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const at = stableNow();
  const firstStopId = stopsQ.data?.stops.find((s) => s)?.stop_id ?? null;
  const depQ = useDepartures(firstStopId ?? '', at, 10, Boolean(firstStopId));

  const name = routeQ.data?.route_short_name ?? routeId ?? '—';
  const status = realtime.statusLabel();
  void tick;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <RouteBadge shortName={name} size={56} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.name} numberOfLines={1}>{routeQ.data?.route_long_name ?? name}</Text>
          <Text style={styles.meta}>Línea {name}</Text>
        </View>
        <Pressable onPress={() => toggleFavorite({ id: routeId ?? '', kind: 'route', label: name, sublabel: routeQ.data?.route_long_name ?? undefined })} accessibilityRole="button" accessibilityLabel="Añadir a favoritos" hitSlop={8}>
          <SFSymbolIcon name={isFavorite(routeId ?? '') ? 'heart.fill' : 'heart'} size={22} color={isFavorite(routeId ?? '') ? colors.primary : colors.muted48} />
        </Pressable>
      </View>

      <View style={styles.liveBanner}>
        {realtime.availability === 'live' ? <StatusChip tone="live" label="En vivo" /> : <StatusChip tone="muted" label="Programado" />}
        <Text style={styles.liveText}>{status.text}</Text>
      </View>

                        <Section title="Recorrido">
        {stopsQ.isLoading ? <Loading label="Cargando línea…" /> : stopsQ.isError ? <ErrorState label="No se pudieron cargar las paradas." onRetry={() => stopsQ.refetch()} /> : (
          <FlatList data={stopsQ.data?.stops ?? []} keyExtractor={(item) => `${item.trip_id}-${item.stop_id}-${item.stop_sequence}`}
            renderItem={({ item }) => (
              <View style={styles.seqRow}>
                <Text style={styles.seqNum}>{item.stop_sequence}</Text>
                <Text style={styles.seqName} numberOfLines={1}>{item.stop_name}</Text>
                <Text style={styles.seqDir}>{item.headsign ?? ''}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />} contentContainerStyle={styles.seqList} />
        )}
            </Section>

      <Section title="Próximas salidas en la cabecera">
        {depQ.isLoading ? <Loading label="Cargando llegadas…" /> : depQ.data && depQ.data.departures.length > 0 ? (
          <FlatList data={depQ.data.departures} keyExtractor={(item) => item.trip_id}
            renderItem={({ item }) => (
              <View style={styles.depRow}>
                <RouteBadge shortName={item.route_short_name} size={34} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.depHead} numberOfLines={1}>{item.headsign ?? '—'}</Text>
                  <Text style={styles.depSub} numberOfLines={1}>{item.direction_id === 0 ? 'Ida' : 'Vuelta'}</Text>
                </View>
                <Text style={styles.depTime}>{timeLabel(item.scheduled_departure)}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />} />
        ) : <Empty label="No hay salidas en esta parada" />}
      </Section>

      <Text style={styles.fine}>Las posiciones de vehículos en tiempo real aún no están disponibles para DBus. Se muestran horarios programados.</Text>
    </View>
  );
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const m = Math.round((d.getTime() - now.getTime()) / 60_000);
  if (m <= 0) return 'now';
  if (m < 60) return `in ${m}`;
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', padding: layout.contentMargin, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  name: { fontSize: hig('title').size, fontWeight: '700', letterSpacing: hig('title').ls, color: colors.ink },
  meta: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 2 },
    liveBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.pearl, borderRadius: radius.pill, paddingHorizontal: control.chipPaddingH - 2, paddingVertical: control.chipPaddingV - 2, marginHorizontal: layout.contentMargin, marginTop: spacing.sm },
  liveText: { fontSize: hig('footnote').size, color: colors.muted48, flex: 1 },
  seqList: { paddingHorizontal: spacing.sm },
  seqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 1, paddingHorizontal: spacing.sm, gap: spacing.sm },
  seqNum: { width: 28, fontSize: hig('footnote').size, fontWeight: '700', color: colors.muted48 },
  seqName: { flex: 1, fontSize: hig('subheadline').size, fontWeight: '600' },
  seqDir: { fontSize: hig('caption').size, color: colors.muted48 },
  depList: { paddingHorizontal: spacing.sm },
  depRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 1, paddingHorizontal: spacing.sm, gap: spacing.sm },
  rowMid: { flex: 1 },
  depHead: { fontSize: hig('subheadline').size, fontWeight: '700' },
  depSub: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 1 },
  timeCol: { minWidth: 58, alignItems: 'flex-end' },
  depTime: { fontSize: hig('subheadline').size, fontWeight: '800' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.dividerSoft, marginLeft: 72 },
  fine: { textAlign: 'center', fontSize: hig('caption').size, color: colors.muted48, marginTop: spacing.xl, paddingHorizontal: layout.contentMargin },
});