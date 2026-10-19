import { Stack } from 'expo-router';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { TabStack } from '../../../src/ui/TabStack';
import { C } from '../../../src/ui/theme';
import { useI18n } from '../../../src/i18n';

const LIQUID = (() => {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

export default function MapLayout() {
  const { t } = useI18n();
  return (
    <TabStack title={t('tab_map')} rootHeaderShown={false}>
      <Stack.Screen
        name="stop-sheet"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.45, 1],
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetGrabberVisible: true,
          // Transparent content lets iOS 26 draw the sheet's Liquid Glass.
          contentStyle: { backgroundColor: LIQUID ? 'transparent' : C.plain },
        }}
      />
    </TabStack>
  );
}
