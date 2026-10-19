/**
 * Viaje: direct-bus planner. Origin/destination card with a swap button,
 * native segmented control (Salir a las / Llegar antes de), compact iOS date
 * picker, results as a grouped list.
 */
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useDepartures, useReachableStops, lineKey } from '../hooks';
import { stableNow } from '../lib/time';
import { useI18n } from '../i18n';
import { C, M, T } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { LineBadge } from '../ui/LineBadge';
import { DepartureTime, clock } from '../ui/Departure';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import { useNow } from '../ui/useNow';
import { useStore } from '../ui/store';
import { tripStore, type TripField, type TripMode } from '../ui/tripStore';
import { useTabNav } from '../ui/nav';
import { haptics } from '../design/haptics';
import type { Stop } from '../api/types';

const LOCALES = { es: 'es-ES', en: 'en-GB', eu: 'eu-ES' } as const;

function haversineM(a: Stop, b: Stop): number {
  const R = 6371_000;
  const dLat = ((b.stop_lat - a.stop_lat) * Math.PI) / 180;
  const dLon = ((b.stop_lon - a.stop_lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.stop_lat * Math.PI) / 180) * Math.cos((b.stop_lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ride time estimate (min): straight-line distance ×1.3 at ~16 km/h urban bus speed. */
export function estimateRideMin(a: Stop, b: Stop): number {
  return Math.max(3, Math.round((haversineM(a, b) * 1.3) / (16_000 / 60)));
}

export default function TripScreen() {
  const { t, lang } = useI18n();
  const from = useStore(tripStore, (s) => s.from);
  const to = useStore(tripStore, (s) => s.to);
  const mode = useStore(tripStore, (s) => s.mode);
  const date = useStore(tripStore, (s) => s.date);

  const open = (field: TripField) => {
    tripStore.set({ picking: field });
    router.push('/(tabs)/(trip)/pick');
  };
  const swap = () => {
    haptics.selection();
    tripStore.set((s) => ({ from: s.to, to: s.from }));
  };

  return (
    <ScrollView style={styles.root} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <ListSection style={styles.first}>
        <View style={styles.endpoints}>
          <View style={styles.endpointRows}>
            <Endpoint label={t('origin')} value={from?.stop_name} placeholder={t('choose_stop')} icon="circle" onPress={() => open('from')} />
            <View style={styles.sep} />
            <Endpoint label={t('destination')} value={to?.stop_name} placeholder={t('choose_stop')} icon="pin" onPress={() => open('to')} />
          </View>
          <Pressable onPress={swap} disabled={!from && !to} accessibilityRole="button" accessibilityLabel={t('swap')} hitSlop={6} style={({ pressed }) => [styles.swap, pressed && { opacity: 0.5 }]}>
            <SFSymbolIcon name="arrow.up.arrow.down" size={17} weight="semibold" color={C.tint} />
          </Pressable>
        </View>
      </ListSection>

      <ListSection>
        <View style={styles.segmentRow}>
          <SegmentedControl
            values={[t('leave_at'), t('arrive_by')]}
            selectedIndex={mode === 'leave' ? 0 : 1}
            onChange={(e) => tripStore.set({ mode: (e.nativeEvent.selectedSegmentIndex === 0 ? 'leave' : 'arrive') as TripMode })}
          />
        </View>
        <ListRow
          title={t('date_time')}
          trailing={
            <DateTimePicker
              value={date}
              mode="datetime"
              display="compact"
              locale={LOCALES[lang]}
              accentColor="#70AF00"
              onChange={(_e, d) => d && tripStore.set({ date: d })}
            />
          }
        />
      </ListSection>

      {from && to ? (
        <Results origin={from} dest={to} mode={mode} target={date} />
      ) : (
        <Text style={styles.prompt}>{t('trip_prompt')}</Text>
      )}
    </ScrollView>
  );
}

function Endpoint({ label, value, placeholder, icon, onPress }: { label: string; value?: string; placeholder: string; icon: 'circle' | 'pin'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder}`} style={({ pressed }) => [styles.endpoint, pressed && { backgroundColor: C.pressed }]}>
      <View style={styles.endpointIcon}>
        {icon === 'circle' ? <View style={styles.originDot} /> : <SFSymbolIcon name="mappin.and.ellipse" size={17} color={C.red} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.endpointLabel}>{label}</Text>
        <Text style={[styles.endpointValue, !value && { color: C.tertiary }]} numberOfLines={1}>{value ?? placeholder}</Text>
      </View>
    </Pressable>
  );
}

function Results({ origin, dest, mode, target }: { origin: Stop; dest: Stop; mode: TripMode; target: Date }) {
  const { t } = useI18n();
  const now = useNow();
  const { openRoute } = useTabNav();
  const reachable = useReachableStops(origin.stop_id);
  const lines = reachable.linesTo(dest.stop_id);
  const ride = estimateRideMin(origin, dest);

  const searchFrom = mode === 'leave' ? target : new Date(target.getTime() - (ride + 60) * 60_000);
  const depQ = useDepartures(origin.stop_id, stableNow(searchFrom), 100);
  const targetMs = target.getTime();

  const results = useMemo(() => {
    const deps = (depQ.data?.departures ?? []).filter((d) => !lines || lines.has(lineKey(d.route_id, d.direction_id)));
    const ms = (iso: string) => new Date(iso).getTime();
    if (mode === 'leave') {
      return deps.filter((d) => ms(d.scheduled_departure) >= targetMs - 60_000).sort((a, b) => ms(a.scheduled_departure) - ms(b.scheduled_departure)).slice(0, 8);
    }
    return deps
      .filter((d) => ms(d.scheduled_departure) + ride * 60_000 <= targetMs)
      .sort((a, b) => ms(b.scheduled_departure) - ms(a.scheduled_departure))
      .slice(0, 8);
  }, [depQ.data, lines, mode, targetMs, ride]);

  const loading = depQ.isLoading || reachable.isLoading;

  return (
    <ListSection title={t('results')} prominent footer={`${t('trip_estimate', { n: ride })} ${t('scheduled_note')}`} separatorInset={M.margin + 44}>
      {loading ? (
        <LoadingRow label={t('loading_departures')} />
      ) : depQ.isError ? (
        <MessageRow icon="exclamationmark.triangle" label={t('departures_error')} actionLabel={t('retry')} onAction={() => depQ.refetch()} />
      ) : results.length === 0 ? (
        <MessageRow icon="clock" label={mode === 'leave' ? t('no_trip_leave') : t('no_trip_arrive')} />
      ) : (
        results.map((d) => {
          const arr = new Date(new Date(d.scheduled_departure).getTime() + ride * 60_000);
          return (
            <ListRow
              key={`${d.trip_id}-${d.stop_sequence}`}
              leading={<View style={styles.badgeCol}><LineBadge name={d.route_short_name} /></View>}
              title={d.headsign ? t('toward', { h: d.headsign }) : t('line_n', { n: d.route_short_name })}
              subtitle={`${t('departs', { time: clock(d.scheduled_departure) })} · ${t('arrives_approx', { time: clock(arr) })}`}
              trailing={<DepartureTime iso={d.scheduled_departure} now={now} />}
              onPress={() => openRoute(d.route_id)}
            />
          );
        })
      )}
    </ListSection>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
  first: { marginTop: 12 },
  endpoints: { flexDirection: 'row', alignItems: 'center' },
  endpointRows: { flex: 1 },
  endpoint: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: M.margin, paddingRight: 8, paddingVertical: 10, minHeight: 58 },
  endpointIcon: { width: 22, alignItems: 'center' },
  originDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: C.brand },
  endpointLabel: { ...T.footnote, color: C.secondary },
  endpointValue: { ...T.body, color: C.label, marginTop: 1 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: M.margin + 34 },
  swap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.fill, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  segmentRow: { paddingHorizontal: M.margin, paddingVertical: 12 },
  badgeCol: { width: 32, alignItems: 'flex-start' },
  prompt: { ...T.subhead, color: C.secondary, textAlign: 'center', marginHorizontal: 40, marginTop: 28 },
});
