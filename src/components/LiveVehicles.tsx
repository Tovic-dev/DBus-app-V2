import { useEffect, useState } from 'react';
import { realtime, type LiveVehicle } from '../realtime';

export function useLiveVehicles(routeId?: string, enabled = true) {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      for (;;) {
        try {
          const v = await realtime.vehicles();
          setVehicles(routeId ? v.filter((x) => x.routeId === routeId) : v);
        } catch {
          setVehicles([]);
        }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 30_000));
      }
    })();
    return () => { cancelled = true; };
  }, [routeId, enabled]);
  return vehicles;
}

/** Stub hook for the map layer — vehicles are unavailable for DBus so this is a no-op. */
export function useVehicleMarkers(routeId?: string) {
  return useLiveVehicles(routeId, false);
}