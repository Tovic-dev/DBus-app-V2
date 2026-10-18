/**
 * TypeScript models matching the backend API contract exactly.
 * Source of truth: api/schemas.py (Phase 2B).
 * Field names use snake_case to match the backend JSON.
 */

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

export interface NearbyStop extends Stop {
  distance_m: number;
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string | null;
  route_type: number;
}

export interface RouteStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  trip_id: string;
  direction_id: number | null;
  headsign: string | null;
  stop_sequence: number;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  headsign: string | null;
  direction_id: number | null;
  shape_id: string | null;
}

export interface ScheduledDeparture {
  stop_id: string;
  stop_name: string;
  route_id: string;
  route_short_name: string;
  trip_id: string;
  headsign: string | null;
  direction_id: number | null;
  stop_sequence: number;
  scheduled_departure: string;
  service_date: string;
  realtime_status: string;
}

export interface ShapePoint {
  shape_id: string;
  lat: number;
  lon: number;
  sequence: number;
}

export interface RouteShape {
  route_id: string;
  shapes: Record<string, ShapePoint[]>;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface SearchResponse {
  query: string;
  results: Stop[];
}

export interface StopsResponse {
  stops: Stop[];
}

export interface RoutesResponse {
  routes: Route[];
}

export interface RouteStopsResponse {
  route_id: string;
  direction: number | null;
  stops: RouteStop[];
}

export interface TripsResponse {
  route_id: string;
  service_date: string;
  trips: Trip[];
}

export interface DeparturesResponse {
  stop_id: string;
  at: string;
  limit: number;
  departures: ScheduledDeparture[];
}
/** GET /stops/{id}/reachable — destinations reachable without a transfer. */
export interface ReachableLine {
  route_id: string;
  direction_id: number | null;
}

export interface ReachableDestination {
  stop_id: string;
  lines: ReachableLine[];
}

export interface ReachableResponse {
  stop_id: string;
  route_ids: string[];
  destinations: ReachableDestination[];
}
