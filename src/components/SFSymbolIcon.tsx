/**
 * SF Symbols icon wrapper (Apple iconography).
 *
 * iOS (dev build / production): renders the native SF Symbol via
 * react-native-sfsymbols. Expo Go does NOT bundle that native component
 * (RNSfsymbols), so there we always use the Ionicons fallback.
 * Android: react-native-sfsymbols has no Android native component, so it
 * always falls back to a visually equivalent Ionicons glyph.
 *
 * All screens/components must import SFSymbolIcon instead of using
 * Ionicons directly, so the icon system stays consistent.
 */
import { Platform } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import type { SymbolScale, SymbolWeight } from 'react-native-sfsymbols';

/** SF Symbol names used across the app. */
export type SFSymbolName =
  | 'house.fill'
  | 'house'
  | 'map.fill'
  | 'map'
  | 'arrow.triangle.branch'
  | 'heart.fill'
  | 'heart'
  | 'person.crop.circle.fill'
  | 'person.crop.circle'
  | 'figure.walk'
  | 'location.fill'
  | 'location.viewfinder'
  | 'arrow.clockwise'
  | 'chevron.forward'
  | 'chevron.down'
  | 'wifi'
  | 'clock'
  | 'arrow.up.arrow.down'
  | 'star.fill'
  | 'star'
  | 'magnifyingglass'
  | 'xmark.circle.fill'
  | 'tray'
  | 'exclamationmark.circle.fill'
  | 'globe'
  | 'bell.badge.fill'
  | 'figure.roll'
  | 'questionmark.circle'
  | 'info.circle'
  | 'bus.fill'
  | 'arrow.left.arrow.right'
  | 'gearshape'
  | 'location'
  | 'location.slash'
  | 'xmark'
  | 'checkmark'
  | 'trash'
  | 'exclamationmark.triangle'
  | 'heart.slash'
  | 'mappin.and.ellipse'
  | 'signpost.right'
  | 'point.topleft.down.to.point.bottomright.curvepath'
  | 'calendar'
  | 'chevron.backward';

/** Android-only fallback: SF Symbol -> closest Ionicons glyph. */
const FALLBACK: Record<SFSymbolName, keyof typeof Ionicons.glyphMap> = {
  'house.fill': 'home',
  house: 'home-outline',
  'map.fill': 'map',
  map: 'map-outline',
  'arrow.triangle.branch': 'navigate',
  'heart.fill': 'heart',
  heart: 'heart-outline',
  'person.crop.circle.fill': 'person',
  'person.crop.circle': 'person-outline',
  'figure.walk': 'walk',
  'location.fill': 'location',
  'location.viewfinder': 'locate',
  'arrow.clockwise': 'reload',
  'chevron.forward': 'chevron-forward',
  'chevron.down': 'chevron-down',
  wifi: 'wifi',
  clock: 'time-outline',
  'arrow.up.arrow.down': 'swap-vertical',
  'star.fill': 'star',
  star: 'star-outline',
  magnifyingglass: 'search',
  'xmark.circle.fill': 'close-circle',
  tray: 'file-tray',
  'exclamationmark.circle.fill': 'alert-circle',
  globe: 'language',
  'bell.badge.fill': 'notifications',
  'figure.roll': 'accessibility',
  'questionmark.circle': 'help-circle',
  'info.circle': 'information-circle',
  'bus.fill': 'bus',
  'arrow.left.arrow.right': 'swap-horizontal',
  gearshape: 'settings-outline',
  location: 'navigate-outline',
  'location.slash': 'navigate-outline',
  xmark: 'close',
  checkmark: 'checkmark',
  trash: 'trash-outline',
  'exclamationmark.triangle': 'warning-outline',
  'heart.slash': 'heart-dislike-outline',
  'mappin.and.ellipse': 'location-outline',
  'signpost.right': 'trail-sign-outline',
  'point.topleft.down.to.point.bottomright.curvepath': 'git-branch-outline',
  calendar: 'calendar-outline',
  'chevron.backward': 'chevron-back',
};

export interface SFSymbolIconProps {
  name: SFSymbolName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
  scale?: SymbolScale;
  style?: StyleProp<ViewStyle>;
}

// Expo Go does not include the RNSfsymbols native component, so the
// react-native-sfsymbols module must never even be required there
// (requireNativeComponent would hit an unregistered native component).
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export function SFSymbolIcon({ name, size = 20, color = '#000', weight, scale, style }: SFSymbolIconProps) {
  if (Platform.OS === 'ios' && !IS_EXPO_GO) {
    // Lazy require: keeps requireNativeComponent('RNSfsymbols') out of the
    // module-evaluation path in Expo Go and Android entirely.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SFSymbol } = require('react-native-sfsymbols') as typeof import('react-native-sfsymbols');
    return <SFSymbol name={name} size={size} color={color} weight={weight} scale={scale} style={style} />;
  }
  return <Ionicons name={FALLBACK[name]} size={size} color={color} style={style} />;
}