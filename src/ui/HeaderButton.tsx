/**
 * Navigation-bar button. On iOS 26 UIKit wraps bar items in the shared Liquid
 * Glass capsule automatically, so this only supplies the glyph or the label.
 */
import { Pressable, Text } from 'react-native';
import { SFSymbolIcon, type SFSymbolName } from '../components/SFSymbolIcon';
import { C, T } from './theme';

export function HeaderButton({ icon, label, onPress, accessibilityLabel, bold }: {
  icon?: SFSymbolName;
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
  bold?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingHorizontal: 4, minHeight: 32, justifyContent: 'center' })}
    >
      {icon ? (
        <SFSymbolIcon name={icon} size={20} color={C.label} />
      ) : (
        <Text style={{ ...T.body, fontWeight: bold ? '600' : '400', color: C.tint }}>{label}</Text>
      )}
    </Pressable>
  );
}
