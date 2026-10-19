import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '../query/keys';
import {
  fetchStops,
  fetchStop,
  fetchNearbyStops,
  fetchDepartures,
  fetchRoutes,
  fetchRoute,
  fetchRouteStops,
  fetchRouteTrips,
  fetchRouteShape,
  fetchSearch,
  fetchReachable,
} from '../api/endpoints';

/** Stale time for static data (stops, routes, shapes, search). */
const STATIC_STALE_TIME = 60 * 60_000; // 1 hour

/** Stale time for departures (matches backend 60s cache). */
const DEPARTURES_STALE_TIME = 60_000; // 60 seconds

// ---- Stops ----

export function useStops(limit = 100) {
  return useQuery({
    queryKey: queryKeys.stops(limit),
    queryFn: () => fetchStops(limit),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useStop(stopId: string) {
  return useQuery({
    queryKey: queryKeys.stop(stopId),
    queryFn: () => fetchStop(stopId),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useNearbyStops(lat: number | undefined, lon: number | undefined, radiusM = 500, limit = 20) {
  return useQuery({
    queryKey: queryKeys.nearbyStops(lat ?? 0, lon ?? 0, radiusM, limit),
    queryFn: () => fetchNearbyStops(lat as number, lon as number, radiusM, limit),
    staleTime: STATIC_STALE_TIME,
    enabled: lat !== undefined && lon !== undefined,
  });
}

export function useDepartures(stopId: string, at: string, limit = 20, enabled = true) {
  return useQuery({
    queryKey: queryKeys.departures(stopId, at, limit),
    queryFn: () => fetchDepartures(stopId, at, limit),
    staleTime: DEPARTURES_STALE_TIME,
    // Keep the previous minute's list on screen while the next one loads, so
    // the once-a-minute key change never flashes a spinner.
    placeholderData: (prev) => prev,
    enabled,
  });
}

// ---- Routes ----

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes(),
    queryFn: () => fetchRoutes(),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useRoute(routeId: string) {
  return useQuery({
    queryKey: queryKeys.route(routeId),
    queryFn: () => fetchRoute(routeId),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useRouteStops(routeId: string, direction?: number) {
  return useQuery({
    queryKey: queryKeys.routeStops(routeId, direction),
    queryFn: () => fetchRouteStops(routeId, direction),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useRouteTrips(routeId: string, serviceDate: string) {
  return useQuery({
    queryKey: queryKeys.routeTrips(routeId, serviceDate),
    queryFn: () => fetchRouteTrips(routeId, serviceDate),
    staleTime: STATIC_STALE_TIME,
  });
}

export function useRouteShape(routeId: string, tripId?: string) {
  return useQuery({
    queryKey: queryKeys.routeShape(routeId, tripId),
    queryFn: () => fetchRouteShape(routeId, tripId),
    staleTime: STATIC_STALE_TIME,
  });
}

// ---- Search ----

export function useSearch(query: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.search(query, limit),
    queryFn: () => fetchSearch(query, limit),
    staleTime: STATIC_STALE_TIME,
    enabled: query.length > 0,
  });
}

/**
 * Destinations reachable from `originStopId` without changing bus, and the
 * lines (route + direction) that get to each one.
 *
 * V2: one call to GET /stops/{id}/reachable, built from the whole timetable on
 * the server. Before, it was derived from the next departures at the chosen
 * time, so it returned nothing at night and missed less frequent lines.
 */
export function useReachableStops(originStopId: string | null) {
  const q = useQuery({
    queryKey: queryKeys.reachable(originStopId ?? ''),
    queryFn: () => fetchReachable(originStopId as string),
    enabled: Boolean(originStopId),
    staleTime: STATIC_STALE_TIME,
  });

  const { stopIds, linesByStop } = useMemo(() => {
    if (!originStopId || !q.data) return { stopIds: null, linesByStop: null };
    const ids = new Set<string>();
    const lines = new Map<string, Set<string>>();
    for (const d of q.data.destinations) {
      ids.add(d.stop_id);
      lines.set(d.stop_id, new Set(d.lines.map((l) => lineKey(l.route_id, l.direction_id))));
    }
    return { stopIds: ids, linesByStop: lines };
  }, [q.data, originStopId]);

  return {
    routeIds: q.data?.route_ids ?? [],
    /** null while loading or on error → callers fall back to "all stops". */
    stopIds,
    /** Lines (route|direction) going from the origin to `destStopId`, or null if unknown. */
    linesTo: (destStopId: string): Set<string> | null => linesByStop?.get(destStopId) ?? null,
    isLoading: Boolean(originStopId) && q.isLoading,
    isError: q.isError,
  };
}

/** Key identifying a line in one direction, e.g. "28|0". */
export function lineKey(routeId: string, directionId: number | null | undefined): string {
  return `${routeId}|${directionId ?? ''}`;
}
