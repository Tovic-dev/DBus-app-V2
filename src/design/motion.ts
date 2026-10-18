/**
 * Motion system — centralized Apple HIG motion presets (Phase G).
 *
 * Reference: HIG Motion — motion communicates hierarchy and spatial
 * relationships; animations should be short, interruptible and feel physical.
 *
 * Springs are interruptible and velocity-aware. RN core Animated.spring accepts
 * BOTH parametrizations (friction/tension AND stiffness/damping/mass), verified
 * in react-native/Libraries/Animated/animations/SpringAnimation.js (L54-58) and
 * Animated.d.ts (L358-362). No reanimated. No hardcoded spring params outside
 * this file (neither friction/tension nor stiffness/damping/mass).
 */

/** Fast, tactile response for direct manipulation (press in/out, pills). */
export const interactiveSpring = {
  damping: 26,
  stiffness: 380,
  mass: 0.8,
} as const;

/** Tab/view transitions — slightly heavier, settles calmly. */
export const navigationSpring = {
  damping: 24,
  stiffness: 280,
  mass: 0.9,
} as const;

/** Bottom sheet / surface movement — Apple Maps feel, gentle settle. */
export const sheetSpring = {
  // Exact friction/tension UnifiedSurface shipped and the user validated
  // on-device in Phase M-2; centralized here unchanged (RN core format).
  friction: 9,
  tension: 66,
} as const;

/** Small selection state changes (segmented controls, chips, favorites). */
export const selectionSpring = {
  damping: 20,
  stiffness: 340,
  mass: 0.7,
} as const;

/** Standard durations for non-spring micro-animations (ms). */
export const timing = {
  fast: 150,
  normal: 240,
  slow: 350,
} as const;

/** Press-in scale for touch feedback (Wallet/Find My subtlety). */
export const PRESS_SCALE = 0.96;

/** Alias used by the tab bar (kept for readability at call sites). */
export const tabSpring = interactiveSpring;

/** Local SPRING binding used inside FloatingTabBar (re-exported preset). */
export const SPRING = selectionSpring;