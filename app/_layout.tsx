import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from '../src/i18n';
import { QueryProvider } from '../src/query/provider';
import { BRAND_TINT } from '../src/ui/TabStack';
import { C } from '../src/ui/theme';

/**
 * Root stack: the tab controller, plus Ajustes presented as a page sheet.
 * Detail screens live inside each tab's own stack (see src/ui/TabStack).
 */
export default function RootLayout() {
  return (
    <I18nProvider>
      <QueryProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{ presentation: 'modal', headerShown: true, headerTintColor: BRAND_TINT, headerShadowVisible: false, headerTransparent: true }}
          />
        </Stack>
      </QueryProvider>
    </I18nProvider>
  );
}
