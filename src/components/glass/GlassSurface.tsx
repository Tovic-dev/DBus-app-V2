/**
 * GlassSurface — base glass material surface (PHASE N-1).
 *
 * A reusable container that renders an Apple material: a real iOS blur when one
 * is available, and a translucent View fallback when it is not. It owns the
 * material's radius, hairline edge and elevation, so consumers never hand-roll
 * a translucent background again.
 *
 * ── COMPATIBILITY (verified before implementation) ──
 *   Imports ONLY:
 *     · `expo-blur` 57.0.2 → installed; SDK 57 docs badge it "Included in
 *       Expo Go"; `intensity` (1..100) + `BlurTint` verified against
 *       node_modules/expo-blur/build/BlurView.types.d.ts.
 *     · React Native core (`View`, `StyleSheet`, `Platform`) → always in Expo Go.
 *   Forbidden and NOT used: react-native-reanimated, react-native-gesture-handler,
 *   @gorhom/bottom-sheet, @shopify/react-native-skia, custom native modules.
 *   None are installed. No new dependency was added by this phase.
 *
 * ── LAYER STRUCTURE (deliberate) ──
 *   host (transparent, NOT clipped) → carries the shadow
 *     └ material (clipped, radius + hairline) → BlurView or translucent View
 *         └ padded content
 *
 *   Two layers are required because iOS `overflow: 'hidden'` sets
 *   `masksToBounds = YES`, which clips the view's OWN shadow. The shadow must
 *   therefore live on an unclipped parent. expo-blur also documents that
 *   `borderRadius` is only honoured on the blur when `overflow: 'hidden'` is set,
 *   which is why the clipping happens on the material layer.
 *
 * ── FALLBACK STRATEGY ──
 *   On iOS a real UIVisualEffectView blur is rendered. Everywhere else (Android
 *   with the default `blurMethod: 'none'`, and web) expo-blur itself renders a
 *   semi-transparent view, so the surface additionally paints the variant's
 *   `fallbackBackground` veil to keep the material legible. The public API is
 *   unchanged either way — the phase is never blocked by blur availability.
 *
 * ── N-1 SCOPE ──
 *   This component is NOT mounted by any screen yet. It exists for N-2…N-5.
 *   The pre-existing M-1 material at src/design/surfaces/GlassSurface.tsx (used
 *   live by UnifiedSurface and FloatingTabBar) is untouched and unrelated: this
 *   file neither imports nor re-exports it.
 */
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  glassMaterial,
  resolveGlassPadding,
  resolveGlassRadius,
  type GlassPaddingValue,
  type GlassRadiusValue,
  type GlassVariant,
} from '../../theme/glass';

export type { GlassVariant } from '../../theme/glass';

export interface GlassSurfaceProps {
  /** Content rendered inside the material. */
  children?: React.ReactNode;
  /**
   * Material density: `light` | `medium` | `strong`. Controls tint, blur
   * intensity, default radius, fallback veil and elevation.
   * @default 'medium'
   */
  variant?: GlassVariant;
  /**
   * Inner padding in points, or a `glassSpacing` token name
   * ('none' | 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl').
   * @default 'md'
   */
  padding?: GlassPaddingValue;
  /**
   * Corner radius in points, or a `glassRadius` token name
   * ('none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill').
   * Defaults to the variant's radius (lg for light/medium, xl for strong).
   */
  radius?: GlassRadiusValue;
  /** Extra styles merged onto the outer host (layout, position, shadow overrides). */
  style?: StyleProp<ViewStyle>;
  /**
   * Force the blur on or off. Defaults to auto-detection: a real blur on iOS,
   * translucent fallback elsewhere. Set `false` to opt into the cheaper
   * translucent material on iOS too (e.g. inside a long list).
   */
  blur?: boolean;
}

/**
 * Whether a native blur can actually be produced on this platform.
 *
 * Verified against React Native 0.86.3's own Platform types
 * (node_modules/react-native/Libraries/Utilities/Platform.d.ts L55-96): `PlatformOS`
 * is `'ios' | 'android' | 'windows' | 'macos' | 'web'` — note `tvos` is NOT part
 * of the union in 0.86, so comparing against it is a TS2367 type error. Only the
 * iOS branch is checked, which also matches expo-blur's documented behaviour:
 * "renders a native blur view on iOS and falls back to a semi-transparent view
 * on Android". The SDK 57 docs list `intensity`/`tint` as Android|iOS|tvOS|Web,
 * but the project's target is iOS (app.json, iPhone 15), so every non-iOS
 * platform takes the translucent fallback path.
 */
const NATIVE_BLUR = Platform.OS === 'ios';

export function GlassSurface({
  children,
  variant = 'medium',
  padding = 'md',
  radius,
  style,
  blur,
}: GlassSurfaceProps) {
  const material = glassMaterial[variant];
  const resolvedRadius = resolveGlassRadius(radius, material.radius);
  const resolvedPadding = resolveGlassPadding(padding, 0);
  const useBlur = blur ?? NATIVE_BLUR;

  // Host carries the elevation and the rounded shadow path; it never clips.
  const hostStyle: ViewStyle = {
    borderRadius: resolvedRadius,
    ...material.shadow,
  };

  // Material layer clips so the blur honours the radius, and draws the hairline.
  const materialStyle: ViewStyle = {
    borderRadius: resolvedRadius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: material.fallbackBorder,
    // The veil is painted only where there is no real blur; on iOS the tint
    // already lays its own translucent layer over the blur.
    backgroundColor: useBlur ? 'transparent' : material.fallbackBackground,
  };

  const content = (
    <View style={[styles.content, { padding: resolvedPadding }]}>{children}</View>
  );

  return (
    <View style={[styles.host, hostStyle, style]}>
      {useBlur ? (
        <BlurView intensity={material.intensity} tint={material.tint} style={[styles.material, materialStyle]}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.material, materialStyle]}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    // Transparent: the material layer owns the visible background.
    // NOTE (Android): a `transparent` host means the `elevation` shadow may not
    // be drawn on Android, which requires a background to build its outline.
    // iOS — the primary platform — draws its shadow from the layer path and is
    // unaffected. Consumers needing an Android shadow can pass a backgroundColor
    // via `style`.
    backgroundColor: 'transparent',
  },
  material: {
    // `flexGrow: 1` (NOT `height: '100%'`) so one style serves both host kinds:
    //  · definite-height host (GlassButton, height = 50pt) → the blur fills it;
    //  · auto-height host (GlassCard) → grows to the content, parent wraps it.
    // `height: '100%'` would resolve against an auto-height parent and can
    // collapse to zero in Yoga; `flex: 1` would additionally force flexBasis 0
    // and ignore the content height in the card case.
    flexGrow: 1,
    // Centre content vertically when the host is taller than the content.
    justifyContent: 'center',
  },
  content: {
    // Same reasoning as `material`: fill width/height when the host is definite,
    // collapse to the content when it is not.
    flexGrow: 1,
  },
});
