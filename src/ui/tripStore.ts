/** Trip planner state shared by the Viaje screen and its stop picker sheet. */
import type { Stop } from '../api/types';
import { createStore } from './store';

export type TripMode = 'leave' | 'arrive';
export type TripField = 'from' | 'to';

export const tripStore = createStore<{
  from: Stop | null;
  to: Stop | null;
  mode: TripMode;
  date: Date;
  picking: TripField;
}>({ from: null, to: null, mode: 'leave', date: new Date(), picking: 'from' });

export function pickStop(field: TripField, stop: Stop) {
  tripStore.set((s) => {
    if (field === 'from') return { from: stop, to: s.to?.stop_id === stop.stop_id ? null : s.to };
    return { to: stop, from: s.from?.stop_id === stop.stop_id ? null : s.from };
  });
}
