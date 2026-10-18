/**
 * Squircle tokens — Apple continuous-corner geometry.
 *
 * iOS does not use plain border-radius: it uses continuous (superellipse)
 * corners. We approximate the iOS "smoothness" by sampling a superellipse
 * with exponent n = 2 + smoothing * 3 (n = 2 is a perfect circle; ~3.8-5
 * matches the iOS squircle look).
 */
export const SQUIRCLE = {
  /** Corner smoothing factor 0..1 (0 = circle corners, 1 = maximal squircle). */
  smoothing: 0.6,
  /** Sample points per corner quarter — 14 is visually indistinguishable from analytic. */
  segmentsPerCorner: 14,
  /** Canonical squircle corner radii (pt). No arbitrary radii allowed. */
  small: 12, // chips, search fields, small tiles
  medium: 18, // cards, favorite tiles, buttons
  large: 28, // hero cards, sheets, tab bar capsule
} as const;

export type SquircleLevel = 'small' | 'medium' | 'large';

/**
 * Geometry tokens (Phase E) — centralized layout geometry.
 * tabBottomSpacing is added on top of the safe-area inset (never a fixed number).
 */
export const geometry = {
  squircleSmall: SQUIRCLE.small,
  squircleMedium: SQUIRCLE.medium,
  squircleLarge: SQUIRCLE.large,
  tabBarHeight: 56,
  tabBarInset: 12, // horizontal inset from screen edges
  tabBarBottomSpacing: 2, // extra gap above safe-area bottom inset (kept minimal so the capsule reads as a natural extension of the device; HIG Layout: respect safe areas, avoid arbitrary float)
  cardGeometry: {
    level: 'medium' as SquircleLevel,
    borderWidth: 1,
  },
} as const;

