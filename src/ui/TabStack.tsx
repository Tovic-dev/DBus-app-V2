/**
 * Per-tab navigation stack: native UINavigationController with a large
 * title on the tab root, minimal back chevrons, transparent bar over the
 * grouped background (iOS 26 scroll-edge effect) and the shared detail routes.
 */
import type { ReactNode } from 'react';
import { Stack } from 'expo-router';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { C } from './theme';

const LIQUID = (() => {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

export const BRAND_TINT = '#70AF00';

export function TabStack({ title, rootHeaderShown = true, children }: { title: string; rootHeaderShown?: boolean; children?: ReactNode }) {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: BRAND_TINT,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerTransparent: true,
        headerBlurEffect: LIQUID ? undefined : 'systemChromeMaterial',
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title, headerLargeTitle: true, headerShown: rootHeaderShown }} />
      <Stack.Screen name="stop/[stopId]" options={{ title: '' }} />
      <Stack.Screen name="route/[routeId]" options={{ title: '' }} />
      {children}
    </Stack>
  );
}
