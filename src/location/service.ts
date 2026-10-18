import * as Location from 'expo-location';
import type { LocationResult } from './types';

/**
 * One-shot foreground location acquisition.
 * - Requests foreground permission only when called (never on render).
 * - Returns a normalized LocationResult.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { status: 'denied' };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      status: 'granted',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return { status: 'error', message: 'Could not determine your location.' };
  }
}