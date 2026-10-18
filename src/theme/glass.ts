/**
 * glass.ts — Apple material tokens (PHASE N-1 "Apple Material Foundation").
 *
 * Pure data module. NO components, NO hooks, NO business logic, and NO React
 * Native runtime import (the two imports below are `import type`, erased at
 * compile time, so this file adds zero runtime modules to the bundle graph).
 *
 * Every value is DERIVED from the existing design system (src/design/tokens.ts)
 * instead of being re-invented, so the new material layer cannot drift from the
 * screens that already ship.
 *
 * ── COMPATIBILITY (verified BEFORE implementation, see PHASE_N1_FINDINGS.md) ──
 *   expo-blur 57.0.2 · Expo SDK 57.0.16 · React Native 0.86.3 · React 19.2.3
 *   · `BlurTint` + `intensity` (1..100) are the documented SDK 57 BlurView API
 *     (node_modules/expo-blur/build/BlurView.types.d.ts) and the SDK 57 docs
 *     badge expo-blur as "Included in Expo Go".
 *   · Animated / Pressable / StyleSheet are React Native core → always present
 *     in Expo Go.
 *   · NOT used anywhere in this phase (all proven to crash the Expo Go SDK 57
 *     binary — PHASE_M3_FINDINGS.md §1, Phases I-24…I-29 bisection):
 *     react-native-reanimated, react-native-gesture-handler,
 *     @gorhom/bottom-sheet, @shopify/react-native-skia, custom native modules.
 *     None of them are installed (`node_modules` check: all absent).
 *
 * ── SCOPE ──
 *   Nothing in this file is imported by any existing screen during N-1, which is
 *   why the application renders pixel-identically after this phase. N-2…N-5
 *   consume it.
 */
import type { ColorValue, ViewStyle } from 'react-native';
import { DynamicColorIOS, Platform } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { colors, radius, spacing, productShadow, softShadow } from '../design/tokens';

/**
 * The three material densities of the system. Named after optical density
 * (how much of the content behind the glass still reads through) rather than
 * after a screen, so the tokens stay reusable across every future screen.
 *
 *  - `light`  → thinnest material, most see-through. Cards on a light canvas.
 *  - `medium` → standard iOS material. Grouped content, list containers.
 *  - `strong` → densest chrome material. Floating overlays on top of the map.
 */
export type GlassVariant = 'light' | 'medium' | 'strong';

/* -------------------------------------------------------------------------- */
/* Radius system                                                              */
/* -------------------------------------------------------------------------- */

/** Canonical glass corner radii (pt). Mirrors `radius` — no arbitrary values. */
export const glassRadius = {
  none: radius.none,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
} as const;

export type GlassRadiusLevel = keyof typeof glassRadius;

/** `radius` props accept either a token name or an explicit point value. */
export type GlassRadiusValue = number | GlassRadiusLevel;

/* -------------------------------------------------------------------------- */
/* Blur intensity system                                                      */
/* -------------------------------------------------------------------------- */

/**
 * BlurView `intensity` per material density. expo-blur documents `intensity` as
 * "a number from 1 to 100"; all values below sit inside that range.
 *
 * These are STATIC values on purpose. Animating `intensity` is only possible
 * with react-native-reanimated (per the expo-blur docs), which is forbidden in
 * this project, so no code may attempt to drive these numbers over time.
 */
export const glassBlur = {
  light: 30,
  medium: 44,
  strong: 60,
} as const satisfies Record<GlassVariant, number>;

/* -------------------------------------------------------------------------- */
/* Tint system                                                                */
/* -------------------------------------------------------------------------- */

/**
 * iOS UIVisualEffectView material behind each density. Typed against expo-blur's
 * own `BlurTint` union so an illegal tint is a compile error, not a runtime one.
 *
 * V2: the app follows the system appearance (`userInterfaceStyle: "automatic"`);
 * the un-suffixed materials are adaptive and switch with light/dark mode.
 */
export const glassTint = {
  light: 'systemUltraThinMaterial',
  medium: 'systemMaterial',
  strong: 'systemChromeMaterial',
} as const satisfies Record<GlassVariant, BlurTint>;

/* -------------------------------------------------------------------------- */
/* Opacity system                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Alpha ladder for the material's non-blur layers. Single source of truth for
 * the fallback veils, the hairline edge highlight and the interaction veils, so
 * no component ever hardcodes an rgba() alpha.
 */
export const glassOpacity = {
  /** Translucent white veil per density — the fallback when blur is absent. */
  veilLight: 0.55,
  veilMedium: 0.68,
  veilStrong: 0.82,
  /** Hairline edge highlight that separates glass from blurred content. */
  hairline: 0.45,
  /** Darkening veil laid over the material while pressed. */
  pressed: 0.06,
  /** Whole-control opacity in the disabled state (Apple ~45%). */
  disabled: 0.45,
} as const;

/* -------------------------------------------------------------------------- */
/* Colour system (material-only)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Colours the glass layer owns. Alphas always come from `glassOpacity`.
 * Label colours are re-exported from the product palette rather than duplicated.
 */
