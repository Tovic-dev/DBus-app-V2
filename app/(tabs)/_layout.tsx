/**
 * Tab layout — native iOS tab bar (UITabBarController).
 *
 * V2: replaces the hand-built FloatingTabBar with Expo Router's native tabs.
 * On iOS 26 the system draws this bar with real Liquid Glass, SF Symbols,
 * native selection animation and the minimise-on-scroll behaviour.
 * Requires a standalone/development build (not Expo Go).
 */
import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '../../src/design/tokens';
import { useI18n } from '../../src/i18n';
import { isTabBarHidden, subscribeTabBarVisibility } from '../../src/components/tabBarVisibility';

export default function TabLayout() {
  const { t } = useI18n();

  // The map place sheet extends to the bottom edge, so the bar hides while it
  // is open (Apple Maps behaviour). Same pub/sub as the V1 floating bar.
  const [hidden, setHidden] = React.useState(isTabBarHidden());
  React.useEffect(() => subscribeTabBarVisibility(setHidden), []);

  return (
    <NativeTabs tintColor={colors.primary} minimizeBehavior="onScrollDown" hidden={hidden}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_map')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Icon sf="arrow.triangle.branch" />
        <NativeTabs.Trigger.Label>{t('tab_plan')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_favorites')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
