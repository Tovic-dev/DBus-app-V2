/**
 * GlassButton — Apple-style translucent push button with RN-core spring feedback.
 *
 * Visual model: a GlassSurface background with a label and optional leading
 * icon, press feedback via `Animated.spring` (RN core — no reanimated).
 *
 * FASE M-1: no react-native-reanimated / gesture-handler / @gorhom/bottom-sheet.
 */
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, type, control } from '../tokens';
import { interactiveSpring, PRESS_SCALE } from '../motion';

export type GlassButtonVariant = 'primary' | 'secondary';

export interface GlassButtonProps {
  /** Button label. */
  title: string;
  /** Tap handler. */
  onPress: () => void;
  /** Appearance variant. */
  variant?: GlassButtonVariant;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  /** HIG minimum touch target height. */
  height?: number;
  /** Disabled state. */
  disabled?: boolean;
  /** Extra styles for the button container. */
  style?: StyleProp<ViewStyle>;
  /** Extra styles for the label text. */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label (defaults to `title`). */
  accessibilityLabel?: string;
}

const BTN_TINT: Record<GlassButtonVariant, 'systemMaterial' | 'systemChromeMaterial'> = {
  primary: 'systemChromeMaterial',
  secondary: 'systemMaterial',
};

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  height = control.buttonHeight,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: GlassButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: PRESS_SCALE,
      useNativeDriver: true,
      ...interactiveSpring,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...interactiveSpring,
    }).start();
  };

  const labelColor =
    variant === 'primary' ? colors.bodyOnDark : colors.ink;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            height,
            minHeight: control.minTouch,
            borderRadius: radius.md,
            opacity: disabled ? 0.45 : 1,
          },
          style,
        ]}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <BlurView intensity={variant === 'primary' ? 48 : 40} tint={BTN_TINT[variant]} style={styles.blur}>
          <View style={styles.row}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text
              style={[
                styles.label,
                { color: labelColor, fontSize: type.button.size, fontWeight: type.button.weight as unknown as TextStyle['fontWeight'], letterSpacing: type.button.ls },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        </BlurView>
        {/* Hairline border for definition against blurred content. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderColor: 'rgba(255,255,255,0.45)',
              borderWidth: StyleSheet.hairlineWidth,
              borderRadius: radius.md,
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blur: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Platform.select({ ios: radius.md, android: radius.md, web: radius.md }) ?? radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    // Font weight/letter-spacing from the `type.button` token; color applied inline.
  },
});
