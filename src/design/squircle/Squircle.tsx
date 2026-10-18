/**
 * Squircle — Apple continuous-corner geometry.
 *
 * Skia was removed in Phase I-5 to isolate a native crash in Expo Go. This is
 * the permanent implementation: clipped borderRadius views, visually identical
 * to the previous build (which already rendered via borderRadius and never
 * consumed the Skia path; the superellipse code was dead output). A true continuous-corner superellipse render would need Skia in a dev build, which is intentionally out of scope for Expo Go.
 */

import React from 'react';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { SQUIRCLE, type SquircleLevel } from './squircleTokens';

const RADIUS: Record<SquircleLevel, number> = {
  small: SQUIRCLE.small,
  medium: SQUIRCLE.medium,
  large: SQUIRCLE.large,
};

/**
 * Squircle view: continuous-corner look via clipped borderRadius views.
 * Usage: <Squircle level="medium" backgroundColor="#fff" style={{...}}>…</Squircle>
 */
export function Squircle({
  level = 'medium',
  radius: radiusOverride,
  backgroundColor = 'transparent',
  border,
  style,
  children,
}: {
  level?: SquircleLevel;
  /** Override the token radius (only for special cases; prefer `level`). */
  radius?: number;
  backgroundColor?: ColorValue;
  /** Optional hairline border drawn in the same superellipse path. */
  border?: { color: ColorValue; width?: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const r = radiusOverride ?? RADIUS[level];
  const hasFill = backgroundColor !== 'transparent';
  const borderWidth = border?.width ?? StyleSheet.hairlineWidth;
  return (
    <View style={[styles.container, { borderRadius: r }, style]}>
      {hasFill || border ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            hasFill ? { backgroundColor } : null,
            { borderRadius: r },
            border ? { borderWidth, borderColor: border.color } : null,
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ container: { overflow: 'hidden' } });
