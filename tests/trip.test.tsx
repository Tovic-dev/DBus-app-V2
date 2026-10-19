import { render } from '@testing-library/react-native';
import StopPickerScreen from '../src/screens/StopPicker';
import { tripStore } from '../src/ui/tripStore';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), back: jest.fn() },
  useSegments: () => ['(tabs)', '(trip)'],
}));

const stops = [
  { stop_id: '1', stop_name: 'Amara', stop_lat: 0, stop_lon: 0 },
  { stop_id: '2', stop_name: 'Boulevard', stop_lat: 0, stop_lon: 0 },
  { stop_id: '3', stop_name: 'Gros', stop_lat: 0, stop_lon: 0 },
];
const mockReachable = jest.fn();
jest.mock('../src/hooks', () => ({
  useStops: () => ({ data: { stops }, isLoading: false, isError: false, refetch: jest.fn() }),
  useReachableStops: (id: string | null) => mockReachable(id),
}));

describe('Viaje · stop picker', () => {
  beforeEach(() => {
    mockReachable.mockImplementation((id: string | null) => ({
      stopIds: id ? new Set(['3']) : null,
      isLoading: false,
      linesTo: () => null,
    }));
  });

  it('lists EVERY stop when choosing the origin, even with an origin already set', () => {
    tripStore.set({ from: stops[0], to: null, picking: 'from' });
    const { getByText } = render(<StopPickerScreen />);
    expect(getByText('Amara')).toBeTruthy();
    expect(getByText('Boulevard')).toBeTruthy();
    expect(getByText('Gros')).toBeTruthy();
    expect(mockReachable).toHaveBeenLastCalledWith(null);
  });

  it('lists only stops reachable without a transfer when choosing the destination', () => {
    tripStore.set({ from: stops[0], to: null, picking: 'to' });
    const { getByText, queryByText } = render(<StopPickerScreen />);
    expect(getByText('Gros')).toBeTruthy();
    expect(queryByText('Boulevard')).toBeNull();
    expect(getByText('1 paradas con bus directo')).toBeTruthy();
  });
});
