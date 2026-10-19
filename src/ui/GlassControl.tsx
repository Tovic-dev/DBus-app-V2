/**
 * Floating map control on Liquid Glass (iOS 26+), with a system-material
 * blur fallback on older systems. Used for the map's location button and
 * the zoom hint capsule.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

const LIQUID = (() => {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

export function GlassControl({ children, style, interactive = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; interactive?: boolean }) {
  if (LIQUID) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} style={[styles.base, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[styles.base, styles.fallbackShadow, style]}>
      <BlurView tint="systemChromeMaterial" intensity={100} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallbackShadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
});
