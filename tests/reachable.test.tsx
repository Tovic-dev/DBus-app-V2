/**
 * Planner destinations (V2): built from GET /stops/{id}/reachable, so they no
 * longer depend on the chosen time. Regression test for "no destinations
 * appear after picking an origin" (night time / infrequent lines).
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReachableStops, lineKey } from '../src/hooks';

jest.mock('../src/api/endpoints', () => ({
  ...jest.requireActual('../src/api/endpoints'),
  fetchReachable: jest.fn(async (stopId: string) => ({
    stop_id: stopId,
    route_ids: ['104', '28'],
    destinations: [
      { stop_id: '10', lines: [{ route_id: '104', direction_id: 0 }] },
      { stop_id: '20', lines: [{ route_id: '28', direction_id: 0 }, { route_id: '104', direction_id: 1 }] },
    ],
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useReachableStops', () => {
  it('returns every reachable destination and the lines that serve it', async () => {
    const { result } = renderHook(() => useReachableStops('1'), { wrapper });
    await waitFor(() => expect(result.current.stopIds).not.toBeNull());
    expect([...(result.current.stopIds as Set<string>)].sort()).toEqual(['10', '20']);
    expect(result.current.routeIds).toEqual(['104', '28']);
    const to20 = result.current.linesTo('20') as Set<string>;
    expect(to20.has(lineKey('28', 0))).toBe(true);
    expect(to20.has(lineKey('104', 1))).toBe(true);
    expect(to20.has(lineKey('104', 0))).toBe(false);
  });

  it('does not query and returns null without an origin', () => {
    const { result } = renderHook(() => useReachableStops(null), { wrapper });
    expect(result.current.stopIds).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.linesTo('10')).toBeNull();
  });
});
