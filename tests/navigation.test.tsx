import { render } from '@testing-library/react-native';
import StopDetailScreen from '../app/stops/[stopId]';
import RouteDetailScreen from '../app/routes/[routeId]';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: { push: jest.fn() },
}));

// Mock hooks (screens use useStop, useDepartures, useRoute, useRouteStops)
jest.mock('../src/hooks', () => ({
  useStop: jest.fn(() => ({ data: { stop_id: '1', stop_name: 'Test Stop', stop_lat: 43.32, stop_lon: -1.98 }, isLoading: false, isError: false })),
  useDepartures: jest.fn(() => ({ data: { stop_id: '1', at: '2026-08-19T15:40:00+02:00', limit: 20, departures: [] }, isLoading: false, isError: false, refetch: jest.fn() })),
  useRoute: jest.fn(() => ({ data: { route_id: '5', route_short_name: '5', route_long_name: 'Test Route', route_type: 3 }, isLoading: false, isError: false })),
  useRouteStops: jest.fn(() => ({ data: { route_id: '5', direction: null, stops: [] }, isLoading: false, isError: false, refetch: jest.fn() })),
  useRoutes: jest.fn(),
  useSearch: jest.fn(),
  useNearbyStops: jest.fn(),
  useRouteTrips: jest.fn(),
  useRouteShape: jest.fn(),
}));

const { useLocalSearchParams } = jest.requireMock('expo-router');

describe('Stop Detail route', () => {
  it('resolves and displays stopId', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ stopId: '123' });
    const { getByText } = render(<StopDetailScreen />);
    expect(getByText('Stop #123')).toBeTruthy();
  });

  it('shows scheduled-data disclaimer', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ stopId: '1' });
    const { getByText } = render(<StopDetailScreen />);
    expect(getByText(/Scheduled times only/i)).toBeTruthy();
  });
});

describe('Route Detail route', () => {
  it('resolves and displays routeId', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ routeId: '5' });
    const { getByText } = render(<RouteDetailScreen />);
    expect(getByText('5')).toBeTruthy();
  });
});