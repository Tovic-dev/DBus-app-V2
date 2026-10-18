/**
 * Design tokens — Apple design language.
 * Source: design.md (Apple SF Pro / system-ui, Action Blue #0066cc).
 * Note: SF Pro is a proprietary Apple font. On iOS the default RN system font
 * is SF Pro, so screens intentionally do NOT override fontFamily on iOS and
 * instead rely on the platform default (which resolves to SF Pro).
 * `system-ui` is used as a neutral stack fallback where a font name is needed.
 */

import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

/**
 * V2 · Light/dark adaptive colour. On iOS it resolves natively per trait
 * collection (follows the system appearance with no re-render). Elsewhere it
 * falls back to the light value.
 */
function adaptive(light: string, dark: string): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
}

export const colors = {
  // Brand colours stay plain hex strings: they read well in both appearances
  // and some call sites append an alpha suffix (`${colors.primary}12`).
  primary: '#70AF00',
  primaryFocus: '#5c8f00',
  primaryOnDark: '#8fd42e',
  // Neutrals adapt to dark mode (values follow Apple's system palette).
  ink: adaptive('#1d1d1f', '#f5f5f7'),
  bodyMuted: adaptive('#5c5c60', '#a1a1a6'),
  muted80: adaptive('#333333', '#e5e5ea'),
  muted48: adaptive('#7a7a7a', '#98989f'),
  bodyOnDark: '#ffffff',
  canvas: adaptive('#ffffff', '#1c1c1e'),
  parchment: adaptive('#f5f5f7', '#000000'),
  pearl: adaptive('#fafafc', '#1c1c1e'),
  hairline: adaptive('#e0e0e0', '#38383a'),
  dividerSoft: adaptive('#f0f0f0', '#2c2c2e'),
  tile1: '#272729',
  tile2: '#2a2a2c',
  tile3: '#252527',
  black: '#000000',
  onPrimary: '#ffffff',
  success: '#0f9447',
  warning: '#f5a623',
  danger: '#ff3b30',
  live: '#3adf6f',
  translucentChip: adaptive('rgba(210,210,215,0.64)', 'rgba(118,118,128,0.24)'),
  /** Soft border (search fields, subtle outlines). */
  borderSoft: adaptive('rgba(0,0,0,0.08)', 'rgba(255,255,255,0.12)'),
  /** Modal backdrop scrim (Apple ~35% black). */
  overlayScrim: 'rgba(0,0,0,0.35)',
} as const;

/** Brand-green gradient for wallets/branding — the ONLY gradient in the system. */
export const gradient = {
  brandTop: '#7fc214',
  brandBottom: '#527f00',
  accent: '#70AF00',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 17,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
} as const;

export const radius = {
  none: 0,
  xs: 5,
  sm: 8,
  md: 11,
  lg: 18,
  xl: 24,
  pill: 9999,
  full: 9999,
} as const;

/** Apple's ONE product shadow; reused sparingly for floating sheets on maps. */
export const productShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 18,
  elevation: 8,
} as const;

/** Contrast elevation for interactive cards (never text). */
export const softShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
} as const;

/**
 * Apple HIG control metrics (pt). One source of truth for touch targets,
 * rows, search fields, buttons and list rows across ALL screens.
 */
export const control = {
  /** HIG minimum touch target. */
  minTouch: 44,
  /** Unified search field height (Apple Maps / Settings style). */
  searchHeight: 44,
  /** Unified primary/secondary button height. */
  buttonHeight: 50,
  /** Standard list row vertical padding (Settings-style inset grouped rows). */
  rowPaddingV: 12,
  rowPaddingH: 16,
  /** Leading accessory icon size in list rows. */
  rowIconSize: 34,
  /** Section header (uppercase group label) height gap. */
  groupTitleGap: 6,
  /** Standard segmented-control / chip padding. */
  chipPaddingH: 16,
  chipPaddingV: 10,
  /** Search field icon size. */
  searchIconSize: 17,
} as const;

/**
 * Safe-area / navigation spacing system. All screens must compose their
 * paddings from these values — never raw numbers.
 */
