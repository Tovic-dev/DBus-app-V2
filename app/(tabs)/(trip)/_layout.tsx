import { Stack } from 'expo-router';
import { TabStack } from '../../../src/ui/TabStack';
import { useI18n } from '../../../src/i18n';

export default function TripLayout() {
  const { t } = useI18n();
  return (
    <TabStack title={t('trip_title')}>
      <Stack.Screen name="pick" options={{ presentation: 'modal', headerTransparent: false, headerLargeTitle: false }} />
    </TabStack>
  );
}
