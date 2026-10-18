import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
import { router } from 'expo-router';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { useStops, useDepartures } from '../../src/hooks';
import { getCurrentLocation } from '../../src/location/service';
import { Loading, Empty } from '../../src/components/ui-input';
import { RouteBadge } from '../../src/components/ui-badges';
import { UnifiedSurface, type Snap, type UnifiedSurfaceHandle } from '../../src/components/UnifiedSurface';
import { colors, radius, spacing, control, layout, hig, productShadow } from '../../src/design/tokens';
import { geometry } from '../../src/design/squircle/squircleTokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Squircle } from '../../src/design/squircle/Squircle';
import { routeColor } from '../../src/design/routeColors';
import { humanDistance } from '../../src/lib/geo';
import { stableNow, countdownLabel } from '../../src/lib/time';
import { toggleFavorite, isFavorite, getFavorites, subscribeFavorites } from '../../src/favorites';
import { setTabBarHidden } from '../../src/components/tabBarVisibility';
import { haptics } from '../../src/design/haptics';
import { useI18n } from '../../src/i18n';
import type { Stop } from '../../src/api/types';

/** Donostia / San Sebastián — fallback region when location is denied. */
const DONOSTIA: Region = {
  latitude: 43.3183,
  longitude: -1.9812,
  latitudeDelta: 0.05,
  longitudeDelta: 0.03,
};

type Status = 'idle' | 'locating' | 'done' | 'denied' | 'error';

/* ── Camera focus (Phase M-3, Feature 1 & 6) ─────────────────────────────
 * When a stop is selected we center the map on it and shift the camera center
 * north so the marker sits in the visible strip ABOVE the bottom sheet (which
 * covers the lower ~46% at the default medium snap). Values are documented:
 *  - CAMERA_DURATION_MS: animateToRegion duration (react-native-maps native).
 *    Slightly slower than the 400ms used by recenter for a calmer Apple Maps
 *    settle.
 *  - STOP_FOCUS_DELTA: latitudeDelta used when focusing a stop (0.018 deg ~=
 *    2.0 km of viewport height at 111.2 km/deg). Rationale: close enough that
 *    the picked pin dominates, wide enough to keep ~8-12 neighbouring stops and
 *    the whole district in view. It is a CEILING, never a forced zoom-out: the
 *    current region delta is used when it is already tighter (see regionRef),
 *    so selecting a stop never throws the user away from a zoomed-in view.
 *  - SNAP_SHIFT_RATIOS[snap]: fraction of latitudeDelta the camera centre is
 *    moved SOUTH of the stop. Because latitude grows northwards and screen Y
 *    grows downwards, centring south of the marker is what lifts the marker UP
 *    the screen. A marker then renders at (0.5 - ratio) of the screen height
 *    measured from the top, so the value is screen-size independent:
 *      snap 0 (collapsed, sheet covers ~28%) -> 0.10 -> marker at 40% from top
 *      snap 1 (medium,   sheet covers ~58%) -> 0.22 -> marker at 28% from top
 *      snap 2 (expanded, sheet covers ~94%) -> 0.22 -> marker behind the sheet
 *        by design: at 94% coverage Apple Maps also gives the screen to the
 *        detail card; forcing the pin visible would need a district-destroying
 *        zoom-out. Selection always opens at snap 1, where it IS visible.
 *    Derivation for snap 1 on iPhone 15 Pro (852pt, bottom inset 34):
 *    sheetBottomInset = 34 + 2 (spacing) + 56 (tabBar) + 4 (seam) = 96;
 *    covered = 96 + 0.46*852 = 488 -> visible strip = top 364pt (~43%).
 *    Marker at 0.28*852 = 239pt -> 125pt of clearance above the sheet, and the
 *    42pt pin+tail (anchor y=1) spans 197..239pt: fully clear. Same ratio on
 *    iPhone SE (667pt, inset 10): covered 385, visible 282, marker at 187pt.
 * animateToRegion / onRegionChangeComplete / onPress are all provided by
 * react-native-maps 1.27.2 (verified in MapView.d.ts L342/L369/L646) — no
 * animation library is introduced, and no zoom-on-snap (Feature 2) is applied:
 * see PHASE_M3_FINDINGS.md for the stability reasoning.
 * ─────────────────────────────────────────────────────────────────────── */
