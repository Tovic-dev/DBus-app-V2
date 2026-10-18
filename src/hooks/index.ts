import { useQuery, useQueries } from '@tanstack/react-query';
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

export function useNearbyStops(lat: number, lon: number, radiusM = 500, limit = 20) {
  return useQuery({
    queryKey: queryKeys.nearbyStops(lat, lon, radiusM, limit),
    queryFn: () => fetchNearbyStops(lat, lon, radiusM, limit),
    staleTime: STATIC_STALE_TIME,
    enabled: lat !== undefined && lon !== undefined,
  });
}

export function useDepartures(stopId: string, at: string, limit = 20, enabled = true) {
  return useQuery({
    queryKey: queryKeys.departures(stopId, at, limit),
    queryFn: () => fetchDepartures(stopId, at, limit),
    staleTime: DEPARTURES_STALE_TIME,
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
 * Reachable destinations from an origin stop (smart planner filtering).
 *
 * 1. Fetch the origin's departures → unique set of route_ids serving it.
 * 2. For each route, fetch its stop sequence (cached, static).
 * 3. Union all stop_ids, drop the origin itself.
 *
 * Reuses the existing departures + routeStops queries/cache — no new
 * endpoints, no duplicated logic. Returns `null` stopIds while loading.
 */
export function useReachableStops(originStopId: string | null, at: string) {
  const deps = useDepartures(originStopId ?? '', at, 60, Boolean(originStopId));

  const routeIds = useMemo(
    () => Array.from(new Set((deps.data?.departures ?? []).map((d) => d.route_id))),
    [deps.data],
  );

  const routeStopsQueries = useQueries({
    queries: routeIds.map((rid) => ({
      queryKey: queryKeys.routeStops(rid),
      queryFn: () => fetchRouteStops(rid),
      staleTime: STATIC_STALE_TIME,
      enabled: Boolean(originStopId),
    })),
  });

  const stopIds = useMemo(() => {
    if (!originStopId) return null;
    const set = new Set<string>();
    routeStopsQueries.forEach((q) => (q.data?.stops ?? []).forEach((s) => set.add(s.stop_id)));
    set.delete(originStopId);
    return set;
  }, [routeStopsQueries, originStopId]);

  return {
    routeIds,
    stopIds,
    isLoading: Boolean(originStopId) && (deps.isLoading || routeStopsQueries.some((q) => q.isLoading)),
  };
}