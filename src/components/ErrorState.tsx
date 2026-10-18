import { Text, View, Pressable, StyleSheet } from 'react-native';
import { colors, hig, radius, control } from '../design/tokens';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} maxFontSizeMultiplier={1.4}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: hig('body').size, color: colors.danger, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: colors.primary, paddingHorizontal: control.chipPaddingH + 4, paddingVertical: control.chipPaddingV, borderRadius: radius.sm },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: hig('footnote').size },
});