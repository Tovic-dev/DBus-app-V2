/**
 * Inset-grouped list primitives (UITableView .insetGrouped look) built on
 * semantic colours. Separators are inset to the text column, rows highlight
 * with the system pressed colour, chevrons use tertiary label.
 */
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { SFSymbolIcon } from '../components/SFSymbolIcon';
import { C, M, T } from './theme';

export function ListSection({
  title,
  prominent,
  footer,
  separatorInset = M.margin,
  children,
  style,
}: {
  title?: string;
  /** Large bold header (content sections) instead of the small grey one (forms). */
  prominent?: boolean;
  footer?: ReactNode;
  separatorInset?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = Children.toArray(children).filter((c) => isValidElement(c));
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <Text accessibilityRole="header" style={prominent ? styles.headerProminent : styles.header}>
          {title}
        </Text>
      ) : null}
      {items.length > 0 ? (
        <View style={styles.card}>
          {items.map((child, i) => (
            <Fragment key={i}>
              {i > 0 ? <View style={[styles.separator, { marginLeft: separatorInset }]} /> : null}
              {child}
            </Fragment>
          ))}
        </View>
      ) : null}
      {typeof footer === 'string' ? <Text style={styles.footer}>{footer}</Text> : footer}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  onPress,
  chevron,
  checked,
  destructive,
  titleColor,
  accessibilityLabel,
  accessibilityHint,
  numberOfLines = 1,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Secondary value on the right (Settings style). */
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  checked?: boolean;
  destructive?: boolean;
  titleColor?: ColorValue;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  numberOfLines?: number;
}) {
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.texts}>
        {typeof title === 'string' ? (
          <Text style={[styles.title, destructive && { color: C.red }, titleColor ? { color: titleColor } : null]} numberOfLines={numberOfLines}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : (
          subtitle ?? null
        )}
      </View>
      {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
      {trailing}
      {checked ? <SFSymbolIcon name="checkmark" size={17} weight="semibold" color={C.tint} /> : null}
      {chevron ? <SFSymbolIcon name="chevron.forward" size={14} weight="semibold" color={C.tertiary} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.row} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={checked !== undefined ? { selected: checked } : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.pressed }]}
    >
      {content}
    </Pressable>
  );
}

/** Rounded-square SF Symbol tile used as a row's leading icon (Settings style). */
export function IconTile({ name, color = C.brand }: { name: Parameters<typeof SFSymbolIcon>[0]['name']; color?: ColorValue }) {
  return (
    <View style={[styles.tile, { backgroundColor: color }]}>
      <SFSymbolIcon name={name} size={16} color="#fff" weight="semibold" />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: M.sectionGap, marginHorizontal: M.margin },
  header: { ...T.footnote, color: C.secondary, textTransform: 'uppercase', marginLeft: M.margin, marginBottom: 7 },
  headerProminent: { ...T.title3, fontWeight: '700', color: C.label, marginLeft: 4, marginBottom: 10 },
  card: { backgroundColor: C.cell, borderRadius: M.cellRadius, borderCurve: 'continuous', overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator },
  footer: { ...T.footnote, color: C.secondary, marginHorizontal: M.margin, marginTop: 7 },
  row: { minHeight: M.rowMinHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: M.margin, paddingVertical: 11, gap: 12 },
  leading: { alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { ...T.body, color: C.label },
  subtitle: { ...T.subhead, color: C.secondary },
  value: { ...T.body, color: C.secondary, maxWidth: '50%' },
  tile: { width: 30, height: 30, borderRadius: 8, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
});
