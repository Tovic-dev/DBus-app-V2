import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider, useI18n } from '../src/i18n';
import { QueryProvider } from '../src/query/provider';
import { colors } from '../src/design/tokens';

/**
 * V2 · Native UINavigationController headers: system back chevron (no
 * text, iOS 26 style), brand tint and translated titles. Colours and the
 * header material follow the system light/dark appearance automatically.
 */
function RootStack() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="stops/[stopId]" options={{ title: t('nav_stop') }} />
      <Stack.Screen name="routes/[routeId]" options={{ title: t('nav_route') }} />
      <Stack.Screen name="live/[routeId]" options={{ title: t('nav_live') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <QueryProvider>
        <StatusBar style="auto" />
        <RootStack />
      </QueryProvider>
    </I18nProvider>
  );
}
