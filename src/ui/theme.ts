/**
 * V2 Apple redesign · semantic colours and type ramp.
 *
 * Every neutral is a UIKit semantic colour (PlatformColor), so light/dark,
 * Increase Contrast and the elevated sheet palette all come from iOS itself.
 * The only brand colour is the DBus green.
 */
import { DynamicColorIOS, Platform, PlatformColor, type ColorValue, type TextStyle } from 'react-native';

const ios = Platform.OS === 'ios';
const sys = (name: string, fallback: string): ColorValue => (ios ? PlatformColor(name) : fallback);
const dyn = (light: string, dark: string): ColorValue => (ios ? DynamicColorIOS({ light, dark }) : light);

export const C = {
  /** Grouped screen background (black in dark mode). */
  bg: sys('systemGroupedBackground', '#f2f2f7'),
  /** Cell / card on a grouped background (elevated grey in dark mode). */
  cell: sys('secondarySystemGroupedBackground', '#ffffff'),
  /** Plain (non-grouped) background, used inside sheets. */
  plain: sys('systemBackground', '#ffffff'),
  label: sys('label', '#000000'),
  secondary: sys('secondaryLabel', 'rgba(60,60,67,0.6)'),
  tertiary: sys('tertiaryLabel', 'rgba(60,60,67,0.3)'),
  separator: sys('separator', 'rgba(60,60,67,0.29)'),
  fill: sys('tertiarySystemFill', 'rgba(118,118,128,0.12)'),
  pressed: sys('systemGray5', '#e5e5ea'),
  red: sys('systemRed', '#ff3b30'),
  /** Brand green for fills (badges, icon tiles, map dots). White text on it is bold. */
  brand: '#70AF00',
  /** Brand green tuned for text and glyph tints (AA on white and on black). */
  tint: dyn('#4E8A00', '#8BCB2F'),
  white: '#ffffff',
} as const;

/** iOS text styles (pt) — Dynamic Type scales these through RN font scaling. */
export const T = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.43 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.31 },
  subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.23 },
  footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08 },
  caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0 },
} satisfies Record<string, TextStyle>;

/** Layout metrics shared by every list. */
export const M = {
  margin: 16,
  /** iOS 26 inset-grouped corner radius. */
  cellRadius: 24,
  rowMinHeight: 52,
  sectionGap: 28,
} as const;