/** V2 · light/dark adaptive colour (iOS resolves it natively per appearance). */
function adaptive(light: string, dark: string): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
}

/** Translucent veil per density, white in light mode and graphite in dark. */
const veil = (alpha: number): ColorValue =>
  adaptive(`rgba(255,255,255,${alpha})`, `rgba(28,28,30,${alpha})`);

export const glassColor = {
  /** Edge highlight drawn as a hairline border on the material. */
  hairline: adaptive(`rgba(255,255,255,${glassOpacity.hairline})`, 'rgba(255,255,255,0.12)'),
  /** Pressed veil (laid over the material, never over the label). */
  pressedVeil: `rgba(0,0,0,${glassOpacity.pressed})`,
  /** Label colour on every glass density (all materials are light-mode). */
  ink: colors.ink,
  /** Secondary / muted label colour on glass. */
  inkMuted: colors.bodyMuted,
  /** Brand accent for emphasised glass content. */
  accent: colors.primary,
} as const;

/* -------------------------------------------------------------------------- */
/* Shadow system                                                              */
/* -------------------------------------------------------------------------- */

/** The subset of ViewStyle that carries elevation. Keeps shadows declarative. */
export type GlassShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Elevation presets. `soft` / `product` are the two shadows the product already
 * uses (src/design/tokens.ts) — re-exported, not re-authored. `flat` neutralises
 * an inherited shadow when a consumer supplies its own elevation.
 *
 * ⚠ iOS: `overflow: 'hidden'` maps to `masksToBounds = YES`, which CLIPS a view's
 * own shadow. A shadow therefore has to live on a non-clipped layer. This is why
 * GlassSurface renders a transparent shadow host around the clipped material —
 * the same structure UnifiedSurface had to hand-roll with its `shadowReset`.
 */
export const glassShadow: Record<'flat' | 'soft' | 'product', GlassShadowStyle> = {
  flat: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: { ...softShadow },
  product: { ...productShadow },
};

/* -------------------------------------------------------------------------- */
/* Spacing system                                                             */
/* -------------------------------------------------------------------------- */

/** Inner padding presets (pt). Mirrors the product `spacing` ladder exactly. */
export const glassSpacing = {
  none: 0,
  xxs: spacing.xxs,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
} as const;

export type GlassPaddingLevel = keyof typeof glassSpacing;

/** `padding` props accept either a token name or an explicit point value. */
export type GlassPaddingValue = number | GlassPaddingLevel;

/* -------------------------------------------------------------------------- */
/* Material configuration                                                     */
/* -------------------------------------------------------------------------- */

/** Everything needed to render one material density, in one place. */
export interface GlassMaterial {
  /** expo-blur tint applied to the BlurView. */
  tint: BlurTint;
  /** expo-blur intensity, 1..100. */
  intensity: number;
  /** Default corner radius (pt) for this density. */
  radius: number;
  /**
   * Translucent veil used when a real blur is unavailable (Android, web, or a
   * degraded runtime). This is the spec's "translucent View fallback".
   */
  fallbackBackground: ColorValue;
  /** Hairline edge colour for this density. */
  fallbackBorder: ColorValue;
  /** Elevation this density carries by default. */
  shadow: GlassShadowStyle;
}

/**
 * Resolved material table consumed by the glass components.
 *
 * NOTE on layering: on iOS an expo-blur tint ALREADY paints a translucent colour
 * layer over the blur (documented SDK 57 behaviour), so the material view stays
 * transparent there and `fallbackBackground` is only applied when the blur is
 * known to be absent. Painting the veil unconditionally would flatten the glass.
 */
export const glassMaterial: Record<GlassVariant, GlassMaterial> = {
  light: {
    tint: glassTint.light,
    intensity: glassBlur.light,
    radius: glassRadius.lg,
    fallbackBackground: veil(glassOpacity.veilLight),
    fallbackBorder: glassColor.hairline,
    shadow: glassShadow.soft,
  },
  medium: {
    tint: glassTint.medium,
    intensity: glassBlur.medium,
    radius: glassRadius.lg,
    fallbackBackground: veil(glassOpacity.veilMedium),
    fallbackBorder: glassColor.hairline,
    shadow: glassShadow.soft,
  },
  strong: {
    tint: glassTint.strong,
    intensity: glassBlur.strong,
    radius: glassRadius.xl,
    fallbackBackground: veil(glassOpacity.veilStrong),
    fallbackBorder: glassColor.hairline,
    shadow: glassShadow.product,
  },
};

/* -------------------------------------------------------------------------- */
/* Resolvers (pure functions — no hooks, no side effects)                     */
/* -------------------------------------------------------------------------- */

/** Resolve a `padding` prop (token name | points | undefined) to points. */
export function resolveGlassPadding(
  padding: GlassPaddingValue | undefined,
  fallback = 0,
): number {
  if (padding === undefined) return fallback;
  return typeof padding === 'number' ? padding : glassSpacing[padding];
}

/** Resolve a `radius` prop (token name | points | undefined) to points. */
export function resolveGlassRadius(
  value: GlassRadiusValue | undefined,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? value : glassRadius[value];
}



