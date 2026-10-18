/**
 * Tab-bar visibility pub/sub (Apple Maps behaviour).
 *
 * When the map place sheet is open it extends to the bottom edge of the
 * screen, COVERING the floating tab bar — so the tab bar hides itself while
 * the sheet is visible and returns when the sheet closes. Kept as a tiny
 * observable (same pattern as src/favorites.ts) so the map screen and the
 * tab bar stay decoupled.
 */
type Listener = (hidden: boolean) => void;

const listeners = new Set<Listener>();
let current = false;

export function setTabBarHidden(hidden: boolean): void {
  if (current === hidden) return;
  current = hidden;
  for (const l of listeners) l(hidden);
}

export function isTabBarHidden(): boolean {
  return current;
}

export function subscribeTabBarVisibility(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
