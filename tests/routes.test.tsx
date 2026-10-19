import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

jest.mock('../src/location/service', () => ({ getCurrentLocation: () => new Promise(() => {}) }));
jest.mock('../src/hooks', () => {
  const idle = { data: undefined, isLoading: true, isError: false, refetch: jest.fn() };
  return {
    useNearbyStops: () => idle, useDepartures: () => idle, useStop: () => idle, useRoute: () => idle,
    useRouteStops: () => idle, useRoutes: () => idle, useSearch: () => idle, useStops: () => idle,
    useReachableStops: () => ({ stopIds: null, isLoading: false, linesTo: () => null }), lineKey: () => '',
  };
});

// Order matters: the router keeps global state between renders in one file.
it('opens Inicio by default and pushes detail, line, picker and settings routes', () => {
  const r = renderRouter('./app', { initialUrl: '/' });
  expect(r.getSegments()).toEqual(['(tabs)', '(home)']);
  act(() => router.push('/(tabs)/(home)/route/R5'));
  expect(r.getSegments()).toEqual(['(tabs)', '(home)', 'route', '[routeId]']);
  act(() => router.push('/(tabs)/(trip)/pick'));
  expect(r.getSegments()).toEqual(['(tabs)', '(trip)', 'pick']);
  act(() => router.push('/(tabs)/(map)/stop-sheet'));
  expect(r.getSegments()).toEqual(['(tabs)', '(map)', 'stop-sheet']);
  act(() => router.push('/settings'));
  expect(r.getSegments()).toEqual(['settings']);
});

it('resolves the shared stop route inside the tab that opened it', () => {
  const r = renderRouter('./app', { initialUrl: '/(tabs)/(saved)/stop/42' });
  expect(r.getPathname()).toBe('/stop/42');
  expect(r.getSegments()).toEqual(['(tabs)', '(saved)', 'stop', '[stopId]']);
});
