/**
 * Favoritos: native grouped list, stops with their next departures and
 * lines with their badge. Swipe left on a row to delete. Empty state follows
 * ContentUnavailableView.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { removeFavorite } from '../favorites';
import { useI18n } from '../i18n';
import { C } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { LineBadge } from '../ui/LineBadge';
import { SwipeRow } from '../ui/SwipeRow';
import { StopSummary } from '../ui/StopSummary';
import { EmptyState } from '../ui/EmptyState';
import { useNow } from '../ui/useNow';
import { useFavorites } from '../ui/useFavorites';
import { useTabNav } from '../ui/nav';

export default function SavedScreen() {
  const { t } = useI18n();
  const now = useNow();
  const { openStop, openRoute } = useTabNav();
  const favs = useFavorites();
  const stops = favs.filter((f) => f.kind === 'stop');
  const routes = favs.filter((f) => f.kind === 'route');

  return (
    <ScrollView style={styles.root} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {stops.length + routes.length === 0 ? (
        <EmptyState
          icon="heart"
          title={t('saved_empty_title')}
          message={t('saved_empty_text')}
          actionLabel={t('explore_map')}
          onAction={() => router.navigate('/(tabs)/(map)')}
        />
      ) : null}

      {stops.length > 0 ? (
        <ListSection title={t('fav_stops')}>
          {stops.map((f) => (
            <SwipeRow key={f.id} onDelete={() => removeFavorite(f.id)} deleteLabel={t('delete')}>
              <ListRow
                title={f.label}
                subtitle={<StopSummary stopId={f.id} now={now} />}
                onPress={() => openStop(f.id)}
                chevron
                accessibilityLabel={f.label}
              />
            </SwipeRow>
          ))}
        </ListSection>
      ) : null}

      {routes.length > 0 ? (
        <ListSection title={t('fav_lines')} separatorInset={16 + 44}>
          {routes.map((f) => (
            <SwipeRow key={f.id} onDelete={() => removeFavorite(f.id)} deleteLabel={t('delete')}>
              <ListRow
                leading={<LineBadge name={f.label} />}
                title={f.sublabel ?? t('line_n', { n: f.label })}
                onPress={() => openRoute(f.id)}
                chevron
                accessibilityLabel={t('line_n', { n: f.label })}
              />
            </SwipeRow>
          ))}
        </ListSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
});
