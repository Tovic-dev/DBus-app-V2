/**
 * Buscar (the iOS 26 search tab). Empty query: every line, sorted by number,
 * to browse. With a query: matching lines and matching stops (server search).
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useRoutes, useSearch } from '../hooks';
import { routeColor } from '../design/routeColors';
import { useI18n } from '../i18n';
import { C } from '../ui/theme';
import { ListRow, ListSection } from '../ui/List';
import { LineBadge } from '../ui/LineBadge';
import { LoadingRow, MessageRow } from '../ui/StatusRow';
import { EmptyState } from '../ui/EmptyState';
import { useTabNav } from '../ui/nav';
import type { Route } from '../api/types';

const byNumber = (a: Route, b: Route) => a.route_short_name.localeCompare(b.route_short_name, 'es', { numeric: true });

export default function SearchScreen() {
  const { t } = useI18n();
  const { openStop, openRoute } = useTabNav();
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim());

  const routesQ = useRoutes();
  const stopsQ = useSearch(q, 30);
  const routes = useMemo(() => [...(routesQ.data?.routes ?? [])].sort(byNumber), [routesQ.data]);
  const lineMatches = useMemo(() => {
    if (!q) return routes;
    const n = q.toLowerCase();
    return routes.filter((r) => r.route_short_name.toLowerCase().startsWith(n) || (r.route_long_name ?? '').toLowerCase().includes(n));
  }, [routes, q]);
  const stops = q ? stopsQ.data?.results ?? [] : [];

  const lineRows = lineMatches.map((r) => (
    <ListRow
      key={r.route_id}
      leading={<LineBadge name={r.route_short_name} color={routeColor(r.route_short_name)} />}
      title={r.route_long_name ?? t('line_n', { n: r.route_short_name })}
      onPress={() => openRoute(r.route_id)}
      chevron
      accessibilityLabel={`${t('line_n', { n: r.route_short_name })}, ${r.route_long_name ?? ''}`}
    />
  ));

  const nothing = Boolean(q) && !stopsQ.isLoading && stops.length === 0 && lineMatches.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('search_placeholder'),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
            autoCapitalize: 'none',
            hideWhenScrolling: false,
          },
        }}
      />
      <ScrollView style={styles.root} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {nothing ? (
          <EmptyState icon="magnifyingglass" title={t('search_no_results')} message={t('search_no_results_text')} />
        ) : !q ? (
          <ListSection title={t('all_lines')} separatorInset={16 + 44}>
            {routesQ.isLoading ? <LoadingRow label={t('loading')} /> : routesQ.isError ? (
              <MessageRow icon="exclamationmark.triangle" label={t('stops_error')} actionLabel={t('retry')} onAction={() => routesQ.refetch()} />
            ) : lineRows}
          </ListSection>
        ) : (
          <>
            {lineMatches.length > 0 ? (
              <ListSection title={t('lines')} separatorInset={16 + 44}>{lineRows}</ListSection>
            ) : null}
            {stopsQ.isLoading || stops.length > 0 ? (
              <ListSection title={t('stops')}>
                {stopsQ.isLoading ? (
                  <LoadingRow label={t('searching')} />
                ) : (
                  stops.map((s) => (
                    <ListRow key={s.stop_id} title={s.stop_name} subtitle={t('stop_number', { id: s.stop_id })} onPress={() => openStop(s.stop_id)} chevron />
                  ))
                )}
              </ListSection>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
});
