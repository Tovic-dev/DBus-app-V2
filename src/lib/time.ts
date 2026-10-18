/** Time helpers around the scheduled-departure ISO timestamps. */

/** Parse an ISO string to a Date (handles +HH:MM / Z offsets). */
export function parseIso(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Local clock label like "20:05". */
export function formatClock(iso: string | undefined | null): string {
  const d = parseIso(iso);
  if (!d) return '—';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Whole minutes between now and the given ISO time (negative = past). */
export function minutesFromNow(iso: string | undefined | null, now: Date = new Date()): number | null {
  const d = parseIso(iso);
  if (!d) return null;
  return Math.round((d.getTime() - now.getTime()) / 60_000);
}

/** A friendly upcoming label: "now", "in 4 min", "20:05". */
export function countdownLabel(iso: string | undefined | null, now: Date = new Date()): string {
  const mins = minutesFromNow(iso, now);
  if (mins === null) return '—';
  if (mins <= 0) return 'now';
  if (mins < 60) return `in ${mins} min`;
  return formatClock(iso);
}

/** Round an ISO timestamp down to the minute — stabilizes departure refetch keys. */
export function floorToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
}

/** Normalize an ISO timestamp to whole-minute precision (stable cache key). */
export function stableNow(date: Date = new Date()): string {
  return floorToMinute(date).toISOString();
}