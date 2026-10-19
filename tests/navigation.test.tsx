import { render, fireEvent } from '@testing-library/react-native';
import StopDetailScreen from '../src/screens/StopDetail';
import RouteDetailScreen from '../src/screens/RouteDetail';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
  router: { push: jest.fn() },
  useSegments: () => ['(tabs)', '(saved)'],
}));

const mockSoon = new Date(Date.now() + 5 * 60_000 + 10_000).toISOString();
jest.mock('../src/hooks', () => ({
  useStop: jest.fn(() => ({ data: { stop_id: '123', stop_name: 'Boulevard 9', stop_lat: 43.32, stop_lon: -1.98 }, isLoading: false, isError: false, refetch: jest.fn() })),
  useDepartures: jest.fn(() => ({
    data: {
      stop_id: '123', at: '', limit: 40,
      departures: [{ stop_id: '123', stop_name: 'Boulevard 9', route_id: 'R28', route_short_name: '28', trip_id: 't1', headsign: 'Amara', direction_id: 0, stop_sequence: 3, scheduled_departure: mockSoon, service_date: '', realtime_status: 'unavailable' }],
    },
    isLoading: false, isError: false, refetch: jest.fn(),
  })),
  useRoute: jest.fn(() => ({ data: { route_id: 'R5', route_short_name: '5', route_long_name: 'Benta Berri - Intxaurrondo', route_type: 3 }, isLoading: false, isError: false })),
  useRouteStops: jest.fn(() => ({
    data: {
      route_id: 'R5', direction: null,
      stops: [
        { stop_id: 'a', stop_name: 'Benta Berri', stop_lat: 0, stop_lon: 0, trip_id: 'x', direction_id: 0, headsign: 'Intxaurrondo', stop_sequence: 1 },
        { stop_id: 'b', stop_name: 'Intxaurrondo', stop_lat: 0, stop_lon: 0, trip_id: 'x', direction_id: 0, headsign: 'Intxaurrondo', stop_sequence: 2 },
        { stop_id: 'b', stop_name: 'Intxaurrondo', stop_lat: 0, stop_lon: 0, trip_id: 'y', direction_id: 1, headsign: 'Benta Berri', stop_sequence: 1 },
        { stop_id: 'a', stop_name: 'Benta Berri', stop_lat: 0, stop_lon: 0, trip_id: 'y', direction_id: 1, headsign: 'Benta Berri', stop_sequence: 2 },
      ],
    },
    isLoading: false, isError: false, refetch: jest.fn(),
  })),
}));

const { useLocalSearchParams, router } = jest.requireMock('expo-router');

describe('Stop detail', () => {
  beforeEach(() => (useLocalSearchParams as jest.Mock).mockReturnValue({ stopId: '123' }));

  it('shows the stop name, its number and one scheduled-times note', () => {
    const { getByText, getAllByText } = render(<StopDetailScreen />);
    expect(getByText('Boulevard 9')).toBeTruthy();
    expect(getByText('Parada 123')).toBeTruthy();
    expect(getAllByText(/Horarios programados/)).toHaveLength(1);
  });

  it('lists departures with headsign and minutes, and opens the line in the same tab', () => {
    const { getByText, getAllByLabelText } = render(<StopDetailScreen />);
    expect(getByText('Hacia Amara')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    fireEvent.press(getAllByLabelText('Línea 28')[0]);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/(saved)/route/R28');
  });
});

describe('Line detail', () => {
  beforeEach(() => (useLocalSearchParams as jest.Mock).mockReturnValue({ routeId: 'R5' }));

  it('shows the line name and a direction control', () => {
    const { getByText, getAllByText } = render(<RouteDetailScreen />);
    expect(getByText('Benta Berri - Intxaurrondo')).toBeTruthy();
    expect(getAllByText('Intxaurrondo').length).toBeGreaterThan(0);
    expect(getByText('Paradas · 2')).toBeTruthy();
  });

  it('switches direction with the segmented control', () => {
    const { getAllByText, getAllByLabelText } = render(<RouteDetailScreen />);
    const order = () => getAllByLabelText(/^(Benta Berri|Intxaurrondo)$/).map((n) => n.props.accessibilityLabel);
    expect(order()).toEqual(['Benta Berri', 'Intxaurrondo']);
    // Segments are labelled with each direction's headsign.
    fireEvent.press(getAllByText('Benta Berri').find((n) => n.props.accessibilityLabel === undefined)!);
    expect(order()).toEqual(['Intxaurrondo', 'Benta Berri']);
    fireEvent.press(getAllByLabelText('Intxaurrondo')[0]);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/(saved)/stop/b');
  });
});
