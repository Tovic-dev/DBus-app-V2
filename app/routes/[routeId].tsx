import { useState, useMemo, useEffect } from 'react';
import { Text, View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { useRoute, useRouteStops } from '../../src/hooks';
import { RouteBadge, OptionPills } from '../../src/components/ui-badges';
import { Loading, Empty, ErrorState } from '../../src/components/ui-input';
import { colors, radius, spacing, control, layout, hig } from '../../src/design/tokens';
import { routeColor as routeColorFor } from '../../src/design/routeColors';
import { toggleFavorite, isFavorite } from '../../src/favorites';
import type { RouteStop } from '../../src/api/types';

type DirKey = number | 'none';

interface DirInfo {
  id: number | null;
  key: DirKey;
  label: string;
  count: number;
}

function normalizeDir(d: number | null): DirKey {
  return d === null ? 'none' : d;
}

export default function RouteDetailScreen() {
  const { routeId: raw } = useLocalSearchParams<{ routeId: string }>();
  const routeId = Array.isArray(raw) ? raw[0] : raw;

  const routeQuery = useRoute(routeId);
  const stopsQuery = useRouteStops(routeId);

  const rawStops = stopsQuery.data?.stops ?? [];

  // Group stops into directions (Phase 2).
  const directions = useMemo(() => {
    const groups = new Map<DirKey, RouteStop[]>();
    rawStops.forEach((s) => {
      const key = normalizeDir(s.direction_id);
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    });
    const list: DirInfo[] = [];
    groups.forEach((rows, key) => {
      const dirId = key === 'none' ? null : (key as number);
      const label = rows.find((r) => r.headsign)?.headsign ?? `Direction ${dirId ?? 0}`;
      list.push({ id: dirId, key, label, count: rows.length });
    });
    return list;
  }, [rawStops]);

  const [selectedKey, setSelectedKey] = useState<DirKey | null>(null);
  useEffect(() => {
    if (!directions.length) {
      setSelectedKey(null);
    } else if (!directions.some((d) => d.key === selectedKey)) {
      setSelectedKey(directions[0].key);
    }
  }, [directions, selectedKey]);

  const deduped = useMemo(() => {
    // FIX: `!selectedKey` was falsy for direction 0, leaving that whole
    // direction empty. Only `null` (nothing selected yet) means empty.
    if (selectedKey === null) return [];
    const rows = rawStops.filter((s) => normalizeDir(s.direction_id) === selectedKey);
    return dedupeStops(rows);
  }, [rawStops, selectedKey]);

  const routeName = routeQuery.data?.route_short_name ?? routeId ?? '—';
  const routeColor = routeColorFor(headerName(routeName, routeQuery.data?.route_long_name));

  const header = (
    <View>
      <View style={styles.header}>
        <RouteBadge shortName={routeName} size={56} color={routeColor} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.routeLong} numberOfLines={2}>{headerName(routeName, routeQuery.data?.route_long_name)}</Text>
          <Text style={styles.routeType}>Línea urbana · Donostia</Text>
        </View>
        <Pressable
          onPress={() => toggleFavorite({ id: routeId ?? '', kind: 'route', label: routeName, sublabel: routeQuery.data?.route_long_name ?? undefined })}
          accessibilityRole="button"
          accessibilityLabel="Toggle favorite"
          hitSlop={8}>
          <SFSymbolIcon name={isFavorite(routeId ?? '') ? 'heart.fill' : 'heart'} size={24} color={isFavorite(routeId ?? '') ? colors.primary : colors.muted48} />
        </Pressable>
      </View>

      {directions.length > 1 && (
        <View style={styles.dirBar}>
          <OptionPills
            options={directions.map((d) => ({ value: String(d.key), label: d.label }))}
            value={selectedKey == null ? '' : String(selectedKey)}
            onChange={(v) => setSelectedKey(parseKey(v))}
          />
        </View>
      )}

      {deduped.length > 1 && (
        <View style={styles.mapStrip}>
          <RouteStrip stops={deduped} tint={routeColor} />
          <Text style={styles.dirLabel}>
            {directions.find((d) => d.key === selectedKey)?.label ?? ''}
          </Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Paradas</Text>
        <Text style={styles.listCount}>{deduped.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={deduped}
        keyExtractor={(item) => `${item.trip_id}-${item.stop_id}-${item.stop_sequence}`}
        renderItem={({ item }) => <StopRow item={item} tint={routeColor} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          stopsQuery.isLoading ? (
            <Loading label="Cargando paradas…" />
          ) : stopsQuery.isError ? (
            <ErrorState label="No se pudieron cargar las paradas." onRetry={() => stopsQuery.refetch()} />
          ) : (
            <Empty label="Selecciona un sentido para ver las paradas" />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={undefined}
      />
    </View>
  );
}

function parseKey(v: string): DirKey {
  if (v === 'none') return 'none';
  const n = Number(v);
  return Number.isNaN(n) ? 'none' : n;
}

function headerName(short: string, long?: string | null): string {
  return long ? `${short} · ${long}` : short;
}

function dedupeStops(rows: RouteStop[]): RouteStop[] {
  const seen = new Map<string, RouteStop>();
  rows
    .slice()
    .sort((a, b) => a.stop_sequence - b.stop_sequence)
    .forEach((r) => {
      const ex = seen.get(r.stop_id);
      if (!ex || r.stop_sequence < ex.stop_sequence) seen.set(r.stop_id, r);
    });
  return Array.from(seen.values()).sort((a, b) => a.stop_sequence - b.stop_sequence);
}

function StopRow({ item, tint }: { item: RouteStop; tint: string }) {
  return (
    <Pressable onPress={() => router.push(`/stops/${item.stop_id}`)} accessibilityRole="button" accessibilityLabel={`Parada ${item.stop_name}`} style={styles.stopRow}>
      <View style={[styles.stopDot, { backgroundColor: tint }]}>
        <View style={styles.stopDotInner} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stopName} numberOfLines={2}>{item.stop_name}</Text>
        {item.headsign ? <Text style={styles.stopHead} numberOfLines={1}>{item.headsign}</Text> : null}
      </View>
      <Text style={styles.stopSeq}>{item.stop_sequence}</Text>
      <SFSymbolIcon name="chevron.forward" size={16} color={colors.muted48} />
    </Pressable>
  );
}

function RouteStrip({ stops, tint }: { stops: RouteStop[]; tint: string }) {
  return (
    <View style={styles.strip}>
      <View style={[styles.stripLine, { backgroundColor: tint }]} />
      {stops.map((s, i) => {
        const frac = stops.length > 1 ? i / (stops.length - 1) : 0.5;
        return (
          <View key={`${s.trip_id}-${s.stop_id}-${s.stop_sequence}`} style={[styles.stripDot, { left: `${Math.min(96, Math.max(4, frac * 100))}%` }]}>
            <View style={[styles.stripCircle, { backgroundColor: tint }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', padding: layout.contentMargin, paddingBottom: spacing.md },
  routeLong: { fontSize: hig('title').size, fontWeight: '700', letterSpacing: hig('title').ls, color: colors.ink },
  routeType: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 2 },
  dirBar: { paddingHorizontal: layout.contentMargin, paddingBottom: spacing.sm },
  mapStrip: { height: 84, paddingHorizontal: layout.contentMargin, marginBottom: spacing.xs },
  strip: { height: 20, justifyContent: 'center', marginVertical: control.groupTitleGap },
  stripLine: { position: 'absolute', left: spacing.xs, right: spacing.xs, top: 9, height: 4, borderRadius: 2 },
  stripDot: { position: 'absolute', top: 2, alignItems: 'center', justifyContent: 'center', width: 24, marginLeft: -12 },
  stripCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: colors.onPrimary },
  dirLabel: { fontSize: hig('footnote').size, fontWeight: '700', color: colors.ink, marginTop: spacing.xs, textAlign: 'center' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.contentMargin, paddingTop: spacing.md, paddingBottom: spacing.xs },
  listTitle: { fontSize: hig('title3').size, fontWeight: '700', letterSpacing: hig('title3').ls, color: colors.ink },
  listCount: { fontSize: hig('footnote').size, fontWeight: '700', color: colors.muted48, backgroundColor: colors.pearl, paddingHorizontal: control.chipPaddingV + 2, paddingVertical: 3, borderRadius: radius.pill, overflow: 'hidden' },
  list: { paddingBottom: layout.bottomScroll },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 2, paddingHorizontal: layout.contentMargin, gap: spacing.md },
  stopDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stopDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onPrimary },
  stopSeq: { fontSize: hig('footnote').size, fontWeight: '700', color: colors.muted48 },
  stopName: { fontSize: hig('callout').size, fontWeight: '600', color: colors.ink },
  stopHead: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 1 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.dividerSoft, marginLeft: 66 },
});