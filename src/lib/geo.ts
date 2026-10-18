/** Geographic helpers for the schematic (non-tile) map views. */

/** Approx meters per degree at a reference latitude. */
export function metersPerDegree(lat: number): { mPerLat: number; mPerLon: number } {
  const latRad = (lat * Math.PI) / 180;
  const mPerLat = 111_320;
  const mPerLon = 111_320 * Math.cos(latRad);
  return { mPerLat, mPerLon };
}

/** Express a lat/lon as meters east/north relative to a reference point. */
export function offsetMeters(
  lat: number,
  lon: number,
  refLat: number,
  refLon: number,
): { dx: number; dy: number } {
  const { mPerLat, mPerLon } = metersPerDegree(refLat);
  return { dx: (lon - refLon) * mPerLon, dy: (lat - refLat) * mPerLat };
}

/**
 * Map a set of local meter offsets onto a square canvas of `size` px.
 * `scale` = meters shown over half the canvas width. North is up.
 */
export function projectToCanvas(
  points: { dx: number; dy: number }[],
  size: number,
  scale: number,
): { x: number; y: number }[] {
  const half = size / 2;
  const px = half / scale;
  return points.map((p) => ({ x: half + p.dx * px, y: half - p.dy * px }));
}

/** Human distance label. */
export function humanDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}