import * as Location from 'expo-location';
import type { LocationResult } from './types';

/** Give up on a fresh GPS fix after this long and use what we have. */
const FIX_TIMEOUT_MS = 8000;
/** A cached position younger than this is good enough for "stops near you". */
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(null), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      () => { clearTimeout(id); resolve(null); },
    );
  });
}

/**
 * One-shot foreground location acquisition.
 *
 * V2 fix: `getCurrentPositionAsync` can stay pending forever on iOS (weak GPS,
 * indoors, Low Power Mode), which left Home stuck on "Buscando…". Now:
 *  1. permission is requested (only when called, never on render);
 *  2. location services off → `unavailable`;
 *  3. a fresh fix is awaited at most FIX_TIMEOUT_MS;
 *  4. otherwise the last known position is used; if there is none → `error`.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: 'denied' };

    const enabled = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!enabled) return { status: 'unavailable' };

    const fresh = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      FIX_TIMEOUT_MS,
    );
    const position =
      fresh ??
      (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync().catch(() => null));

    if (!position) return { status: 'error', message: 'timeout' };
    return {
      status: 'granted',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return { status: 'error', message: 'failed' };
  }
}
