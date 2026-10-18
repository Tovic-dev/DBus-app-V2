/**
 * Centralized query-key factories.
 * Keys include parameters that materially affect the query result.
 */

export const queryKeys = {
  stops: (limit = 100) => ['stops', limit] as const,
  stop: (stopId: string) => ['stop', stopId] as const,
  nearbyStops: (lat: number, lon: number, radiusM = 500, limit = 20) =>
    ['nearbyStops', lat, lon, radiusM, limit] as const,
  departures: (stopId: string, at: string, limit = 20) =>
    ['departures', stopId, at, limit] as const,
  routes: () => ['routes'] as const,
  route: (routeId: string) => ['route', routeId] as const,
  routeStops: (routeId: string, direction?: number) =>
    ['routeStops', routeId, direction] as const,
  routeTrips: (routeId: string, serviceDate: string) =>
    ['routeTrips', routeId, serviceDate] as const,
  routeShape: (routeId: string, tripId?: string) =>
    ['routeShape', routeId, tripId] as const,
  search: (query: string, limit = 20) => ['search', query, limit] as const,
};