/** Result of a one-shot foreground location request. */
export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };