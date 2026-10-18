/** Apple-design UI kit — badges, cards, buttons, pills. */
import React from 'react';
import { Text, View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, control, layout, hig } from '../design/tokens';
import { PRESS_SCALE } from '../design/motion';
import { haptics } from '../design/haptics';
import { routeColor } from '../design/routeColors';
import { Squircle } from '../design/squircle/Squircle';

export function RouteBadge({ shortName, size = 40, color }: { shortName: string; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? routeColor(shortName), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.34, fontWeight: '800' }}>{shortName}</Text>
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const base = [styles.cardInner, style];
  const content = (
    <Squircle level="medium" backgroundColor={colors.canvas} border={{ color: colors.hairline }} style={styles.card}>
      {children}
    </Squircle>
  );
  if (!onPress) return <View style={[styles.cardOuter, style as ViewStyle]}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.cardOuter, style as ViewStyle]}>
      {content}
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, small, tint }: { label: string; onPress?: () => void; small?: boolean; tint?: string }) {
  return (
    <Pressable onPress={() => { haptics.selection(); onPress?.(); }} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ backgroundColor: tint ?? colors.primary, borderRadius: radius.pill, paddingHorizontal: small ? control.chipPaddingH + 2 : control.chipPaddingH + 14, paddingVertical: small ? control.chipPaddingV : control.rowPaddingV + 2, minHeight: small ? undefined : control.buttonHeight, transform: [{ scale: pressed ? PRESS_SCALE : 1 }], alignItems: 'center', justifyContent: 'center' })}>
      <Text style={{ color: '#fff', fontSize: small ? hig('footnote').size : hig('body').size, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ paddingHorizontal: control.chipPaddingH + 8, paddingVertical: control.chipPaddingV + 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }], alignItems: 'center' })}>
      <Text style={{ color: colors.primary, fontSize: hig('body').size, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function OptionPills<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => { haptics.selection(); onChange(opt.value); }} accessibilityRole="button" accessibilityLabel={`Select ${opt.label}`}
            style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && { transform: [{ scale: PRESS_SCALE }] }]}>
            <Text style={[styles.pillText, selected && { color: colors.primary }]} numberOfLines={1}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.contentMargin, paddingVertical: control.groupTitleGap, marginBottom: spacing.xs },
  sectionTitle: { fontSize: hig('title2').size, fontWeight: '700', letterSpacing: hig('title2').ls },
  cardOuter: { marginHorizontal: layout.contentMargin },
  cardInner: { padding: layout.cardGap + spacing.sm },
  card: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { paddingHorizontal: control.chipPaddingH + 2, paddingVertical: control.rowPaddingV, borderRadius: radius.pill, backgroundColor: colors.pearl, minHeight: control.minTouch, justifyContent: 'center' },
  pillSelected: { backgroundColor: colors.parchment, borderWidth: 1, borderColor: colors.primary },
  pillText: { fontSize: hig('footnote').size, color: colors.muted80 },
});