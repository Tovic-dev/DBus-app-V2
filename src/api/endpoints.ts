import { apiGet } from './client';
import type {
  Stop,
  NearbyStop,
  Route,
  RouteStopsResponse,
  TripsResponse,
  RouteShape,
  SearchResponse,
  StopsResponse,
  RoutesResponse,
  DeparturesResponse,
} from './types';

// ---- Stops ----

export function fetchStops(limit = 100): Promise<StopsResponse> {
  return apiGet<StopsResponse>('/stops', { limit });
}

export function fetchStop(stopId: string): Promise<Stop> {
  return apiGet<Stop>(`/stops/${stopId}`);
}

export function fetchNearbyStops(
  lat: number,
  lon: number,
  radiusM = 500,
  limit = 20,
): Promise<NearbyStop[]> {
  return apiGet<NearbyStop[]>('/stops/nearby', {
    lat,
    lon,
    radius_m: radiusM,
    limit,
  });
}

export function fetchDepartures(
  stopId: string,
  at: string,
  limit = 20,
): Promise<DeparturesResponse> {
  return apiGet<DeparturesResponse>(`/stops/${stopId}/departures`, { at, limit });
}

// ---- Routes ----

export function fetchRoutes(): Promise<RoutesResponse> {
  return apiGet<RoutesResponse>('/routes');
}

export function fetchRoute(routeId: string): Promise<Route> {
  return apiGet<Route>(`/routes/${routeId}`);
}

export function fetchRouteStops(
  routeId: string,
  direction?: number,
): Promise<RouteStopsResponse> {
  return apiGet<RouteStopsResponse>(`/routes/${routeId}/stops`, { direction });
}

export function fetchRouteTrips(
  routeId: string,
  serviceDate: string,
): Promise<TripsResponse> {
  return apiGet<TripsResponse>(`/routes/${routeId}/trips`, {
    service_date: serviceDate,
  });
}

export function fetchRouteShape(routeId: string, tripId?: string): Promise<RouteShape> {
  return apiGet<RouteShape>(`/routes/${routeId}/shape`, { trip_id: tripId });
}

// ---- Search ----

export function fetchSearch(query: string, limit = 20): Promise<SearchResponse> {
  return apiGet<SearchResponse>('/search', { q: query, limit });
}