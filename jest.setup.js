// Deterministic safe-area insets for every test (react-native-safe-area-context
// throws outside a provider; components call useSafeAreaInsets at top level).
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const insets = { top: 47, bottom: 34, left: 0, right: 0 };
  return {
    ...actual,
    useSafeAreaInsets: () => insets,
    SafeAreaProvider: actual.SafeAreaProvider,
  };
});

// HomeScreen and detail screens call useI18n directly; wrap render() so every
// test gets a provider (the app itself mounts it in app/_layout.tsx).
// jest.mock registers lazily: requireActual runs on first import from a test
// file, after jest globals already exist.
jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');
  const ReactLocal = require('react');
  const { I18nProvider } = require('./src/i18n');
  return {
    ...actual,
    render: (ui, ...rest) =>
      actual.render(ReactLocal.createElement(I18nProvider, null, ui), ...rest),
  };
});

// Native-only UI modules used by the redesigned screens.
jest.mock(
  '@expo/ui/community/segmented-control',
  () => {
    const ReactLocal = require('react');
    const { Text, View } = require('react-native');
    return {
      SegmentedControl: ({ values = [], onChange }) =>
        ReactLocal.createElement(
          View,
          { accessibilityRole: 'tablist' },
          values.map((v, i) =>
            ReactLocal.createElement(
              Text,
              { key: v, onPress: () => onChange && onChange({ nativeEvent: { selectedSegmentIndex: i, value: v } }) },
              v,
            ),
          ),
        ),
    };
  },
  { virtual: true },
);
jest.mock('expo-glass-effect', () => {
  const { View } = require('react-native');
  return { GlassView: View, isLiquidGlassAvailable: () => false };
});
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('react-native-maps', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  const MapView = ReactLocal.forwardRef((props, _ref) => ReactLocal.createElement(View, props));
  const Marker = (props) => ReactLocal.createElement(View, props);
  return { __esModule: true, default: MapView, Marker };
});
