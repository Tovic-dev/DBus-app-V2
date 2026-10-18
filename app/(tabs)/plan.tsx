import { useState, useMemo } from 'react';
import { Text, View, Pressable, ScrollView, TextInput, StyleSheet, Modal, FlatList, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SFSymbolIcon, type SFSymbolName } from '../../src/components/SFSymbolIcon';
import { useStops, useDepartures, useReachableStops } from '../../src/hooks';
import { RouteBadge, Section } from '../../src/components/ui-badges';
import { Loading, Empty } from '../../src/components/ui-input';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { glassRadius, glassShadow } from '../../src/theme/glass';
import { colors, radius, spacing, control, layout, type, hig, softShadow } from '../../src/design/tokens';
import { haptics } from '../../src/design/haptics';
import { stableNow, formatClock } from '../../src/lib/time';
import { useI18n, type I18n } from '../../src/i18n';
import type { Stop } from '../../src/api/types';

type Field = 'from' | 'to';
type Mode = 'leave' | 'arrive';

/** "Hoy 11:30" / "Mañana 09:15" / "12 mar, 14:00" */
function timeLabel(d: Date, t: I18n['t']): string {
  const now = new Date();
  const hm = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getTime() + 86_400_000).toDateString() === d.toDateString();
  if (sameDay) return `${t('today')} ${hm}`;
  if (tomorrow) return `${t('tomorrow')} ${hm}`;
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, ${hm}`;
}

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [activeField, setActiveField] = useState<Field>('from');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [from, setFrom] = useState<Stop | null>(null);
  const [to, setTo] = useState<Stop | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('leave');
  const [timeOpen, setTimeOpen] = useState(false);
  const [chosenDate, setChosenDate] = useState<Date>(() => new Date());

  const at = stableNow(chosenDate);

  const stopsQ = useStops(500);
  const allStops = stopsQ.data?.stops ?? [];

  // Filtrado inteligente: con origen elegido, solo destinos alcanzables
  // (paradas de las líneas que sirven el origen). Sin origen → todas.
  const reachable = useReachableStops(from?.stop_id ?? null, at);
  const baseStops = from && reachable.stopIds
    ? allStops.filter((s) => reachable.stopIds!.has(s.stop_id))
    : allStops;

  const filtered = query.trim().length > 0
    ? baseStops.filter((s) => s.stop_name.toLowerCase().includes(query.trim().toLowerCase()) || s.stop_id.includes(query.trim()))
    : baseStops;

  const picker = activeField;
  const other = picker === 'from' ? to : from;

  const pick = (s: Stop) => {
    haptics.selection();
    if (picker === 'from') {
      if (to?.stop_id === s.stop_id) setTo(null);
      setFrom(s);
    } else {
      if (from?.stop_id === s.stop_id) setFrom(null);
      setTo(s);
    }
    setQuery('');
    setPickerOpen(false);
  };

  const openPicker = (f: Field) => {
    setActiveField(f);
    setQuery('');
    setPickerOpen(true);
  };

  const swap = () => {
    const f = from;
    setFrom(to);
    setTo(f);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: layout.bottomScroll }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('plan_title')}</Text>
        <Text style={styles.sub}>{t('plan_sub')}</Text>
      </View>

      <GlassCard variant="light" padding={0} radius={glassRadius.xl} style={[styles.fieldCard, glassShadow.flat]}>
        <View style={styles.fieldCardInner}>
          <FieldRow label={t('origin')} value={from?.stop_name ?? ''} onPress={() => openPicker('from')} icon="location.viewfinder" />
          <View style={styles.swapRow}>
            <Pressable onPress={swap} accessibilityRole="button" accessibilityLabel={t('swap')} style={styles.swapBtn}>
              <SFSymbolIcon name="arrow.up.arrow.down" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <FieldRow label={t('destination')} value={to?.stop_name ?? ''} onPress={() => openPicker('to')} icon="arrow.triangle.branch" last />
        </View>
      </GlassCard>

      <Section title={t('schedule')}>
        <View style={styles.segmentRow}>
          {(['leave', 'arrive'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable key={m} onPress={() => setMode(m)} accessibilityRole="button" accessibilityLabel={m === 'leave' ? t('leave_at') : t('arrive_by')} style={[styles.segment, active && styles.segmentActive]}>
                <Text style={[styles.segmentText, active && { color: colors.primary }]}>{m === 'leave' ? t('leave_at') : t('arrive_by')}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setTimeOpen(true)} accessibilityRole="button" accessibilityLabel={t('pick_time')} style={styles.timeSummary}>
          <SFSymbolIcon name="clock" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.timeSummaryLabel}>{mode === 'leave' ? t('leave_at') : t('arrive_by')}</Text>
            <Text style={styles.timeSummaryValue}>{timeLabel(chosenDate, t)}</Text>
          </View>
          <SFSymbolIcon name="chevron.down" size={18} color={colors.muted48} />
        </Pressable>
      </Section>

      {/* Sheet de hora — DatePicker nativo iOS (rueda) */}
      <Modal visible={timeOpen} transparent animationType="slide" onRequestClose={() => setTimeOpen(false)}>
        <Pressable style={styles.timeBackdrop} onPress={() => setTimeOpen(false)} accessibilityRole="button" accessibilityLabel={t('cancel')} />
        <View style={styles.timeSheet}>
          <View style={styles.timeSheetHeader}>
            <Pressable onPress={() => setTimeOpen(false)} accessibilityRole="button" accessibilityLabel={t('cancel')} hitSlop={8}>
              <Text style={styles.timeSheetCancel}>{t('cancel')}</Text>
            </Pressable>
            <Text style={styles.timeSheetTitle}>{mode === 'leave' ? t('leave_at') : t('arrive_by')}</Text>
            <Pressable onPress={() => setTimeOpen(false)} accessibilityRole="button" accessibilityLabel={t('done')} hitSlop={8}>
              <Text style={styles.timeSheetDone}>{t('done')}</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={chosenDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            {...({ theme: 'light' } as Record<string, unknown>)}
            onChange={(_e, d) => { if (d) setChosenDate(d); }}
            locale="es-ES"
          />
        </View>
      </Modal>

      {/* Selector desplegable: solo se abre al pulsar Origen/Destino */}
      <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setPickerOpen(false)} accessibilityRole="button" accessibilityLabel={t('cancel')} hitSlop={8}>
              <Text style={styles.modalCancel}>{t('cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{picker === 'from' ? t('choose_origin') : t('choose_destination')}</Text>
            <View style={{ width: 60 }} />
          </View>
          {picker === 'to' && from && (
            <Text style={styles.modalHint}>
              {reachable.isLoading
                ? t('loading_stops')
                : t('destinations_available', { n: baseStops.length })}
            </Text>
          )}
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder={t('search_stop')} placeholderTextColor={colors.muted48} autoCorrect={false} autoCapitalize="none" accessibilityLabel={t('search_stop')} />
          {stopsQ.isLoading ? (
            <Loading label={t('loading_stops')} />
          ) : (
            <FlatList
              data={filtered.slice(0, 300)}
              keyExtractor={(s) => s.stop_id}
              renderItem={({ item: s }) => {
                const sel = other?.stop_id === s.stop_id;
                return (
                  <Pressable onPress={() => pick(s)} accessibilityRole="button" accessibilityLabel={s.stop_name} style={[styles.stopRow, sel && styles.stopRowSelected]}>
                    <SFSymbolIcon name="location.fill" size={20} color={sel ? colors.danger : colors.primary} />
                    <Text style={styles.stopRowText} numberOfLines={1}>{s.stop_name}</Text>
                    <Text style={styles.stopRowId}>#{s.stop_id}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Empty label={t('no_match')} />}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Modal>

      {from && to && (
        <Itinerary origin={from} dest={to} mode={mode} target={chosenDate} onPickRoute={(rid) => router.push(`/routes/${rid}`)} />
      )}
    </ScrollView>

  );
}

function FieldRow({ label, value, onPress, icon, last }: {
  label: string; value: string; onPress: () => void; icon: SFSymbolName; last?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.fieldRow, last && { borderBottomWidth: 0 }]}>
      <SFSymbolIcon name={icon} size={20} color={colors.muted48} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, !value && { color: colors.muted48 }]}>{value || t('choose_stop')}</Text>
      </View>
      <SFSymbolIcon name="chevron.down" size={18} color={colors.muted48} />
    </Pressable>
  );
}

/** Haversine distance in meters. */
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Estimated door-to-door duration (minutes): walk to stop + in-vehicle
 * (≈18 km/h urban bus) + walk from stop. Used to differentiate
 * "leave at" vs "arrive by".
 */
function estimateTripMin(origin: Stop, dest: Stop): number {
  const meters = haversineM(origin.stop_lat, origin.stop_lon, dest.stop_lat, dest.stop_lon);
  const inVehicleMin = meters / (18_000 / 60); // 18 km/h
  const walkMin = 4 + 4; // to stop + from stop
  return Math.max(6, Math.round(inVehicleMin + walkMin));
}

function Itinerary({ origin, dest, mode, target, onPickRoute }: {
  origin: Stop; dest: Stop; mode: Mode; target: Date; onPickRoute: (routeId: string) => void;
}) {
  const { t } = useI18n();
  const tripMin = estimateTripMin(origin, dest);

  // departAt: search from the chosen time forward.
  // arriveBy: search from (target - trip - 30min window) so we can offer
  // services that still arrive before the target.
  const searchFrom = mode === 'leave' ? target : new Date(target.getTime() - (tripMin + 30) * 60_000);
  const at = stableNow(searchFrom);
  const depQ = useDepartures(origin.stop_id, at, 30);
  const deps = depQ.data?.departures ?? [];

  const targetMs = target.getTime();
  const results = useMemo(() => {
    if (mode === 'leave') {
      // First valid combinations after the chosen time, ascending.
      return deps
        .filter((d) => new Date(d.scheduled_departure).getTime() >= targetMs)
        .sort((a, b) => new Date(a.scheduled_departure).getTime() - new Date(b.scheduled_departure).getTime())
        .slice(0, 6);
    }
    // arriveBy: latest acceptable departure so arrival <= target.
    const latestDepartureMs = targetMs - tripMin * 60_000;
    return deps
      .filter((d) => {
        const dep = new Date(d.scheduled_departure).getTime();
        return dep <= latestDepartureMs && dep + tripMin * 60_000 <= targetMs;
      })
      .sort((a, b) => new Date(b.scheduled_departure).getTime() - new Date(a.scheduled_departure).getTime())
      .slice(0, 6);
  }, [deps, mode, targetMs, tripMin]);

  return (
    <View style={styles.itin}>
      <Text style={styles.tripSummary}>
        {mode === 'leave'
          ? t('trip_duration', { n: tripMin })
          : t('arrive_by_summary', { n: tripMin, time: target.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) })}
      </Text>
      <Section title={t('suggested_departures')}>
        {depQ.isLoading ? (
          <Loading label={t('computing_times')} />
        ) : results.length === 0 ? (
          <Empty label={mode === 'leave' ? t('no_departures_now') : t('no_arrive_options')} />
        ) : (
          results.map((d) => {
            const arrMs = new Date(d.scheduled_departure).getTime() + tripMin * 60_000;
            return (
              <Pressable key={`${d.trip_id}-${d.stop_sequence}`} onPress={() => onPickRoute(d.route_id)} accessibilityRole="button" accessibilityLabel={t('take_line', { n: d.route_short_name })} style={styles.legRow}>
                <RouteBadge shortName={d.route_short_name} size={36} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.legHead} numberOfLines={1}>{d.headsign}</Text>
                  <Text style={styles.legSub} numberOfLines={1}>
                    {mode === 'leave'
                      ? t('line_toward', { n: d.route_short_name, h: d.headsign ?? '', d: dest.stop_name })
                      : t('arrives_at', { time: new Date(arrMs).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) })}
                  </Text>
                </View>
                <Text style={styles.legTime}>{formatClock(d.scheduled_departure)}</Text>
              </Pressable>
            );
          })
        )}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: spacing.lg, paddingHorizontal: layout.contentMargin },
  title: { fontSize: type.hero.size, fontWeight: '700', letterSpacing: type.hero.ls, color: colors.ink },
  sub: { fontSize: hig('subheadline').size, color: colors.muted48, marginTop: control.groupTitleGap - 2, marginBottom: spacing.lg },
  // Glass: the material layer owns background/border; this style carries layout
  // only. Padding must NOT live here — GlassSurface paints its material at the
  // host's CONTENT box, so host padding would inset the visible glass and narrow
  // the card. Inner padding lives on `fieldCardInner` instead.
  fieldCard: { borderRadius: radius.xl, marginHorizontal: layout.contentMargin, marginBottom: spacing.lg },
  fieldCardInner: { paddingHorizontal: layout.headerPaddingV + spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  fieldLabel: { fontSize: hig('caption').size, color: colors.muted48, fontWeight: '600' },
  fieldValue: { fontSize: hig('body').size, color: colors.ink, fontWeight: '600', marginTop: 1 },
  swapRow: { alignItems: 'flex-end', marginVertical: control.groupTitleGap - 8 },
  swapBtn: { width: control.minTouch - 4, height: control.minTouch - 4, borderRadius: control.minTouch / 2 - 2, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center' },
  segmentRow: { flexDirection: 'row', backgroundColor: colors.pearl, borderRadius: radius.pill, padding: control.groupTitleGap - 2, marginHorizontal: layout.contentMargin, marginBottom: spacing.sm },
  segment: { flex: 1, paddingVertical: control.chipPaddingV, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.primary },
  segmentText: { fontSize: hig('footnote').size, color: colors.muted48 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  timeChip: { paddingHorizontal: control.chipPaddingH, paddingVertical: control.chipPaddingV, borderRadius: radius.pill, backgroundColor: colors.canvas },
  timeChipActive: { backgroundColor: colors.primary },
  input: { backgroundColor: colors.canvas, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSoft, height: control.searchHeight, paddingHorizontal: control.rowPaddingH, fontSize: hig('subheadline').size, color: colors.ink, marginHorizontal: layout.contentMargin, marginBottom: spacing.xs },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: control.rowPaddingV + 1, paddingHorizontal: layout.contentMargin, gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  stopRowSelected: { backgroundColor: colors.parchment },
  stopRowText: { flex: 1, fontSize: hig('callout').size, color: colors.ink, fontWeight: '500' },
  stopRowId: { fontSize: hig('caption').size, color: colors.muted48 },
  itin: { marginTop: spacing.xl },
  tripSummary: { fontSize: hig('footnote').size, color: colors.muted48, paddingHorizontal: layout.contentMargin, marginBottom: spacing.sm },
  legRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: layout.contentMargin, gap: spacing.xs },
  legHead: { fontSize: hig('callout').size, fontWeight: '700', color: colors.ink },
  legSub: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 2 },
  legTime: { fontSize: hig('footnote').size, color: colors.muted48, marginLeft: spacing.xs },
  modalRoot: { flex: 1, backgroundColor: colors.canvas, paddingTop: spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.contentMargin, marginBottom: spacing.sm },
  modalCancel: { color: colors.primary, fontSize: hig('body').size, fontWeight: '600' },
  modalTitle: { fontSize: hig('body').size, fontWeight: '700', color: colors.ink },
  modalHint: { fontSize: hig('footnote').size, color: colors.muted48, textAlign: 'center', marginBottom: spacing.xs },
  timeSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.canvas, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, padding: spacing.md, marginHorizontal: layout.contentMargin, marginTop: spacing.sm },
  timeSummaryLabel: { fontSize: hig('caption').size, color: colors.muted48, fontWeight: '600' },
  timeSummaryValue: { fontSize: hig('callout').size + 2, fontWeight: '700', color: colors.ink, marginTop: 1 },
  timeBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  timeSheet: { position: 'absolute', left: layout.floatInset, right: layout.floatInset, bottom: layout.floatInset, backgroundColor: colors.canvas, borderRadius: radius.xl, padding: spacing.md, ...softShadow },
  timeSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  timeSheetCancel: { color: colors.muted48, fontSize: hig('body').size },
  timeSheetTitle: { color: colors.ink, fontSize: hig('body').size, fontWeight: '700' },
  timeSheetDone: { color: colors.primary, fontSize: hig('body').size, fontWeight: '700' },
});