/**
 * Stable per-route color system.
 * The same line ALWAYS gets the same color across the whole app
 * (Home, Map, Route detail, Schedules, Planner, Live trip) because
 * every screen resolves colors through this module only.
 *
 * Known DBus Donostia lines get curated colors; any other line is
 * assigned deterministically from its short name hash.
 */

export const ROUTE_COLORS = [
  '#0f9447', // green
  '#0066cc', // blue
  '#7d2e8f', // purple
  '#e8710a', // orange
  '#007a8c', // teal
  '#b31e5e', // magenta
  '#c75000', // rust
  '#5a6b1f', // olive
  '#2065b0', // azure
  '#6b5b9e', // violet
] as const;

/** Curated assignments (example: 13 → green, 17 → blue, 28 → purple, 42 → orange). */
const KNOWN: Record<string, string> = {
  '13': '#0f9447',
  '17': '#0066cc',
  '28': '#7d2e8f',
  '42': '#e8710a',
  '5':  '#007a8c',
  '33': '#b31e5e',
  '45': '#c75000',
};

function hashKey(key: string): number {
  let h = 0;
  const s = key || '0';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Resolve the stable color for a line. Accepts the short name ("28") or a
 * route_id — anything containing the number works because the numeric part
 * is extracted first.
 */
export function routeColor(nameOrId: string | null | undefined): string {
  if (!nameOrId) return ROUTE_COLORS[0];
  const match = nameOrId.match(/\d+/);
  const key = match ? match[0] : nameOrId;
  const known = KNOWN[key];
  if (known) return known;
  return ROUTE_COLORS[hashKey(key) % ROUTE_COLORS.length];
}

/** Light tint of a route color, for chips/backgrounds (18% alpha). */
export function routeTint(nameOrId: string | null | undefined): string {
  return `${routeColor(nameOrId)}2e`;
}