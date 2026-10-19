import { useCallback, useEffect, useState } from 'react';
import { getCurrentLocation } from '../location/service';

export type LocState =
  | { status: 'locating' }
  | { status: 'ready'; lat: number; lon: number }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'error' };

/** Locates once on mount; `refresh()` asks again (pull-to-refresh, retry). */
export function useLocation() {
  const [state, setState] = useState<LocState>({ status: 'locating' });
  const refresh = useCallback(async () => {
    setState((s) => (s.status === 'ready' ? s : { status: 'locating' }));
    const r = await getCurrentLocation();
    if (r.status === 'granted') setState({ status: 'ready', lat: r.latitude, lon: r.longitude });
    else if (r.status === 'denied') setState({ status: 'denied' });
    else if (r.status === 'unavailable') setState({ status: 'unavailable' });
    else setState({ status: 'error' });
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { state, refresh };
}
