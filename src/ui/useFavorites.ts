import { useEffect, useState } from 'react';
import { getFavorites, subscribeFavorites, type Favorite } from '../favorites';

/** Live list of favourites (re-renders on every toggle anywhere in the app). */
export function useFavorites(): Favorite[] {
  const [favs, setFavs] = useState<Favorite[]>(() => getFavorites());
  useEffect(() => {
    setFavs(getFavorites());
    return subscribeFavorites(() => setFavs(getFavorites()));
  }, []);
  return favs;
}
