/**
 * Ajustes (modal sheet opened from the gear in Inicio). Only real settings:
 * language and honest information about the data. No fake account.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import Constants from 'expo-constants';
import { LANGS, useI18n } from '../i18n';
import { C } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { HeaderButton } from '../ui/HeaderButton';

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const version = Constants.expoConfig?.version ?? '2.0.0';
  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings'),
          headerRight: () => <HeaderButton label={t('done')} bold accessibilityLabel={t('done')} onPress={() => router.back()} />,
        }}
      />
      <ScrollView style={styles.root} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ListSection title={t('language')}>
          {LANGS.map((l) => (
            <ListRow key={l.code} title={l.name} checked={lang === l.code} onPress={() => setLang(l.code)} accessibilityLabel={l.name} />
          ))}
        </ListSection>
        <ListSection title={t('about')} footer={t('about_footer')}>
          <ListRow title={t('version')} value={version} />
          <ListRow title={t('data_source')} subtitle={t('data_source_value')} />
          <ListRow title={t('realtime')} value={t('realtime_value')} />
        </ListSection>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
});
