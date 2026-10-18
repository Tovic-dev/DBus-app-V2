import Constants from 'expo-constants';

/**
 * Centralized API base URL.
 * Production default: https://dbus-app.vercel.app/api/v1
 * Override via Expo env var EXPO_PUBLIC_API_BASE_URL for development.
 */
const PRODUCTION_BASE = 'https://dbus-app.vercel.app/api/v1';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  PRODUCTION_BASE;

/** Default request timeout in milliseconds. */
export const API_TIMEOUT_MS = 10_000;