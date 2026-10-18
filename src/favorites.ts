/**
 * Lightweight favorites + recents store.
 * In-memory with a simple observable so multiple screens stay in sync, plus
 * AsyncStorage persistence (same pattern as src/i18n). The public API stays
 * synchronous; hydration runs once at module load and notifies subscribers when
 * persisted state arrives, so subscribed screens (home/saved/map) refresh.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FavoriteKind = 'stop' | 'route' | 'trip';

export interface Favorite {
  id: string;
  kind: FavoriteKind;
  label: string;
  sublabel?: string;
}

export interface Recent {
  id: string;
  kind: FavoriteKind;
  label: string;
  sub?: string;
  at: number; // epoch ms
}

type Listener = () => void;

const favorites = new Map<string, Favorite>();
const recents: Recent[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of Array.from(listeners)) l();
}

const STORAGE_KEY = '@dbus/favorites';

/** Serialize and persist current state. Fire-and-forget (storage is best-effort). */
function persist(): void {
  const payload = JSON.stringify({ favorites: Array.from(favorites.values()), recents });
  AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => undefined);
}

/** Load persisted state once at startup, then notify subscribers. */
async function hydrate(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { favorites?: Favorite[]; recents?: Recent[] };
    if (Array.isArray(data.favorites)) {
      for (const f of data.favorites) {
        if (f && typeof f.id === 'string') favorites.set(f.id, f);
      }
    }
    if (Array.isArray(data.recents)) {
      recents.push(...data.recents.filter((r) => r && typeof r.id === 'string'));
    }
    notify();
  } catch {
    // Corrupt or unavailable storage: start empty, never crash.
  }
}

// Kick off hydration as soon as the module is imported (before any screen reads).
void hydrate();

export function subscribeFavorites(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getFavorites(): Favorite[] {
  return Array.from(favorites.values());
}

export function isFavorite(id: string): boolean {
  return favorites.has(id);
}

export function toggleFavorite(fav: Favorite): boolean {
  if (favorites.has(fav.id)) {
    favorites.delete(fav.id);
    notify();
    persist();
    return false;
  }
  favorites.set(fav.id, fav);
  notify();
  persist();
  return true;
}

export function removeFavorite(id: string): void {
  if (favorites.delete(id)) {
    notify();
    persist();
  }
}

/** Add a recent and cap the list. */
export function pushRecent(item: Omit<Recent, 'at'>): void {
  const idx = recents.findIndex((r) => r.id === item.id && r.kind === item.kind);
  if (idx >= 0) recents.splice(idx, 1);
  recents.unshift({ ...item, at: Date.now() });
  if (recents.length > 12) recents.length = 12;
  notify();
  persist();
}

export function getRecents(): Recent[] {
  return Array.from(recents);
}