import { Text, View, StyleSheet } from 'react-native';
import { colors, hig } from '../design/tokens';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} maxFontSizeMultiplier={1.4}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: hig('body').size, color: colors.muted48 },
});