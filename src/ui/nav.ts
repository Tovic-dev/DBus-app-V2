/**
 * Detail screens are pushed inside the CURRENT tab's stack, so the tab bar
 * stays visible and each tab keeps its own history (Apple Maps / Music).
 */
import { router, useSegments } from 'expo-router';

export type TabGroup = '(home)' | '(map)' | '(trip)' | '(saved)' | '(search)';
const GROUPS: TabGroup[] = ['(home)', '(map)', '(trip)', '(saved)', '(search)'];

export function useTabGroup(): TabGroup {
  const segments = useSegments() as string[];
  return (segments.find((s) => (GROUPS as string[]).includes(s)) as TabGroup | undefined) ?? '(home)';
}

export function useTabNav() {
  const group = useTabGroup();
  return {
    group,
    openStop: (stopId: string) => router.push(`/(tabs)/${group}/stop/${encodeURIComponent(stopId)}`),
    openRoute: (routeId: string) => router.push(`/(tabs)/${group}/route/${encodeURIComponent(routeId)}`),
  };
}
