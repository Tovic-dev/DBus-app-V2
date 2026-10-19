/**
 * Departure time in the Apple Maps transit style: big minutes with a small
 * unit, "Ahora" in green, or the clock time once it is more than an hour away.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { C, T } from './theme';

export function minutesUntil(iso: string, now: Date): number {
  return Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
}

export function clock(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Short spoken/inline label: "Ahora", "5 min", "14:32". */
export function useDepartureText() {
  const { t } = useI18n();
  return (iso: string, now: Date): string => {
    const m = minutesUntil(iso, now);
    if (m <= 0) return t('now');
    if (m < 60) return t('in_min', { n: m });
    return clock(iso);
  };
}

export function DepartureTime({ iso, now, size = 'regular' }: { iso: string; now: Date; size?: 'regular' | 'large' }) {
  const { t } = useI18n();
  const m = minutesUntil(iso, now);
  const big = size === 'large' ? 26 : 20;
  if (m <= 0) {
    return <Text style={[styles.value, { fontSize: big - 4, color: C.tint }]}>{t('now')}</Text>;
  }
  if (m >= 60) {
    return <Text style={[styles.value, { fontSize: big - 2 }]}>{clock(iso)}</Text>;
  }
  return (
    <View style={styles.row} accessible accessibilityLabel={t('in_min_long', { n: m })}>
      <Text style={[styles.value, { fontSize: big }]}>{m}</Text>
      <Text style={styles.unit}>min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value: { fontWeight: '700', color: C.label, fontVariant: ['tabular-nums'] },
  unit: { ...T.footnote, fontWeight: '600', color: C.secondary },
});
