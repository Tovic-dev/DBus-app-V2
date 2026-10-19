/** Tiny observable store (no dependency) for state shared between routes. */
import { useSyncExternalStore } from 'react';

export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch: Partial<T> | ((s: T) => Partial<T>)) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function useStore<T, S>(store: ReturnType<typeof createStore<T>>, select: (s: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}
