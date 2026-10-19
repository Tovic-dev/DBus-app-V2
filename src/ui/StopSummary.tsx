/**
 * One-line "what's coming" for a stop: the next departure of up to three
 * lines, soonest first (badge + minutes). Used in Home and Favorites rows.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDepartures } from '../hooks';
import { stableNow } from '../lib/time';
import { useI18n } from '../i18n';
import { LineBadge } from './LineBadge';
import { useDepartureText } from './Departure';
import { C, T } from './theme';

export function useNextPerLine(stopId: string, now: Date, max = 3) {
  const q = useDepartures(stopId, stableNow(now), 20, Boolean(stopId));
  const items = useMemo(() => {
    const byLine = new Map<string, { line: string; routeId: string; iso: string; headsign: string | null }>();
    for (const d of q.data?.departures ?? []) {
      if (new Date(d.scheduled_departure).getTime() < now.getTime() - 60_000) continue;
      const ex = byLine.get(d.route_short_name);
      if (!ex || d.scheduled_departure < ex.iso) {
        byLine.set(d.route_short_name, { line: d.route_short_name, routeId: d.route_id, iso: d.scheduled_departure, headsign: d.headsign });
      }
    }
    return [...byLine.values()].sort((a, b) => a.iso.localeCompare(b.iso)).slice(0, max);
  }, [q.data, now, max]);
  return { items, isLoading: q.isLoading, isError: q.isError };
}

export function StopSummary({ stopId, now }: { stopId: string; now: Date }) {
  const { t } = useI18n();
  const text = useDepartureText();
  const { items, isLoading } = useNextPerLine(stopId, now);
  if (isLoading) return <Text style={styles.muted}>{t('loading')}</Text>;
  if (items.length === 0) return <Text style={styles.muted}>{t('no_upcoming')}</Text>;
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <View key={it.line} style={styles.item}>
          <LineBadge name={it.line} size="small" />
          <Text style={styles.time}>{text(it.iso, now)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { ...T.subhead, fontWeight: '600', color: C.label, fontVariant: ['tabular-nums'] },
  muted: { ...T.subhead, color: C.secondary, marginTop: 2 },
});
