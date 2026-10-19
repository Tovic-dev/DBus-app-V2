/**
 * Inicio. Large title "DBus", gear for Ajustes, then two native sections:
 * the three stops nearest to you with their next departures, and your
 * favourite stops. Every location outcome has its own state; pull to refresh
 * re-locates and reloads.
 */
import { useCallback, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useNearbyStops } from '../hooks';
import { humanDistance } from '../lib/geo';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { HeaderButton } from '../ui/HeaderButton';
import { StopSummary } from '../ui/StopSummary';
import { LineBadge } from '../ui/LineBadge';
import { useNow } from '../ui/useNow';
import { useLocation } from '../ui/useLocation';
import { useFavorites } from '../ui/useFavorites';
import { useTabNav } from '../ui/nav';

const NEARBY_RADIUS_M = 1000;

export default function HomeScreen() {
  const { t } = useI18n();
  const now = useNow();
  const qc = useQueryClient();
  const { openStop, openRoute } = useTabNav();
  const { state: loc, refresh: relocate } = useLocation();
  const favs = useFavorites();
  const favStops = favs.filter((f) => f.kind === 'stop');
  const favRoutes = favs.filter((f) => f.kind === 'route');

  const ready = loc.status === 'ready';
  const nearbyQ = useNearbyStops(ready ? loc.lat : undefined, ready ? loc.lon : undefined, NEARBY_RADIUS_M, 3);
  const nearby = nearbyQ.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await relocate();
    await qc.invalidateQueries({ queryKey: ['departures'] }).catch(() => undefined);
    setRefreshing(false);
  }, [relocate, qc]);

  const nearbyBody = (() => {
    switch (loc.status) {
      case 'locating':
        return <LoadingRow label={t('locating')} />;
      case 'denied':
        return <MessageRow icon="location.slash" label={t('location_denied')} actionLabel={t('open_settings')} onAction={() => Linking.openSettings()} />;
      case 'unavailable':
        return <MessageRow icon="location.slash" label={t('location_off')} actionLabel={t('retry')} onAction={relocate} />;
      case 'error':
        return <MessageRow icon="exclamationmark.triangle" label={t('location_error')} actionLabel={t('retry')} onAction={relocate} />;
      case 'ready':
        if (nearbyQ.isLoading) return <LoadingRow label={t('locating')} />;
        if (nearbyQ.isError) return <MessageRow icon="exclamationmark.triangle" label={t('nearby_error')} actionLabel={t('retry')} onAction={() => nearbyQ.refetch()} />;
        if (nearby.length === 0) return <MessageRow icon="mappin.and.ellipse" label={t('no_stops_near')} />;
        return nearby.map((s) => (
          <ListRow
            key={s.stop_id}
            title={s.stop_name}
            value={humanDistance(s.distance_m)}
            subtitle={<StopSummary stopId={s.stop_id} now={now} />}
            onPress={() => openStop(s.stop_id)}
            chevron
            accessibilityLabel={`${s.stop_name}, ${humanDistance(s.distance_m)}`}
          />
        ));
    }
  })();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton icon="gearshape" accessibilityLabel={t('settings')} onPress={() => router.push('/settings')} />,
        }}
      />
      <ScrollView
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ListSection title={t('near_you')} prominent style={styles.first}>
          {nearbyBody}
        </ListSection>

        <ListSection
          title={t('favorites')}
          prominent
          footer={favStops.length + favRoutes.length === 0 ? t('fav_hint') : undefined}
        >
          {favStops.map((f) => (
            <ListRow
              key={`s-${f.id}`}
              title={f.label}
              subtitle={<StopSummary stopId={f.id} now={now} />}
              onPress={() => openStop(f.id)}
              chevron
              accessibilityLabel={f.label}
            />
          ))}
          {favRoutes.map((f) => (
            <ListRow
              key={`r-${f.id}`}
              leading={<LineBadge name={f.label} />}
              title={f.sublabel ?? t('line_n', { n: f.label })}
              onPress={() => openRoute(f.id)}
              chevron
              accessibilityLabel={t('line_n', { n: f.label })}
            />
          ))}
        </ListSection>

        <Text style={styles.footer}>{t('footer_source')}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
  first: { marginTop: 12 },
  footer: { ...T.footnote, color: C.secondary, textAlign: 'center', marginTop: 28, marginHorizontal: M.margin },
});
