import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: { push: jest.fn(), navigate: jest.fn() },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 43.32, longitude: -1.98 } })),
  Accuracy: { Balanced: 3 },
}));

jest.mock('../src/hooks', () => {
  const idle = { data: undefined, isLoading: false, isError: false, refetch: jest.fn() };
  return {
    useNearbyStops: jest.fn(() => idle),
    useDepartures: jest.fn(() => idle),
  };
});

describe('HomeScreen (smoke test)', () => {
  it('renders the home headline', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('¿Dónde quieres ir?')).toBeTruthy();
  });

  it('shows scheduled-data legal line', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Horarios programados de DBus Donostia')).toBeTruthy();
  });

  it('does NOT request location more than once on initial render', () => {
    const Location = jest.requireMock('expo-location');
    const before = Location.requestForegroundPermissionsAsync.mock.calls.length;
    render(<HomeScreen />);
    expect(Location.requestForegroundPermissionsAsync.mock.calls.length - before).toBe(1);
  });
});