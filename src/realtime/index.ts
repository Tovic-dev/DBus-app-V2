/**
 * Realtime architecture (Phase 4).
 *
 * Current data reality: the DBus backend serves ONLY the static GTFS timetable.
 * There is no validated DBus real-time source (SIRI/GTFS-RT publishers in the
 * raw index are other Basque operators, not DBus Donostia). Every departure
 * reports `realtime_status = "unavailable"`.
 *
 * This module defines the contract a future realtime provider must implement,
 * plus a scheduled-data fallback so the UI already works end-to-end and can be
 * hot-swapped to live data without rework.
 */

import { fetchDepartures } from '../api/endpoints';

export type VehicleStatus =
  | 'incoming'
  | 'stopped'
  | 'in_transit'
  | 'not_started';

export interface LiveVehicle {
  vehicleId: string;
  routeId: string;
  tripId: string;
  lat: number;
  lon: number;
  delaySec: number; // + = late, - = early, 0 = on time
  status: VehicleStatus;
  occupancy: 'low' | 'medium' | 'high' | 'unknown';
  heading?: number;
  updatedAt: string;
}

/** Aggregated departures for a stop, mixing scheduled + (future) realtime. */
export interface LiveDeparture {
  tripId: string;
  routeId: string;
  routeShortName: string;
  headsign: string | null;
  direction: number | null;
  /** Real departure time if live, else scheduled. */
  departureIso: string;
  /** 'live' | 'scheduled' | 'unknown' */
  source: 'live' | 'scheduled' | 'unknown';
  delayMin: number | null;
  canceled?: boolean;
}

/** App-wide realtime availability derived from the configured provider. */
export type RealtimeAvailability = 'live' | 'scheduled';

export interface StatusCopy {
  tone: 'live' | 'muted';
  text: string;
}

/**
 * Contract a realtime provider must satisfy. The current scheduled fallback
 * implements it so screens never branch on provider presence.
 */
export interface RealtimeProvider {
  /** 'live' once a validated feed exists; otherwise 'scheduled'. */
  availability: RealtimeAvailability;
  /** Vehicles currently served, or [] when realtime is unavailable. */
  vehicles(): Promise<LiveVehicle[]>;
  /** Enriched departures: live times when available, else scheduled. */
  departures(stopId: string, at: string): Promise<LiveDeparture[]>;
  /** Human copy for the UI status pill. */
  statusLabel(): StatusCopy;
}

/* ------------------------------------------------------------------ */
/* Scheduled fallback (no validated DBus realtime yet).               */
/* ------------------------------------------------------------------ */

async function scheduledDepartures(stopId: string, at: string): Promise<LiveDeparture[]> {
  try {
    const res = await fetchDepartures(stopId, at, 20);
    return res.departures.map((d) => ({
      tripId: d.trip_id,
      routeId: d.route_id,
      routeShortName: d.route_short_name,
      headsign: d.headsign,
      direction: d.direction_id,
      departureIso: d.scheduled_departure,
      source: 'scheduled' as const,
      delayMin: 0,
    }));
  } catch {
    return [];
  }
}

const scheduledFallback: RealtimeProvider = {
  availability: 'scheduled',
  async vehicles() {
    return [];
  },
  departures(stopId, at) {
    return scheduledDepartures(stopId, at);
  },
  statusLabel() {
    return { tone: 'muted' as const, text: 'Scheduled times — live not available' };
  },
};

/** The single realtime provider used across the app. */
export const realtime: RealtimeProvider = scheduledFallback;