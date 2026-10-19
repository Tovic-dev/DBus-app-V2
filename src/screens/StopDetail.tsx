/**
 * Stop detail (pushed inside every tab). Apple Maps transit card language:
 * big stop name, the lines that serve it, then departures with the minutes
 * set large on the right. Heart in the navigation bar, pull to refresh.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useDepartures, useStop } from '../hooks';
import { stableNow } from '../lib/time';
import { toggleFavorite } from '../favorites';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { LineBadge } from '../ui/LineBadge';
import { DepartureTime, clock } from '../ui/Departure';
import { HeaderButton } from '../ui/HeaderButton';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { useNow } from '../ui/useNow';
import { useFavorites } from '../ui/useFavorites';
import { useTabNav } from '../ui/nav';
import type { ScheduledDeparture } from '../api/types';

export function uniqueLines(deps: ScheduledDeparture[]) {
  const seen = new Map<string, { name: string; routeId: string }>();
  for (const d of deps) if (!seen.has(d.route_short_name)) seen.set(d.route_short_name, { name: d.route_short_name, routeId: d.route_id });
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
}

export default function StopDetailScreen() {
  const { stopId: raw } = useLocalSearchParams<{ stopId: string }>();
  const stopId = decodeURIComponent((Array.isArray(raw) ? raw[0] : raw) ?? '');
  const { t } = useI18n();
  const now = useNow();
  const { openRoute } = useTabNav();
  const [at, setAt] = useState(() => stableNow(now));
  const liveAt = stableNow(now) > at ? stableNow(now) : at;

  const stopQ = useStop(stopId);
  const depQ = useDepartures(stopId, liveAt, 40, Boolean(stopId));
  const favs = useFavorites();
  const isFav = favs.some((f) => f.kind === 'stop' && f.id === stopId);
  const name = stopQ.data?.stop_name ?? '';

  const deps = useMemo(
    () => (depQ.data?.departures ?? []).filter((d) => new Date(d.scheduled_departure).getTime() >= now.getTime() - 60_000),
    [depQ.data, now],
  );
  const lines = useMemo(() => uniqueLines(depQ.data?.departures ?? []), [depQ.data]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setAt(stableNow(new Date()));
    await Promise.all([depQ.refetch(), stopQ.refetch()]);
    setRefreshing(false);
  }, [depQ, stopQ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <HeaderButton
              icon={isFav ? 'heart.fill' : 'heart'}
              accessibilityLabel={isFav ? t('remove_fav') : t('add_fav')}
              onPress={() => name && toggleFavorite({ id: stopId, kind: 'stop', label: name })}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <Text style={styles.name} accessibilityRole="header">{name || ' '}</Text>
          <Text style={styles.sub}>{t('stop_number', { id: stopId })}</Text>
          {lines.length > 0 ? (
            <View style={styles.lines}>
              {lines.map((l) => (
                <Pressable key={l.name} onPress={() => openRoute(l.routeId)} accessibilityRole="button" accessibilityLabel={t('line_n', { n: l.name })} hitSlop={4}>
                  <LineBadge name={l.name} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <ListSection title={t('next_departures')} prominent footer={t('scheduled_note')} separatorInset={M.margin + 44}>
          {depQ.isLoading ? (
            <LoadingRow label={t('loading_departures')} />
          ) : depQ.isError ? (
            <MessageRow icon="exclamationmark.triangle" label={t('departures_error')} actionLabel={t('retry')} onAction={() => depQ.refetch()} />
          ) : deps.length === 0 ? (
            <MessageRow icon="clock" label={t('no_departures')} />
          ) : (
            deps.map((d) => (
              <ListRow
                key={`${d.trip_id}-${d.stop_sequence}`}
                leading={<View style={styles.badgeCol}><LineBadge name={d.route_short_name} /></View>}
                title={d.headsign ? t('toward', { h: d.headsign }) : t('line_n', { n: d.route_short_name })}
                subtitle={clock(d.scheduled_departure)}
                trailing={<DepartureTime iso={d.scheduled_departure} now={now} />}
                onPress={() => openRoute(d.route_id)}
                accessibilityLabel={`${t('line_n', { n: d.route_short_name })}, ${d.headsign ?? ''}, ${clock(d.scheduled_departure)}`}
              />
            ))
          )}
        </ListSection>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  hero: { paddingHorizontal: M.margin + 4, paddingTop: 4 },
  name: { ...T.title1, color: C.label },
  sub: { ...T.subhead, color: C.secondary, marginTop: 4 },
  lines: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  badgeCol: { width: 32, alignItems: 'flex-start' },
});
