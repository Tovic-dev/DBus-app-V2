/**
 * GlassButton — reusable glass push button (PHASE N-1).
 *
 * A Pressable-based glass control with visual states only: `default`,
 * `pressed`, `disabled`. It carries no navigation, no routing and no
 * screen-specific behaviour, so any future screen can adopt it unchanged.
 *
 * ── COMPATIBILITY (verified before implementation) ──
 *   Imports ONLY:
 *     · React Native core: `Animated`, `Pressable`, `View`, `Text`,
 *       `StyleSheet` → all part of RN itself, always present in Expo Go.
 *     · expo-blur 57.0.2, transitively via GlassSurface → "Included in Expo Go".
 *     · src/design/motion.ts presets → plain data, RN-core spring params.
 *   Forbidden and NOT used: react-native-reanimated, react-native-gesture-handler,
 *   @gorhom/bottom-sheet, @shopify/react-native-skia, custom native modules.
 *
 * ── SPRING PARAMS ──
 *   src/design/motion.ts declares itself the single source of spring
 *   configuration ("No hardcoded spring params outside this file"), so the press
 *   spring reuses `interactiveSpring` / `PRESS_SCALE` instead of inventing new
 *   numbers. This keeps the project-wide motion convention intact.
 *
 * ── TWO INDEPENDENT FEEDBACK CHANNELS (deliberate, Expo-Go hardening) ──
 *   1. An `Animated.spring` scale on an ISOLATED transform layer. Native driver
 *      is used for a transform only, never mixed with layout props — the exact
 *      pattern already validated on-device by FloatingTabBar. Commit 10fe9ef
 *      documents that driving LAYOUT props (`bottom`) natively silently fails on
 *      the Expo Go Fabric runtime, which is why no layout prop is animated here.
 *   2. A pure-style `pressed` veil driven by Pressable's own state function.
 *      This involves no animation system at all, so even if channel 1 were ever
 *      degraded on some runtime, the button still visibly responds to touch.
 *
 * ── N-1 SCOPE ──
 *   Not mounted by any screen yet; created for future phases.
 */
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { glassColor, glassOpacity, glassRadius, type GlassVariant } from '../../theme/glass';
import { control, type } from '../../design/tokens';
import { interactiveSpring, PRESS_SCALE } from '../../design/motion';

export interface GlassButtonProps {
  /** Button label. */
  title: string;
  /** Tap handler. */
  onPress: () => void;
  /**
   * Material density of the button surface.
   * @default 'strong'
   */
  variant?: GlassVariant;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  /** Button height in points. @default control.buttonHeight (50). */
  height?: number;
  /** Corner radius in points. @default glassRadius.pill (capsule). */
  radius?: number;
  /** Disabled state: dims the control and blocks interaction. */
  disabled?: boolean;
  /** Extra styles for the outer container (layout, margins). */
  style?: StyleProp<ViewStyle>;
  /** Extra styles for the label. */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label. @default `title` */
  accessibilityLabel?: string;
}

export function GlassButton({
  title,
  onPress,
  variant = 'strong',
  icon,
  height = control.buttonHeight,
  radius = glassRadius.pill,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: GlassButtonProps) {
  // Isolated transform layer — see the header note on channel 1.
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    // Animated.spring starting on an already-animating value stops the previous
    // animation automatically, so a rapid press/release stays interruptible
    // (HIG: motion must be interruptible) instead of queueing competing springs.
    Animated.spring(scale, {
      toValue,
      // Native driver on an ISOLATED transform-only layer. Never mixed with a
      // layout prop — see the header note and commit 10fe9ef.
      useNativeDriver: true,
      ...interactiveSpring,
    }).start();
  };

  return (
    <Animated.View style={[styles.animatedLayer, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(PRESS_SCALE)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        // ONE Pressable owns both visual channels. Its state function is used for
        // the children, so no nested Pressable is needed (a nested `disabled`
        // Pressable would never report `pressed`, and a second scale transform
        // would compound with the spring above).
        style={[
          styles.pressable,
          {
            height,
            minHeight: control.minTouch,
            opacity: disabled ? glassOpacity.disabled : 1,
          },
          style,
        ]}
      >
        {({ pressed }) => {
          const showVeil = pressed && !disabled;
          return (
            <GlassSurface variant={variant} padding={0} radius={radius} style={styles.surface}>
              {/* Channel 2 — pressed veil: pure style, no animation system, so it
                  responds to touch even if the spring layer is degraded. Clipped
                  to the material's radius by the material layer's overflow. */}
              {showVeil ? (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.veil]} />
              ) : null}
              <View style={styles.row}>
                {icon}
                <Text
                  style={[
                    {
                      fontSize: type.button.size,
                      fontWeight: type.button.weight as unknown as TextStyle['fontWeight'],
                      letterSpacing: type.button.ls,
                      color: glassColor.ink,
                    },
                    textStyle,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
            </GlassSurface>
          );
        }}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Carries ONLY the native-driven transform. Mixing it with a layout prop is
  // what broke UnifiedSurface on Expo Go (commit 10fe9ef); kept separate here.
  animatedLayer: {
    alignSelf: 'stretch',
  },
  pressable: {
    width: '100%',
    justifyContent: 'center',
  },
  surface: {
    // Fill the fixed-height Pressable so the blur covers the whole capsule.
    flexGrow: 1,
  },
  veil: {
    backgroundColor: glassColor.pressedVeil,
  },
  row: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

