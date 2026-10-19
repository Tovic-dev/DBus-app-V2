/** Map selection shared by the map screen and its stop sheet. */
import type { Stop } from '../api/types';
import { createStore } from './store';

export const mapStore = createStore<{ stop: Stop | null; sheetOpen: boolean }>({ stop: null, sheetOpen: false });
