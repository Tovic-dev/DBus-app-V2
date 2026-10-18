/**
 * GlassSurface — Apple Maps / iOS 26 material surface base.
 *
 * FASE M-1 implementation. Only verified-compatible libraries are used:
 *  - expo-blur BlurView (ships in Expo Go; tint systemMaterial/systemChromeMaterial)
 *  - react-native-safe-area-context (ships in Expo Go)
 *  - React Native core Animated / PanResponder / View
 *
 * NOT used (FASE M-1 prohibition + documented Expo Go crash in UnifiedSurface.tsx):
 *  - react-native-reanimated
 *  - react-native-gesture-handler
 *  - @gorhom/bottom-sheet
 *
 * On platforms where the native blur module is unavailable, the surface
 * degrades gracefully to a static translucent material (same fallback specified
 * by the FASE M-1 visual requirements).
 */
import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, productShadow, softShadow } from '../tokens';
import { glassColor, glassMaterial } from '../../theme/glass';

/**
 * V2 · Real iOS 26 Liquid Glass (UIGlassEffect) for the chrome layer — map
 * sheet and floating overlays. Content cards keep the classic material, as
 * Apple reserves Liquid Glass for navigation/controls floating over content.
 * Evaluated once: the answer cannot change while the app runs.
 */
const LIQUID_GLASS = isLiquidGlassAvailable();

export type GlassVariant = 'card' | 'sheet' | 'floating';

export interface GlassSurfaceProps {
  /** Content rendered inside the material surface. */
  children?: React.ReactNode;
  /** Additional styles merged onto the surface container. */
  style?: StyleProp<ViewStyle>;
  /**
   * Material variant controls tint, intensity, corner radius, shadow and
   * safe-area handling.
   * - `card`     → systemMaterial, 40, radius.md, soft shadow   (elevated content blocks)
   * - `sheet`    → systemMaterial, 36, pill top corners, no side radius, top safe-area (bottom sheet content)
   * - `floating` → systemChromeMaterial, 48, radius.xl, product shadow (map overlays / toolbars)
   * @default 'card'
   */
  variant?: GlassVariant;
  /** Apply the top safe-area inset as padding. Default: true for `sheet`/`floating`. */
  safeAreaTop?: boolean;
}

interface VariantConfig {
  tint: 'systemMaterial' | 'systemChromeMaterial' | 'default';
  intensity: number;
  containerStyle: ViewStyle;
  safeAreaTopDefault: boolean;
}

const VARIANTS: Record<GlassVariant, VariantConfig> = {
  card: {
    tint: 'systemMaterial',
    intensity: 40,
    safeAreaTopDefault: false,
    containerStyle: {
      borderRadius: radius.md,
      ...softShadow,
    },
  },
  sheet: {
    tint: 'systemMaterial',
    intensity: 36,
    safeAreaTopDefault: true,
    containerStyle: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      // A bottom sheet keeps its bottom corners square to the seam.
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      ...softShadow,
    },
  },
  floating: {
    tint: 'systemChromeMaterial',
    intensity: 48,
    safeAreaTopDefault: true,
    containerStyle: {
      borderRadius: radius.xl,
      ...productShadow,
    },
  },
};

/** Translucent fallback used when native blur is unavailable (web / degraded). */
const FALLBACK_BG = glassMaterial.medium.fallbackBackground;
const FALLBACK_BORDER = glassColor.hairline;

export function GlassSurface({
  children,
  style,
  variant = 'card',
  safeAreaTop,
}: GlassSurfaceProps) {
  const cfg = VARIANTS[variant];
  const applySafeArea = safeAreaTop ?? cfg.safeAreaTopDefault;
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    overflow: 'hidden',
    backgroundColor: FALLBACK_BG,
    borderColor: FALLBACK_BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    ...cfg.containerStyle,
  };

  if (LIQUID_GLASS && variant !== 'card') {
    return (
      <GlassView
        glassEffectStyle="regular"
        style={[
          { overflow: 'hidden', ...cfg.containerStyle },
          applySafeArea ? { paddingTop: insets.top } : null,
          style,
        ]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={cfg.intensity}
      tint={cfg.tint}
      style={[
        styles.surface,
        containerStyle,
        applySafeArea ? { paddingTop: insets.top } : null,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: FALLBACK_BG,
    borderColor: FALLBACK_BORDER,
    overflow: 'hidden',
  },
});
