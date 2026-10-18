module.exports = {
  preset: 'jest-expo',
  // AsyncStorage ships a native module that is unavailable under jest;
  // map it to the official mock (the lib's documented jest setup).
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  setupFiles: ['./jest.setup.js'],
};