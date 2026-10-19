import { TabStack } from '../../../src/ui/TabStack';
import { useI18n } from '../../../src/i18n';

export default function SavedLayout() {
  const { t } = useI18n();
  return <TabStack title={t('tab_saved')} />;
}