export const layout = {
  /** Horizontal content margin used by every screen (cards, titles, lists). */
  contentMargin: 24,
  /** Bottom padding for scroll content: clears the native tab bar (49pt) +
   *  home indicator (34pt) + breathing room. */
  bottomScroll: 110,
  /** Top padding after safe-area inset for tab screens without headers. */
  tabTop: 12,
  /** Vertical padding for screen headers (title blocks). */
  headerPaddingV: 16,
  /** Space between major sections on a screen. */
  sectionGap: 32,
  /** Space between cards inside a section. */
  cardGap: 12,
  /** Floating sheet / toolbar inset from screen edges. */
  floatInset: 12,
  /** Floating action button (map recenter) diameter. */
  fabSize: 48,
} as const;

/**
 * Typography ladder (SF Pro Text/Display). Values are React Native numbers.
 * Headlines use weight 600 with negative tracking ("Apple tight").
 */
export const type = {
  hero: { size: 34, weight: '700' as const, lh: 1.1, ls: -0.4 },
  display: { size: 28, weight: '700' as const, lh: 1.15, ls: -0.3 },
  title: { size: 22, weight: '700' as const, lh: 1.2, ls: -0.2 },
  titleMuted: { size: 22, weight: '600' as const, lh: 1.2, ls: -0.2 },
  lead: { size: 20, weight: '400' as const, lh: 1.25, ls: -0.1 },
  body: { size: 17, weight: '400' as const, lh: 1.47, ls: -0.2 },
  bodyStrong: { size: 17, weight: '600' as const, lh: 1.4, ls: -0.2 },
  caption: { size: 14, weight: '400' as const, lh: 1.43, ls: -0.2 },
  captionStrong: { size: 14, weight: '600' as const, lh: 1.3, ls: -0.2 },
  button: { size: 17, weight: '600' as const, lh: 1.24, ls: -0.2 },
  utility: { size: 14, weight: '400' as const, lh: 1.3, ls: -0.2 },
  fine: { size: 12, weight: '400' as const, lh: 1.4, ls: -0.1 },
  micro: { size: 10, weight: '400' as const, lh: 1.3, ls: -0.05 },
  displayRoute: { size: 56, weight: '700' as const, lh: 1.05, ls: -1 },
} as const;

/**
 * Apple HIG canonical text styles (iOS Dynamic Type defaults, Large).
 * Screens should prefer these over the custom ladder above.
 */
export const higText = {
  largeTitle: { size: 34, weight: '700' as const, ls: -0.6 },
  title: { size: 28, weight: '700' as const, ls: -0.4 },
  title2: { size: 22, weight: '700' as const, ls: -0.2 },
  title3: { size: 20, weight: '700' as const, ls: -0.2 },
  headline: { size: 17, weight: '600' as const, ls: -0.2 },
  body: { size: 17, weight: '400' as const, ls: -0.2 },
  callout: { size: 16, weight: '400' as const, ls: -0.1 },
  subheadline: { size: 15, weight: '400' as const, ls: -0.1 },
  subheadlineStrong: { size: 15, weight: '600' as const, ls: -0.1 },
  footnote: { size: 13, weight: '400' as const, ls: 0 },
  caption: { size: 12, weight: '400' as const, ls: 0 },
  caption2: { size: 11, weight: '400' as const, ls: 0 },
} as const;

/** Typographic helper: apply a higText style to a Text style object.
 * Returns both the RN style props (fontSize/fontWeight/letterSpacing) and the
 * raw token fields (size/weight/ls) so callers can do either
 * `{...hig('title')}` or `fontSize: hig('title').size`. */
export function hig(style: keyof typeof higText, color?: string) {
  const s = higText[style];
  return {
    size: s.size,
    weight: s.weight as unknown as '400' | '600' | '700',
    ls: s.ls,
    fontSize: s.size,
    fontWeight: s.weight as unknown as '400' | '600' | '700',
    letterSpacing: s.ls,
    ...(color ? { color } : {}),
  } as const;
}