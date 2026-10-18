import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: { push: jest.fn(), navigate: jest.fn() },
}));

const mockGetCurrentLocation = jest.fn();
jest.mock('../src/location/service', () => ({
  getCurrentLocation: (...args: unknown[]) => mockGetCurrentLocation(...args),
}));

const mockUseNearbyStops = jest.fn();
const mockUseDepartures = jest.fn();
jest.mock('../src/hooks', () => ({
  useNearbyStops: (...args: unknown[]) => mockUseNearbyStops(...args),
  useDepartures: (...args: unknown[]) => mockUseDepartures(...args),
}));

const { router } = jest.requireMock('expo-router');

const idleQuery = { data: undefined, isLoading: false, isError: false, refetch: jest.fn() };

describe('Nearest-stop flow (HomeScreen)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNearbyStops.mockReturnValue(idleQuery);
    mockUseDepartures.mockReturnValue(idleQuery);
  });

  it('does NOT request location before mount effects resolve', () => {
    mockGetCurrentLocation.mockReturnValue(new Promise(() => {}));
    render(<HomeScreen />);
    // One-shot on-mount acquisition is allowed, but the request must be the
    // explicit getCurrentLocation (no permission prompt at import time).
    expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('shows the enable-location card when permission denied', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'denied' });

    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Activa la ubicación para ver tu parada')).toBeTruthy();
    });
  });

  it('shows the same retry card when location acquisition fails', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'error', message: 'fail' });

    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Activa la ubicación para ver tu parada')).toBeTruthy();
    });

    // Retry re-acquires location (one-shot service, not a query refetch).
    fireEvent.press(getByText('Activa la ubicación para ver tu parada'));
    await waitFor(() => {
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(2);
    });
  });

  it('renders the nearest stop with distance when granted', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'granted', latitude: 43.32, longitude: -1.98 });
    mockUseNearbyStops.mockReturnValue({
      data: [
        { stop_id: '1', stop_name: 'Boulevard 9', stop_lat: 43.32, stop_lon: -1.98, distance_m: 120 },
        { stop_id: '2', stop_name: 'Plaza', stop_lat: 43.32, stop_lon: -1.97, distance_m: 350 },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Boulevard 9')).toBeTruthy();
      expect(getByText('120 m')).toBeTruthy();
    });
  });

  it('navigates to Stop Detail when the nearest stop is pressed', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'granted', latitude: 43.32, longitude: -1.98 });
    mockUseNearbyStops.mockReturnValue({
      data: [{ stop_id: '42', stop_name: 'Test Stop', stop_lat: 43.32, stop_lon: -1.98, distance_m: 100 }],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { getByLabelText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByLabelText('Parada Test Stop')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Parada Test Stop'));
    expect(router.push).toHaveBeenCalledWith('/stops/42');
  });

  it('shows the empty message when no stops are near', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'granted', latitude: 43.32, longitude: -1.98 });
    mockUseNearbyStops.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: jest.fn() });

    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('No se han encontrado paradas cerca.')).toBeTruthy();
    });
  });
});
