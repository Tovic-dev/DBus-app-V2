/**
 * Floating tab bar — Apple Maps / Find My style.
 *
 * - Squircle capsule geometry (continuous-corner, radius = squircleLarge 28).
 * - Native material via GlassSurface variant="floating" (expo-blur BlurView,
 *   systemChromeMaterial). BlurView was verified Expo-Go-compatible in M-1/M-2
 *   (GlassSurface/GlassButton already ship it), so the earlier "BlurView
 *   removed" workaround is reverted here. On Android (blurMethod 'none') the
 *   GlassSurface translucent fallback is used instead of a native blur.
 * - Active pill animated with RN core Animated spring (interruptible).
 * - Position from safe-area insets (no fixed numbers).
 */
import React from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../design/haptics';
import { SPRING } from '../design/motion';
import { colors } from '../design/tokens';
import { geometry } from '../design/squircle/squircleTokens';
import { GlassSurface } from '../design/surfaces';
import { Squircle } from '../design/squircle/Squircle';
import { surfaceLift } from './surfaceBus';
import { isTabBarHidden, subscribeTabBarVisibility } from './tabBarVisibility';
import { SFSymbolIcon, type SFSymbolName } from './SFSymbolIcon';
import type { I18n } from '../i18n';

type TabLabelKey = 'tab_home' | 'tab_map' | 'tab_plan' | 'tab_favorites' | 'tab_profile';

const TABS: { route: string; labelKey: TabLabelKey; icon: SFSymbolName; iconActive: SFSymbolName }[] = [
  { route: 'index', labelKey: 'tab_home', icon: 'house', iconActive: 'house.fill' },
  { route: 'map', labelKey: 'tab_map', icon: 'map', iconActive: 'map.fill' },
  { route: 'plan', labelKey: 'tab_plan', icon: 'arrow.triangle.branch', iconActive: 'arrow.triangle.branch' },
  { route: 'saved', labelKey: 'tab_favorites', icon: 'heart', iconActive: 'heart.fill' },
  { route: 'profile', labelKey: 'tab_profile', icon: 'person.crop.circle', iconActive: 'person.crop.circle.fill' },
];

export function FloatingTabBar({ state, navigation, t }: {
  state: { index: number; routes: { name: string; key?: string }[] };
  navigation: { navigate: (name: string) => void };
  t: I18n['t'];
}) {
  const insets = useSafeAreaInsets();
  const surfaceY = React.useRef(new Animated.Value(0)).current;
  const surfaceScale = React.useRef(new Animated.Value(1)).current;

  // Apple Maps place-card behaviour: hide the whole bar while the map sheet
  // is open (the sheet extends to the bottom edge over this zone).
  const [hidden, setHidden] = React.useState(isTabBarHidden());
  React.useEffect(() => subscribeTabBarVisibility(setHidden), []);

  // Subscribe to surfaceLift for sheet-rise compression
  React.useEffect(() => {
    const id = surfaceLift.addListener(({ value }) => {
      Animated.spring(surfaceY, { toValue: value * 4, ...SPRING, useNativeDriver: true }).start();
      Animated.spring(surfaceScale, { toValue: 1 - value * 0.03, ...SPRING, useNativeDriver: true }).start();
    });
    return () => surfaceLift.removeListener(id);
  }, [surfaceY, surfaceScale]);

  if (hidden) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          left: geometry.tabBarInset,
          right: geometry.tabBarInset,
          bottom: Math.max(insets.bottom, 10) + geometry.tabBarBottomSpacing,
          transform: [{ translateY: surfaceY }, { scale: surfaceScale }],
        },
      ]}
      pointerEvents="box-none"
    >
      <GlassSurface variant="floating" safeAreaTop={false} style={styles.bar}>
        <View style={styles.row} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const tab = TABS[index];
            if (!tab) return null;
            const focused = state.index === index;
            const onPress = () => {
              haptics.selection();
              navigation.navigate(route.name);
            };
            return (
              <TabItem
                key={`${route.name}-${index}`}
                tab={tab}
                focused={focused}
                index={index}
                onPress={onPress}
                label={t(tab.labelKey)}
              />
            );
          })}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

function TabItem({ tab, focused, index, onPress, label }: {
  tab: { route: string; icon: SFSymbolName; iconActive: SFSymbolName };
  focused: boolean;
  index: number;
  onPress: () => void;
  label: string;
}) {
  const pillOpacity = React.useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillScale = React.useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const iconScale = React.useRef(new Animated.Value(focused ? 1 : 0.96)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(pillOpacity, { toValue: focused ? 1 : 0, ...SPRING, useNativeDriver: true }),
      Animated.spring(pillScale, { toValue: focused ? 1 : 0.6, ...SPRING, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: focused ? 1 : 0.96, ...SPRING, useNativeDriver: true }),
    ]).start();
  }, [focused, pillOpacity, pillScale, iconScale]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <View style={styles.iconWrap} pointerEvents="none">
        <Animated.View style={[styles.pill, { opacity: pillOpacity, transform: [{ scale: pillScale }] }]}>
          <Squircle level="medium" backgroundColor={colors.primary} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.iconInner, { transform: [{ scale: iconScale }] }]}>
            <SFSymbolIcon name={focused ? tab.iconActive : tab.icon} size={24} color={focused ? '#fff' : colors.muted48} />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  // Height + capsule radius only; material + product shadow come from
  // GlassSurface (variant="floating"), so the duplicated local softShadow is gone.
  bar: { height: geometry.tabBarHeight, borderRadius: geometry.squircleLarge },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: geometry.tabBarHeight - 12 },
  iconWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  pill: { height: 40, width: '86%' },
  iconInner: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
});