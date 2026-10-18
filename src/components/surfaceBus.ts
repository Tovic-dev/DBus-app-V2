/**
 * Surface bus — module-level animated value that connects the
 * UnifiedSurface (map sheet) with the FloatingTabBar rendered by the tabs
 * layout. React context can't reach across the Expo Router layout boundary,
 * so a singleton mutable value is the cleanest bridge.
 *
 * surfaceLift: 0 = sheet closed (tab bar at rest) … 1 = sheet raised
 * (tab bar gently compresses, Apple Maps behaviour — navigation stays visible).
 *
 * Migrated from Reanimated makeMutable → RN core Animated.Value (Expo Go SDK 57 compat).
 */
import { Animated } from 'react-native';

export const surfaceLift = new Animated.Value(0);
