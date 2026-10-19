/**
 * Mapa. Apple Maps base with small transit dots that appear only once you
 * zoom in (and only those on screen), a Liquid Glass location button, and the
 * stop card as a native sheet with medium/large detents.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStops } from '../hooks';
import { getCurrentLocation } from '../location/service';
import { useI18n } from '../i18n';
import { C, T } from '../ui/theme';
import { GlassControl } from '../ui/GlassControl';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import { mapStore } from '../ui/mapStore';
import { useStore } from '../ui/store';
import { useFavorites } from '../ui/useFavorites';
import { haptics } from '../design/haptics';
import type { Stop } from '../api/types';

const DONOSTIA: Region = { latitude: 43.3183, longitude: -1.9812, latitudeDelta: 0.06, longitudeDelta: 0.04 };
/** Stops are drawn only below this span (≈2.5 km tall), like transit POIs in Maps. */
const SHOW_STOPS_DELTA = 0.022;
const MAX_MARKERS = 160;
/** The sheet's medium detent covers the lower ~45%: keep the picked stop above it. */
const SHEET_SHIFT = 0.2;

export default function MapScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DONOSTIA);
  const [userCoord, setUserCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const selected = useStore(mapStore, (s) => s.stop);
  const favs = useFavorites();
  const favIds = useMemo(() => new Set(favs.filter((f) => f.kind === 'stop').map((f) => f.id)), [favs]);

  const stopsQ = useStops(500);
  const zoomedIn = region.latitudeDelta <= SHOW_STOPS_DELTA;
  const visible = useMemo(() => {
    if (!zoomedIn) return [] as Stop[];
    const padLat = region.latitudeDelta * 0.6;
    const padLon = region.longitudeDelta * 0.6;
    return (stopsQ.data?.stops ?? [])
      .filter(
        (s) =>
          Math.abs(s.stop_lat - region.latitude) <= padLat &&
          Math.abs(s.stop_lon - region.longitude) <= padLon,
      )
      .slice(0, MAX_MARKERS);
  }, [stopsQ.data, region, zoomedIn]);

  const goToUser = useCallback(async () => {
    const r = await getCurrentLocation();
    if (r.status !== 'granted') return;
    setUserCoord({ latitude: r.latitude, longitude: r.longitude });
    mapRef.current?.animateToRegion({ latitude: r.latitude, longitude: r.longitude, latitudeDelta: 0.012, longitudeDelta: 0.008 }, 450);
  }, []);

  useEffect(() => {
    void goToUser();
  }, [goToUser]);

  const select = useCallback(
    (s: Stop) => {
      haptics.selection();
      const wasOpen = mapStore.get().sheetOpen;
      mapStore.set({ stop: s });
      if (!wasOpen) router.push('/(tabs)/(map)/stop-sheet');
      const { width, height } = Dimensions.get('window');
      const latitudeDelta = Math.min(region.latitudeDelta, 0.012);
      mapRef.current?.animateToRegion(
        {
          latitude: s.stop_lat - latitudeDelta * SHEET_SHIFT,
          longitude: s.stop_lon,
          latitudeDelta,
          longitudeDelta: latitudeDelta * (width / Math.max(height, 1)),
        },
        420,
      );
    },
    [region.latitudeDelta],
  );

  const deselect = useCallback(() => {
    if (mapStore.get().sheetOpen) router.back();
    mapStore.set({ stop: null });
  }, []);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DONOSTIA}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={(e) => {
          const action = (e.nativeEvent as { action?: string }).action;
          if (action === 'marker-press') return;
          deselect();
        }}
      >
        {visible.map((s) => {
          const isSel = selected?.stop_id === s.stop_id;
          const isFav = favIds.has(s.stop_id);
          return (
            <Marker
              key={`${s.stop_id}-${isSel ? 1 : 0}-${isFav ? 1 : 0}`}
              coordinate={{ latitude: s.stop_lat, longitude: s.stop_lon }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => select(s)}
              accessibilityLabel={s.stop_name}
              zIndex={isSel ? 2 : isFav ? 1 : 0}
            >
              <View style={isSel ? styles.dotSelectedWrap : styles.dotWrap}>
                <View style={[isSel ? styles.dotSelected : styles.dot, isFav && !isSel && styles.dotFav]}>
                  {isSel ? <SFSymbolIcon name="bus.fill" size={12} color="#fff" /> : null}
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.controls, { top: insets.top + 8 }]} pointerEvents="box-none">
        <GlassControl style={styles.roundButton}>
          <Pressable onPress={goToUser} accessibilityRole="button" accessibilityLabel={t('my_location')} style={styles.roundPress}>
            <SFSymbolIcon name={userCoord ? 'location.fill' : 'location'} size={19} color={C.tint} />
          </Pressable>
        </GlassControl>
      </View>

      {!zoomedIn ? (
        <View style={[styles.hintWrap, { top: insets.top + 12 }]} pointerEvents="none">
          <GlassControl style={styles.hint} interactive={false}>
            <Text style={styles.hintText}>{t('zoom_in')}</Text>
          </GlassControl>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  controls: { position: 'absolute', right: 16 },
  roundButton: { width: 48, height: 48, borderRadius: 24 },
  roundPress: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintWrap: { position: 'absolute', left: 76, right: 76, alignItems: 'center' },
  hint: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  hintText: { ...T.footnote, fontWeight: '600', color: C.label, textAlign: 'center' },
  dotWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 13, height: 13, borderRadius: 6.5, backgroundColor: C.brand, borderWidth: 2, borderColor: '#fff' },
  dotFav: { width: 15, height: 15, borderRadius: 7.5, borderColor: '#FFD60A' },
  dotSelectedWrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dotSelected: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.brand, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
