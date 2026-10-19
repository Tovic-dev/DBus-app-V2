/** A list row for loading / error / permission states inside a section. */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SFSymbolIcon, type SFSymbolName } from '../components/SFSymbolIcon';
import { C, M, T } from './theme';

export function LoadingRow({ label }: { label: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <ActivityIndicator />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function MessageRow({ icon, label, actionLabel, onAction }: { icon?: SFSymbolName; label: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      {icon ? <SFSymbolIcon name={icon} size={18} color={C.secondary} /> : null}
      <Text style={styles.text}>{label}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: M.rowMinHeight, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: M.margin, paddingVertical: 12 },
  text: { ...T.subhead, color: C.secondary, flex: 1 },
  action: { ...T.subhead, fontWeight: '600', color: C.tint },
});
