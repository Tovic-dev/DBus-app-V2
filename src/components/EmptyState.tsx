import { Text, View, StyleSheet } from 'react-native';
import { SFSymbolIcon } from './SFSymbolIcon';
import { colors, hig, spacing } from '../design/tokens';

/**
 * Apple-style empty state: icon + optional title + human message.
 * Used for no-results / no-favorites / no-arrivals situations.
 */
export function EmptyState({
  message,
  title,
  icon = 'tray',
}: {
  message: string;
  title?: string;
  icon?: 'tray' | 'heart' | 'magnifyingglass' | 'bus.fill' | 'clock';
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <SFSymbolIcon name={icon} size={26} color={colors.muted48} />
      </View>
      {title ? <Text style={styles.title} maxFontSizeMultiplier={1.3}>{title}</Text> : null}
      <Text style={styles.text} maxFontSizeMultiplier={1.4}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.pearl, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: hig('headline').size, fontWeight: '600', color: colors.ink, marginBottom: spacing.xxs },
  text: { fontSize: hig('body').size, color: colors.muted48, textAlign: 'center' },
});