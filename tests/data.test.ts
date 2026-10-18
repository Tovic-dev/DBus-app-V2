import { queryKeys } from '../src/query/keys';
import { queryClient } from '../src/query/client';
import { QueryProvider } from '../src/query/provider';
import { renderHook } from '@testing-library/react-native';
import React from 'react';

// ---- Query key tests ----

describe('queryKeys', () => {
  it('produces deterministic keys for same params', () => {
    expect(queryKeys.stop('1')).toEqual(queryKeys.stop('1'));
    expect(queryKeys.departures('1', '2026-08-13T15:40:00+02:00')).toEqual(
      queryKeys.departures('1', '2026-08-13T15:40:00+02:00'),
    );
  });

  it('produces different keys for different params', () => {
    expect(queryKeys.stop('1')).not.toEqual(queryKeys.stop('2'));
    expect(queryKeys.departures('1', '2026-08-13T15:40:00+02:00')).not.toEqual(
      queryKeys.departures('1', '2026-08-14T15:40:00+02:00'),
    );
  });

  it('includes relevant parameters in keys', () => {
    const key = queryKeys.nearbyStops(43.32, -1.98, 500, 20);
    expect(key).toContain(43.32);
    expect(key).toContain(-1.98);
    expect(key).toContain(500);
    expect(key).toContain(20);
  });

  it('includes direction in routeStops key', () => {
    expect(queryKeys.routeStops('5', 0)).not.toEqual(queryKeys.routeStops('5', 1));
  });

  it('includes tripId in routeShape key', () => {
    expect(queryKeys.routeShape('5', 'trip1')).not.toEqual(queryKeys.routeShape('5', 'trip2'));
  });
});

// ---- QueryClient / Provider tests ----

describe('QueryClient', () => {
  it('is a single instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryData).toBe('function');
  });

  it('has sensible default staleTime', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(60_000);
  });
});

describe('QueryProvider', () => {
  it('renders children without error', () => {
    const { result } = renderHook(
      () => 'test-child',
      {
        wrapper: ({ children }) => React.createElement(QueryProvider, null, children),
      },
    );
    expect(result.current).toBe('test-child');
  });
});

// ---- Hook tests (representative) ----

// Mock the endpoints module for hook tests
jest.mock('../src/api/endpoints', () => ({
  fetchStops: jest.fn(),
  fetchStop: jest.fn(),
  fetchNearbyStops: jest.fn(),
  fetchDepartures: jest.fn(),
  fetchRoutes: jest.fn(),
  fetchRoute: jest.fn(),
  fetchRouteStops: jest.fn(),
  fetchRouteTrips: jest.fn(),
  fetchRouteShape: jest.fn(),
  fetchSearch: jest.fn(),
}));

// Mock config to avoid network calls
jest.mock('../src/api/config', () => ({
  API_BASE_URL: 'https://test.example.com/api/v1',
  API_TIMEOUT_MS: 10000,
}));

const { fetchRoutes } = jest.requireMock('../src/api/endpoints') as {
  fetchRoutes: jest.Mock;
};

describe('useRoutes hook (representative)', () => {
  it('returns data on success', async () => {
    const { useRoutes } = require('../src/hooks');
    fetchRoutes.mockResolvedValue({ routes: [{ route_id: '5', route_short_name: '5', route_long_name: null, route_type: 3 }] });

    const { result } = renderHook(() => useRoutes(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryProvider, null, children),
    });

    // Wait for the query to resolve
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.routes).toHaveLength(1);
  });
});