/**
 * Native iOS tab bar (UITabBarController, Liquid Glass on iOS 26) with one
 * navigation stack per tab and the system search tab on the trailing edge.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useI18n } from '../../src/i18n';
import { BRAND_TINT } from '../../src/ui/TabStack';

/** "/" (cold start, deep links) must land on Inicio, not on another tab's index. */
export const unstable_settings = { initialRouteName: '(home)' };

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <NativeTabs tintColor={BRAND_TINT} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_map')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(trip)">
        <NativeTabs.Trigger.Icon sf={{ default: 'arrow.triangle.turn.up.right.diamond', selected: 'arrow.triangle.turn.up.right.diamond.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_trip')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(saved)">
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>{t('tab_saved')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>{t('tab_search')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