const CAMERA_DURATION_MS = 460;
const STOP_FOCUS_DELTA = 0.018;
const SNAP_SHIFT_RATIOS: Record<Snap, number> = { 0: 0.1, 1: 0.22, 2: 0.22 };

/** Haversine distance in meters (for stops that don't come from /nearby). */
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const surfaceRef = useRef<UnifiedSurfaceHandle>(null);
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [selected, setSelected] = useState<Stop | null>(null);
  const [sheetSnap, setSheetSnap] = useState<Snap>(0);
  // Bumped by the favorites observable (see below) so the marker favorite rings
  // stay in sync with toggles made on ANY screen, not only from this sheet.
  const [favVersion, setFavVersion] = useState(0);

  // Floating tab bar height (wrap padding) so the sheet never hides behind it.
  const sheetVisible = selected !== null;

  // Pill→sheet morph: the sheet grows out of the navigation capsule, so its
  // entry position is the tab bar's own bottom offset (Apple Maps behaviour
  // where the bottom bar extends upward into the place card).
  const insets = useSafeAreaInsets();
  const tabRestInset = Math.max(insets.bottom, 10) + geometry.tabBarBottomSpacing;

  // Sin parada → sheet cerrado; con parada → se abre en estado medio (Apple Maps).
  useEffect(() => {
    const s: Snap = selected ? 1 : 0;
    setSheetSnap(s);
  }, [selected]);

  // Apple Maps place-card behaviour: while the sheet is open it extends to
  // the bottom edge and the floating tab bar hides itself.
  useEffect(() => {
    setTabBarHidden(sheetVisible);
    return () => setTabBarHidden(false);
  }, [sheetVisible]);

  // TODAS las paradas del dataset GTFS.
  // NOTA: el backend limita `limit` a 500 (Query le=500, sin paginación);
  // pedir más devuelve 422 y deja el array vacío (sin marcadores).
  const allStopsQ = useStops(500);
  const allStops: Stop[] = allStopsQ.data?.stops ?? [];

  // (Nearby stops are fetched by the Inicio screen; the map sheet only shows
  // an explicitly selected stop — no fallback, no default stop.)

  const selectedStop = useMemo(() => {
    // ONLY the explicitly selected stop (Marker tap). No fallback: a default
    // stop made the sheet read as "always active" with someone else's stop.
    if (!selected) return null;
    const withDist = selected as Stop & { distance_m?: number };
    const dist = coords ? haversineM(coords.lat, coords.lon, selected.stop_lat, selected.stop_lon) : (withDist.distance_m ?? 0);
    return { ...selected, distance_m: dist };
  }, [selected, coords]);

  const at = stableNow();
  const depQuery = useDepartures(selected?.stop_id ?? '', at, 20, Boolean(selected));
  const servingRoutes = Array.from(new Map((depQuery.data?.departures ?? []).map((d) => [d.route_id, d])).values());

  const locate = useCallback(async () => {
    setStatus('locating');
    const result = await getCurrentLocation();
    if (result.status === 'granted') {
      setCoords({ lat: result.latitude, lon: result.longitude });
      setStatus('done');
      mapRef.current?.animateToRegion({ latitude: result.latitude, longitude: result.longitude, latitudeDelta: 0.02, longitudeDelta: 0.012 }, 400);
    } else if (result.status === 'denied') {
      setStatus('denied');
    } else {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'idle') void locate();
  }, [status, locate]);

  /* ── Phase M-3 — Selection lifecycle + smart camera ───────────────────── */
  // Favorite stop ids resolved once per favorites change. A Set keeps the
  // per-marker test O(1) across all 542 markers (no isFavorite call per marker).
  const favoriteSet = useMemo(() => {
    const s = new Set<string>();
    for (const f of getFavorites()) if (f.kind === 'stop') s.add(f.id);
    return s;
  }, [favVersion]);

  // Keep the rings in sync with favorites toggled anywhere in the app (same
  // observable pattern used by (tabs)/saved.tsx). Toggles are rare, user-driven
  // events, so this costs one rerender per toggle — never one per frame.
  useEffect(() => subscribeFavorites(() => setFavVersion((v) => v + 1)), []);

  // Last settled region, held in a REF (not state) so pan/zoom never rerenders
  // the 542-marker tree. Used so focusing a stop never zooms the user out.
  const regionRef = useRef<Region>(DONOSTIA);
  const onRegionSettled = useCallback((region: Region) => {
    regionRef.current = region;
  }, []);

  /**
   * Feature 1 + 4: centre on the stop, then shift the camera SOUTH of it so the
   * marker is lifted into the visible strip above the sheet (sign and ratio are
   * derived in the constants block above).
   *
   * `snap` is passed explicitly because it is the snap the sheet is OPENING at;
   * the setSheetSnap from the same press handler is not visible in this closure.
   */
  const focusStop = useCallback((stop: Stop, snap: Snap) => {
    const { width, height } = Dimensions.get('window');
    // STOP_FOCUS_DELTA is a ceiling: a tighter current view is preserved.
    const latitudeDelta = Math.min(regionRef.current.latitudeDelta || STOP_FOCUS_DELTA, STOP_FOCUS_DELTA);
    // Aspect-match the span to the viewport so iOS does not reinterpret it
    // (0.46 on a 393x852 iPhone, ~0.56 on an SE).
    const longitudeDelta = latitudeDelta * (width / Math.max(height, 1));
    const shift = latitudeDelta * SNAP_SHIFT_RATIOS[snap];
    mapRef.current?.animateToRegion(
      {
        latitude: stop.stop_lat - shift, // SOUTH of the marker lifts it UP-screen
        longitude: stop.stop_lon,
        latitudeDelta,
        longitudeDelta,
      },
      CAMERA_DURATION_MS,
    );
  }, []);

  // Feature 5: tapping empty map deselects → sheet closes, map/sheet stay in sync.
  const deselect = useCallback(() => setSelected(null), []);

  return (
    <View style={styles.container}>
      {/* MapView with the 542 stop markers (restored after the Phase I-25C bisect; M-3 added camera framing + marker states). */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DONOSTIA}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        // Ignore map presses that are actually marker taps: react-native-maps
        // fires MapView.onPress AFTER Marker.onPress for the same touch (iOS),
        // which deselected the stop immediately and made the sheet look dead.
        onPress={(e) => {
          const action = (e.nativeEvent as { action?: string } | undefined)?.action;
          if (action === 'marker-press') return;
          // Start the hide animation synchronously in this tap handler — no
          // state-update/re-render round-trip before the sheet begins moving.
          surfaceRef.current?.dismiss();
          deselect();
        }}
        onRegionChangeComplete={onRegionSettled}
      >
        {allStops.map((s) => (
          <Marker
            key={s.stop_id}
            coordinate={{ latitude: s.stop_lat, longitude: s.stop_lon }}
            onPress={() => {
              haptics.selection();
              setSelected(s);
              setSheetSnap(1);
              // Feature 1: the sheet always opens at the medium snap, so the
              // camera is framed for snap 1 explicitly (the state update above
              // is not visible inside this handler yet).
              focusStop(s, 1);
            }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[
              styles.pinWrap,
              favoriteSet.has(s.stop_id) && styles.pinWrapFavorite,
              // Active marker is tied to the explicit selection (which is what
              // opens the sheet) so marker and sheet stay in sync (Feature 5).
                            selected?.stop_id === s.stop_id && styles.pinWrapActive,
            ]}>
              <SFSymbolIcon name="bus.fill" size={13} color="#fff" />
            </View>
            <View style={styles.pinTail} />
          </Marker>
        ))}
      </MapView>

      <Pressable onPress={locate} accessibilityRole="button" accessibilityLabel="Recentrar" style={styles.recenter}>
        <SFSymbolIcon name="location.viewfinder" size={22} color="#fff" />
      </Pressable>

      <UnifiedSurface ref={surfaceRef} visible={sheetVisible} snap={sheetSnap} onSnapChange={setSheetSnap} onDismiss={deselect} restInset={tabRestInset}>
        {(snap) => {
          if (!selectedStop) {
            return (
              <View style={styles.sheetBody}>
                {status === 'denied' ? (
                  <Empty label={t('enable_location_map')} />
                ) : status === 'locating' ? (
                  <Loading label={t('finding_location')} />
                ) : (
                  <Empty label={t('tap_pin')} />
                )}
              </View>
            );
          }
          const fav = isFavorite(selectedStop.stop_id);
          return (
            <View style={styles.sheetBody}>
              {/* Cabecera — siempre visible (colapsado+). Sparring & jerarquía
                  reforzados: título en grande, subtítulo secundario con aire,
                  acción de favorito como círculo flotante equilibrado. */}
              <View style={styles.sheetHeader}>
                <View style={styles.headRow}>
                  <View style={styles.headText}>
                    <Text style={styles.stopName}>{selectedStop.stop_name}</Text>
                    <Text style={styles.stopSub}>{humanDistance(selectedStop.distance_m)} {t('of_you')}</Text>
                  </View>
                  <Pressable
                    onPress={() => { const added = !isFavorite(selectedStop.stop_id); haptics.favorite(added); toggleFavorite({ id: selectedStop.stop_id, kind: 'stop', label: selectedStop.stop_name }); }}
                    accessibilityRole="button" accessibilityLabel={fav ? t('remove_fav') : t('add_fav')} hitSlop={8} style={styles.favBtn}
                  >
                    <SFSymbolIcon name={fav ? 'heart.fill' : 'heart'} size={22} color={fav ? colors.primary : colors.muted48} />
                  </Pressable>
                </View>
              </View>

              {/* Medio+ : próximas llegadas por línea */}
              {snap >= 1 && (
                depQuery.isLoading ? (
                  <Loading label={t('loading_lines')} />
                ) : servingRoutes.length > 0 ? (
                  <NextArrivals stopId={selectedStop.stop_id} at={at} />
                ) : (
                  <Text style={styles.chipEmpty}>{t('no_departures_this_stop')}</Text>
                )
              )}

              {/* Expandido : acciones completas */}
              {snap === 2 && (
                <View style={styles.expandedActions}>
                  <Pressable onPress={() => router.push(`/stops/${selectedStop.stop_id}`)} accessibilityRole="button" accessibilityLabel={t('view_schedules')} style={styles.primaryBtn}>
                    <SFSymbolIcon name="clock" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>{t('view_schedules')}</Text>
                  </Pressable>
                  {servingRoutes.slice(0, 4).map((d) => (
                    <Squircle key={d.route_id} level="small" backgroundColor={colors.canvas} border={{ color: routeColor(d.route_short_name) }} style={styles.lineBtn}>
                    <Pressable onPress={() => router.push(`/routes/${d.route_id}`)} accessibilityRole="button" accessibilityLabel={`${t('line')} ${d.route_short_name}`} style={styles.lineBtnInner}>
                      <RouteBadge shortName={d.route_short_name} size={28} />
                      <Text style={styles.lineBtnText} numberOfLines={1}>{d.headsign ?? t('line')}</Text>
                      <SFSymbolIcon name="chevron.forward" size={16} color={colors.muted48} />
                    </Pressable>
                    </Squircle>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      </UnifiedSurface>
    </View>
  );
}

/**
 * Next arrival per line for the selected stop.
 * Reuses the SAME departures query the parent already runs (identical
 * queryKey → served from React Query cache, no extra network request).
 * Shows only the soonest departure per line, sorted ascending by time.
 */
function NextArrivals({ stopId, at }: { stopId: string; at: string }) {
  const { t } = useI18n();
  const depQuery = useDepartures(stopId, at, 20, Boolean(stopId));
  const deps = depQuery.data?.departures ?? [];

  const nextPerLine = useMemo(() => {
    const byLine = new Map<string, { route_short_name: string; route_id: string; scheduled_departure: string; time: number }>();
    deps.forEach((d) => {
      const time = new Date(d.scheduled_departure).getTime();
      const ex = byLine.get(d.route_short_name);
      if (!ex || time < ex.time) {
        byLine.set(d.route_short_name, { route_short_name: d.route_short_name, route_id: d.route_id, scheduled_departure: d.scheduled_departure, time });
      }
    });
    return Array.from(byLine.values()).sort((a, b) => a.time - b.time).slice(0, 6);
  }, [deps]);

  if (depQuery.isLoading) return <Loading label={t('loading_arrivals')} />;
  if (nextPerLine.length === 0) return <Text style={styles.chipEmpty}>{t('no_departures_this_stop')}</Text>;

  return (
    <View style={styles.arrivalList}>
      {nextPerLine.map((row) => {
        const label = countdownLabel(row.scheduled_departure);
        const display = label === 'now' ? t('now') : label === '—' ? t('no_data') : label.replace('in ', '').replace(' min', ' min');
        return (
          <Pressable key={row.route_id} onPress={() => router.push(`/routes/${row.route_id}`)} accessibilityRole="button" accessibilityLabel={`${t('line')} ${row.route_short_name}`} style={styles.arrivalRow}>
            <RouteBadge shortName={row.route_short_name} size={34} />
            <View style={styles.arrivalLineInfo}>
              <Text style={styles.arrivalLineName}>{t('line')} {row.route_short_name}</Text>
            </View>
            <Text style={[styles.arrivalTime, { color: routeColor(row.route_short_name) }]}>{display}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  pinWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  // Selected marker (Feature 3): larger + lifted so it reads clearly over the
  // 542-marker field. productShadow gives the Apple "picked pin" elevation.
  pinWrapActive: { backgroundColor: colors.primaryFocus, width: 36, height: 36, borderRadius: 18, ...productShadow },
  // Favorite marker: subtle gold ring hint. Kept as a style-only change (no
  // extra nodes) to preserve 542-marker performance. Selected overrides it via
  // array order.
  pinWrapFavorite: { borderWidth: 3, borderColor: 'rgba(252,214,10,0.95)' },
  pinTail: { width: 0, height: 0, alignSelf: 'center', borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff', marginTop: -1 },
  recenter: { position: 'absolute', right: layout.floatInset, bottom: layout.bottomScroll + spacing.xl, width: layout.fabSize, height: layout.fabSize, borderRadius: layout.fabSize / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...productShadow },
  sheetBody: { paddingHorizontal: layout.contentMargin, paddingBottom: layout.fabSize + spacing.md, minHeight: 70 },
  sheetHeader: { paddingTop: spacing.xs, marginBottom: spacing.sm },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  headText: { flex: 1, paddingRight: spacing.sm },
  stopName: { fontSize: hig('title').size, fontWeight: '700', letterSpacing: hig('title').ls, color: colors.ink },
  stopSub: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 3 },
  favBtn: { width: control.minTouch - 4, height: control.minTouch - 4, borderRadius: control.minTouch / 2 - 2, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }, // sobre el mapa siempre oscuro-subyacente; deliberado (pin over map, no themed surface)
  expandedActions: { marginTop: spacing.md, gap: spacing.xs },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: control.rowPaddingV - 1 },
  primaryBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: hig('callout').size },
  lineBtn: { },
  lineBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  lineBtnText: { flex: 1, fontSize: hig('footnote').size, fontWeight: '600', color: colors.ink },
  arrivalList: { marginTop: spacing.md, gap: 2 },
  arrivalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.groupTitleGap + 3, gap: spacing.sm },
  arrivalLineInfo: { flex: 1 },
  arrivalLineName: { fontSize: hig('subheadline').size, fontWeight: '600', color: colors.ink },
  arrivalTime: { fontSize: hig('callout').size, fontWeight: '800' },
  chipEmpty: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: spacing.md },
});