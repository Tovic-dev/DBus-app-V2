import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError, NetworkError, DecodeError, parseApiError } from './errors';

/** Serialize query params, skipping undefined/null values. */
export function buildQueryParams(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)]);
  if (entries.length === 0) return '';
  const search = new URLSearchParams(entries);
  return search.toString();
}

/** Construct a full URL from base + path + query params. */
export function buildUrl(path: string, params?: Record<string, unknown>): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const qs = params ? buildQueryParams(params) : '';
  const separator = qs ? '?' : '';
  return `${API_BASE_URL}${cleanPath}${separator}${qs}`;
}

/**
 * Typed HTTP GET client.
 * - Constructs URLs with serialized query params.
 * - Applies a timeout via AbortController.
 * - Converts non-2xx to ApiError (preserving backend codes).
 * - Distinguishes network failures, timeouts, and decode errors.
 */
export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NetworkError('timeout', 'Request timed out');
    }
    throw new NetworkError('network', err instanceof Error ? err.message : 'Network request failed');
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    throw new DecodeError(err instanceof Error ? err.message : 'Failed to parse JSON response');
  }

  return body as T;
}