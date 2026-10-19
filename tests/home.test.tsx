import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/Home';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
  useSegments: () => ['(tabs)', '(home)'],
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: jest.fn(() => Promise.resolve()) }),
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
const idle = { data: undefined, isLoading: false, isError: false, refetch: jest.fn() };

describe('Inicio · Cerca de ti', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNearbyStops.mockReturnValue(idle);
    mockUseDepartures.mockReturnValue(idle);
  });

  it('asks for the location exactly once on mount and shows the locating row', () => {
    mockGetCurrentLocation.mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<HomeScreen />);
    expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
    expect(getByText('Buscando paradas cercanas…')).toBeTruthy();
  });

  it('never queries nearby stops with fake 0,0 coordinates before a fix', () => {
    mockGetCurrentLocation.mockReturnValue(new Promise(() => {}));
    render(<HomeScreen />);
    expect(mockUseNearbyStops).toHaveBeenCalledWith(undefined, undefined, 1000, 3);
  });

  it('explains a denied permission and offers Ajustes', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'denied' });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText('Permite el acceso a tu ubicación para ver las paradas cercanas.')).toBeTruthy());
    expect(getByText('Abrir Ajustes')).toBeTruthy();
  });

  it('lets the user retry after a location error', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'error', message: 'timeout' });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText('No se ha podido obtener tu ubicación.')).toBeTruthy());
    fireEvent.press(getByText('Reintentar'));
    await waitFor(() => expect(mockGetCurrentLocation).toHaveBeenCalledTimes(2));
  });

  it('lists the nearest stops with distance and opens them inside the Inicio tab', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'granted', latitude: 43.32, longitude: -1.98 });
    mockUseNearbyStops.mockReturnValue({
      ...idle,
      data: [
        { stop_id: '42', stop_name: 'Boulevard 9', stop_lat: 43.32, stop_lon: -1.98, distance_m: 120 },
        { stop_id: '7', stop_name: 'Plaza Easo', stop_lat: 43.32, stop_lon: -1.97, distance_m: 350 },
      ],
    });
    const { getByText, getByLabelText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText('Boulevard 9')).toBeTruthy());
    expect(getByText('120 m')).toBeTruthy();
    expect(getByText('Plaza Easo')).toBeTruthy();
    fireEvent.press(getByLabelText('Boulevard 9, 120 m'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/(home)/stop/42');
  });

  it('says so when there are no stops nearby', async () => {
    mockGetCurrentLocation.mockResolvedValue({ status: 'granted', latitude: 43.32, longitude: -1.98 });
    mockUseNearbyStops.mockReturnValue({ ...idle, data: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText('No hay paradas a menos de 1 km.')).toBeTruthy());
  });

  it('has no greeting and no fake user name', async () => {
    mockGetCurrentLocation.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText(/Mikel/)).toBeNull();
    expect(queryByText(/Buenas/)).toBeNull();
  });
});
