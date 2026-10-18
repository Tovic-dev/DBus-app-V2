import { useCallback, useState, useEffect, useMemo } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { Squircle } from '../../src/design/squircle/Squircle';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { useNearbyStops, useDepartures } from '../../src/hooks';
import { getCurrentLocation } from '../../src/location/service';
import { RouteBadge } from '../../src/components/ui-badges';
import { SearchField, Loading } from '../../src/components/ui-input';
import { colors, spacing, control, layout, hig, softShadow } from '../../src/design/tokens';
import { stableNow, countdownLabel } from '../../src/lib/time';
import { humanDistance } from '../../src/lib/geo';
import { getFavorites, getRecents, subscribeFavorites } from '../../src/favorites';
import { useI18n } from '../../src/i18n';

type Status = 'locating' | 'denied' | 'done' | 'error';

function greetingKey(): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 20) return 'greeting_afternoon';
  return 'greeting_evening';
}

function relativeLabel(at: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const min = Math.floor((Date.now() - at) / 60_000);
  if (min < 1) return t('now');
  if (min < 60) return t('min_ago', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('hours_ago', { n: h });
  const d = Math.floor(h / 24);
  if (d === 1) return t('yesterday');
  if (d < 7) return t('days_ago', { n: d });
  return t('long_ago');
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('locating');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [favVersion, setFavVersion] = useState(0);

  // Auto-localiza al abrir: sin botones, la tarjeta aparece directamente.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getCurrentLocation();
      if (cancelled) return;
      if (result.status === 'granted') {
        setCoords({ lat: result.latitude, lon: result.longitude });
        setStatus('done');
      } else {
        setStatus(result.status === 'denied' ? 'denied' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => subscribeFavorites(() => setFavVersion((v) => v + 1)), []);

  const nearbyQuery = useNearbyStops(coords?.lat ?? 0, coords?.lon ?? 0, 1000, 5);
  const nearest = nearbyQuery.data?.[0] ?? null;
  const at = stableNow();
  const favorites = getFavorites();
  const recents = getRecents().slice(0, 4);
  void favVersion;

  const retryLocate = useCallback(async () => {
    setStatus('locating');
    const result = await getCurrentLocation();
    if (result.status === 'granted') {
      setCoords({ lat: result.latitude, lon: result.longitude });
      setStatus('done');
    } else {
      setStatus(result.status === 'denied' ? 'denied' : 'error');
    }
  }, []);

  const goToRecent = (kind: string, id: string) =>
    router.push(kind === 'route' ? `/routes/${id}` : `/stops/${id}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.greetingSmall}>{t(greetingKey())}</Text>
      <Text style={styles.greetingBig}>{t('home_where')}</Text>

      <SearchField value="" onChangeText={(_t) => router.navigate('/(tabs)/plan')} onPress={() => router.navigate('/(tabs)/plan')} placeholder={t('search_placeholder')} />

      <GlassCard
        variant="light"
        padding={layout.cardGap + spacing.sm}
        style={[styles.nearCard, softShadow]}
      >
        <View style={styles.nearHead}>
          <Text style={styles.nearTitle}>{t('nearest_stop')}</Text>
          {status === 'done' && nearest ? (
            <View style={styles.distChip}>
              <SFSymbolIcon name="figure.walk" size={15} color={colors.primary} />
              <Text style={styles.distText}>{humanDistance(nearest.distance_m)}</Text>
            </View>
          ) : null}
        </View>

        {status !== 'done' ? (
          status === 'locating' ? (
            <Loading label={t('finding_nearest')} />
          ) : (
            <Pressable onPress={retryLocate} accessibilityRole="button" accessibilityLabel={t('enable_location')} style={styles.locBtn}>
              <SFSymbolIcon name="location.fill" size={20} color={colors.primary} />
              <Text style={styles.locText}>{t('enable_location')}</Text>
              <SFSymbolIcon name="arrow.clockwise" size={16} color={colors.muted48} />
            </Pressable>
          )
        ) : !nearest ? (
          <Text style={styles.locText}>{t('no_stops_near')}</Text>
        ) : (
          <>
            <Pressable onPress={() => router.push(`/stops/${nearest.stop_id}`)} accessibilityRole="button" accessibilityLabel={`Parada ${nearest.stop_name}`}>
              <Text style={styles.stopName}>{nearest.stop_name}</Text>
            </Pressable>
            <Text style={styles.linesLabel}>{t('lines')}</Text>
            <NearbyBadges stopId={nearest.stop_id} />
            <Text style={styles.linesLabel}>{t('arrivals')}</Text>
            <NearestArrivals stopId={nearest.stop_id} at={at} />
          </>
        )}
      </GlassCard>

      {/* Favoritos */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitleSolo}>{t('favorites')}</Text>
        <Pressable onPress={() => router.navigate('/(tabs)/saved')} accessibilityRole="button" accessibilityLabel={t('see_all')} hitSlop={8}>
          <Text style={styles.sectionAction}>{t('see_all')}</Text>
        </Pressable>
      </View>
      {favorites.length === 0 ? (
        <Text style={styles.favEmpty}>{t('favorites_empty')}</Text>
      ) : (
        <View style={styles.favGrid}>
          {favorites.slice(0, 4).map((f, i) => (
            <Pressable key={f.id}
              onPress={() => router.push(f.kind === 'route' ? `/routes/${f.id}` : `/stops/${f.id}`)}
              accessibilityRole="button" accessibilityLabel={f.label} style={styles.favTile}>
              <Squircle level="small" backgroundColor={`${colors.primary}12`} style={styles.favIcon}>
                <SFSymbolIcon name="bus.fill" size={22} color={colors.primary} />
              </Squircle>
              <Text style={styles.favTileText} numberOfLines={1}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Actividad reciente */}
      {recents.length > 0 && (
        <View style={styles.recentBlock}>
          <Text style={styles.sectionTitleSolo}>{t('recent_activity')}</Text>
          {recents.map((r) => (
            <Pressable key={`${r.kind}-${r.id}`} onPress={() => goToRecent(r.kind, r.id)} accessibilityRole="button" accessibilityLabel={r.label} style={styles.recentRow}>
              <View style={styles.recentIcon}>
                <SFSymbolIcon name="bus.fill" size={17} color={colors.primary} />
              </View>
              <Text style={styles.recentLabel} numberOfLines={1}>{r.label}</Text>
              <Text style={styles.recentDate}>{relativeLabel(r.at, t as (key: string, params?: Record<string, string | number>) => string)}</Text>
              <SFSymbolIcon name="chevron.forward" size={16} color={colors.muted48} />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.legal}>{t('home_legal')}</Text>
    </ScrollView>
  );
}

/** Badges de las líneas que pasan por la parada (derivadas de las llegadas). */
function NearbyBadges({ stopId }: { stopId: string }) {
  const depQuery = useDepartures(stopId, stableNow(), 12, Boolean(stopId));
  const deps = depQuery.data?.departures ?? [];
  const seen = new Set<string>();
  const lines = deps.filter((d) => (seen.has(d.route_short_name) ? false : (seen.add(d.route_short_name), true))).slice(0, 3);
  if (lines.length === 0) return <Text style={styles.noDeps}>—</Text>;
  return (
    <View style={styles.badgeRow}>
      {lines.map((d) => <RouteBadge key={d.route_id} shortName={d.route_short_name} size={40} />)}
    </View>
  );
}

function NearestArrivals({ stopId, at }: { stopId: string; at: string }) {
  const { t } = useI18n();
  const depQuery = useDepartures(stopId, at, 20, Boolean(stopId));
  const deps = depQuery.data?.departures ?? [];

  // Agrupar por línea, conservar solo la llegada más cercana de cada una,
  // orden ascendente y mostrar únicamente las 2 más próximas.
  const nextPerLine = useMemo(() => {
    const byLine = new Map<string, { route_short_name: string; scheduled_departure: string; time: number }>();
    deps.forEach((d) => {
      const time = new Date(d.scheduled_departure).getTime();
      const ex = byLine.get(d.route_short_name);
      if (!ex || time < ex.time) byLine.set(d.route_short_name, { route_short_name: d.route_short_name, scheduled_departure: d.scheduled_departure, time });
    });
    return Array.from(byLine.values()).sort((a, b) => a.time - b.time).slice(0, 2);
  }, [deps]);

  if (depQuery.isLoading) return <Loading label={t('loading_arrivals')} />;
  if (nextPerLine.length === 0) return <Text style={styles.noDeps}>{t('no_arrivals')}</Text>;
  return (
    <View style={styles.arrivalRow}>
      {nextPerLine.map((d, i) => {
        const label = countdownLabel(d.scheduled_departure);
        const display = label === 'now' ? t('now') : label.replace('in ', '');
        return (
          <View key={`${d.route_short_name}-${i}`} style={styles.arrivalItem}>
            <Text style={styles.arrivalMin}>{display}</Text>
            <SFSymbolIcon name="wifi" size={11} color={colors.primary} style={styles.arrivalWave} />
            <Text style={styles.arrivalLine}>{d.route_short_name}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: layout.bottomScroll },
  greetingSmall: { fontSize: hig('body').size, fontWeight: '600', color: colors.ink, paddingHorizontal: layout.contentMargin, marginTop: spacing.sm },
  greetingBig: { fontSize: hig('largeTitle').size, fontWeight: '700', letterSpacing: hig('largeTitle').ls, color: colors.ink, paddingHorizontal: layout.contentMargin, marginBottom: spacing.md },
  // Glass: the material layer owns background/border; this style carries layout
  // only. Padding must NOT live here — GlassSurface paints its material at the
  // host's CONTENT box, so host padding would inset the visible glass and narrow
  // the card. The card's inner padding is passed via GlassCard's `padding` prop.
  nearCard: { marginHorizontal: layout.contentMargin, marginTop: spacing.lg },
  nearHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nearTitle: { fontSize: hig('headline').size, fontWeight: '700', color: colors.ink },
  distChip: { flexDirection: 'row', alignItems: 'center', gap: control.groupTitleGap - 2 },
  distText: { color: colors.primary, fontWeight: '700', fontSize: hig('subheadlineStrong').size },
  stopName: { fontSize: hig('title').size, fontWeight: '700', letterSpacing: hig('title').ls, color: colors.ink, marginTop: spacing.sm },
  linesLabel: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: spacing.md, marginBottom: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  arrivalRow: { flexDirection: 'row', gap: spacing.lg },
  arrivalItem: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  arrivalMin: { fontSize: hig('title').size, fontWeight: '700', color: colors.ink, letterSpacing: hig('title').ls },
  arrivalWave: { marginBottom: 5 },
  arrivalLine: { fontSize: hig('caption').size, color: colors.muted48, marginBottom: control.groupTitleGap - 2, marginLeft: 2 },
  noDeps: { fontSize: hig('footnote').size, color: colors.muted48 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  locText: { flex: 1, fontSize: hig('footnote').size, color: colors.muted48 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.contentMargin, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitleSolo: { fontSize: hig('title3').size, fontWeight: '700', letterSpacing: hig('title3').ls, color: colors.ink },
  sectionAction: { color: colors.primary, fontWeight: '700', fontSize: hig('subheadlineStrong').size },
  favEmpty: { fontSize: hig('footnote').size, color: colors.muted48, paddingHorizontal: layout.contentMargin },
  favGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: layout.contentMargin },
  favTile: { width: 76, alignItems: 'center', gap: control.groupTitleGap },
  favIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  favTileText: { fontSize: hig('caption').size, color: colors.ink, fontWeight: '600' },
  recentBlock: { marginTop: spacing.xl, paddingHorizontal: layout.contentMargin },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: control.rowPaddingV, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  recentIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' },
  recentLabel: { flex: 1, fontSize: hig('subheadlineStrong').size, fontWeight: '600', color: colors.ink },
  recentDate: { fontSize: hig('footnote').size, color: colors.muted48 },
  legal: { textAlign: 'center', fontSize: hig('caption').size, color: colors.muted48, marginTop: spacing.xl },
});
