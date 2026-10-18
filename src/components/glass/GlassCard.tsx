/**
 * GlassCard — card abstraction on top of GlassSurface (PHASE N-1).
 *
 * A thin, opinionated wrapper that fixes sensible card defaults (density,
 * padding, radius) and forwards everything else to GlassSurface. Intended for
 * Home, Profile, Saved and the screens added in N-2…N-5.
 *
 * ── COMPATIBILITY ──
 *   Inherits GlassSurface's verified stack (expo-blur 57.0.2 + RN core). This
 *   file itself imports ONLY React Native core (`View`, `StyleSheet`) and the
 *   N-1 glass tokens. No forbidden library, no new dependency.
 *
 * ── DISCIPLINE (spec) ──
 *   No business logic. No API calls. No navigation. No hooks at all — neither
 *   this component nor the N-1 GlassSurface calls a hook, so a card is material
 *   + layout and nothing else.
 *
 * ── N-1 SCOPE ──
 *   Not mounted by any screen yet; created for future phases.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
import { glassSpacing, type GlassPaddingValue } from '../../theme/glass';

export interface GlassCardProps
  extends Omit<GlassSurfaceProps, 'variant' | 'padding'> {
  /**
   * Material density. Cards default to `light` — the thinnest material reads
   * best against a light content canvas (Apple Music / Wallet cards).
   * @default 'light'
   */
  variant?: GlassSurfaceProps['variant'];
  /**
   * Inner padding in points or a `glassSpacing` token name.
   * @default 'md'
   */
  padding?: GlassPaddingValue;
  /** Extra styles merged onto the surface host. */
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  variant = 'light',
  padding = glassSpacing.md,
  radius,
  style,
  blur,
}: GlassCardProps) {
  return (
    <GlassSurface variant={variant} padding={padding} radius={radius} style={[styles.card, style]} blur={blur}>
      <View style={styles.inner}>{children}</View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    // A card is a block-level element: it takes the available width so its
    // content can lay out predictably (mirrors GlassCard in design/surfaces).
    alignSelf: 'stretch',
  },
  inner: {
    width: '100%',
  },
});
