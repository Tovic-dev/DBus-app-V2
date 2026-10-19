/** ContentUnavailableView look: large grey symbol, title, description, optional action. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SFSymbolIcon, type SFSymbolName } from '../components/SFSymbolIcon';
import { C, T } from './theme';

export function EmptyState({ icon, title, message, actionLabel, onAction }: {
  icon: SFSymbolName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <SFSymbolIcon name={icon} size={48} color={C.secondary} />
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 48, gap: 8 },
  title: { ...T.title3, fontWeight: '700', color: C.label, textAlign: 'center', marginTop: 8 },
  message: { ...T.subhead, color: C.secondary, textAlign: 'center' },
  button: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: C.fill },
  buttonText: { ...T.subhead, fontWeight: '600', color: C.tint },
});
