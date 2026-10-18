/**
 * GlassCard — Apple-style elevated content card built on GlassSurface.
 *
 * A thin wrapper that fixes `variant="card"` and standardizes internal
 * padding using the design system's spacing tokens. Used by Home, Favoritos
 * and Resultados screens.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../tokens';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

export interface GlassCardProps extends Omit<GlassSurfaceProps, 'variant'> {
  /** Inner padding. Defaults to `spacing.md` (12 pt). */
  padding?: number;
}

export function GlassCard({ children, style, padding = spacing.md, ...rest }: GlassCardProps) {
  return (
    <GlassSurface variant="card" style={style} {...rest}>
      <View style={[styles.inner, { padding }]}>{children}</View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: '100%',
  },
});
