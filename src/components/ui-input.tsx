/** Search field + empty/loading/error/status components (Apple look). */
import React from 'react';
import { Text, View, Pressable, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, control, hig } from '../design/tokens';
import { SFSymbolIcon } from './SFSymbolIcon';
import { Squircle } from '../design/squircle/Squircle';

export function SearchField({ value, onChangeText, placeholder = 'Search', onPress }: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Squircle level="small" backgroundColor={colors.canvas} border={{ color: colors.borderSoft }} style={styles.box}>
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Search field" style={styles.boxInner}>
          <SFSymbolIcon name="magnifyingglass" size={17} color={colors.muted48} />
          <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder}
            placeholderTextColor={colors.muted48} autoCorrect={false} autoCapitalize="none" accessibilityLabel="Search field" />
          {value.length > 0 && (
            <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
              <SFSymbolIcon name="xmark.circle.fill" size={18} color={colors.muted48} />
            </Pressable>
                  )}
        </Pressable>
      </Squircle>
    </View>
  );
}

export function Loading({ label = 'Cargando' }: { label?: string }) {
  return (
    <View style={styles.block}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function Empty({ label = 'Nothing here yet' }: { label?: string }) {
  return (
    <View style={styles.block}>
      <SFSymbolIcon name="tray" size={30} color={colors.muted48} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorState({ label = 'Something went wrong', onRetry, retryLabel = 'Try again' }: { label?: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <View style={styles.block}>
      <SFSymbolIcon name="exclamationmark.circle.fill" size={28} color={colors.danger} />
      <Text style={styles.text}>{label}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel={retryLabel} style={styles.retry}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: hig('footnote').size }} maxFontSizeMultiplier={1.3}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function StatusChip({ tone, label }: { tone: 'live' | 'ok' | 'warn' | 'muted'; label?: string }) {
  const dotColor = tone === 'live' ? colors.live : tone === 'ok' ? colors.success : tone === 'warn' ? colors.warning : colors.hairline;
  const textColor = tone === 'live' ? colors.live : tone === 'ok' ? colors.success : tone === 'warn' ? colors.warning : colors.muted48;
  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={{ color: textColor, fontSize: hig('footnote').size }}>{label ?? 'Status'}</Text>
    </View>
  );
}

export function QueryField({ value, onPress, placeholder = 'Search' }: { value: string; onPress: () => void; placeholder?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={placeholder}>
      <Squircle level="small" backgroundColor={colors.canvas} border={{ color: colors.borderSoft }} style={styles.queryField}>
        <Text style={value ? styles.queryText : styles.queryPlaceholder}>{value || placeholder}</Text>
        <SFSymbolIcon name="chevron.forward" size={18} color={colors.muted48} />
      </Squircle>
    </Pressable>
  );
}

export function Fare({ label, price }: { label: string; price: string }) {
  return (
    <View style={styles.fare}>
      <Text style={styles.fareLabel}>{label}</Text>
      <Text style={styles.farePrice}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  box: { flexDirection: 'row', alignItems: 'center', height: control.searchHeight, paddingHorizontal: control.rowPaddingH },
  boxInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, fontSize: hig('body').size, color: colors.ink, paddingVertical: 0 },
  block: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.xs + 2 },
  text: { color: colors.muted48, fontSize: hig('subheadline').size, textAlign: 'center' },
  retry: { backgroundColor: colors.primary, paddingHorizontal: control.chipPaddingH + 6, paddingVertical: control.chipPaddingV + 1, borderRadius: radius.pill },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pearl, borderRadius: radius.pill, paddingHorizontal: control.chipPaddingV + 2, paddingVertical: control.groupTitleGap + 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: control.groupTitleGap },
  text13: { color: colors.muted48, fontSize: hig('footnote').size },
  queryField: { height: control.searchHeight + 8, paddingHorizontal: control.chipPaddingH + 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  queryText: { fontSize: hig('body').size, color: colors.ink, fontWeight: '600' },
  queryPlaceholder: { fontSize: hig('body').size, color: colors.muted48 },
  fare: { paddingVertical: control.chipPaddingV, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  fareLabel: { fontSize: hig('subheadline').size, color: colors.muted48 },
  farePrice: { fontSize: hig('subheadline').size, fontWeight: '700', color: colors.ink, marginTop: 2 },
});