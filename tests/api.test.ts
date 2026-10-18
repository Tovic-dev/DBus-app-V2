import { buildQueryParams, buildUrl, apiGet } from '../src/api/client';
import { ApiError, NetworkError, DecodeError, parseApiError } from '../src/api/errors';

// Mock fetch globally
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock config to use a known base URL
jest.mock('../src/api/config', () => ({
  API_BASE_URL: 'https://test.example.com/api/v1',
  API_TIMEOUT_MS: 10000,
}));

describe('buildQueryParams', () => {
  it('serializes params, skipping null/undefined', () => {
    const qs = buildQueryParams({ a: 1, b: 'hello', c: null, d: undefined, e: true });
    expect(qs).toContain('a=1');
    expect(qs).toContain('b=hello');
    expect(qs).toContain('e=true');
    expect(qs).not.toContain('c=');
    expect(qs).not.toContain('d=');
  });

  it('returns empty string for empty params', () => {
    expect(buildQueryParams({})).toBe('');
  });
});

describe('buildUrl', () => {
  it('constructs a URL with path and params', () => {
    const url = buildUrl('/stops', { limit: 100 });
    expect(url).toBe('https://test.example.com/api/v1/stops?limit=100');
  });

  it('constructs a URL without params', () => {
    const url = buildUrl('/routes');
    expect(url).toBe('https://test.example.com/api/v1/routes');
  });

  it('handles paths without leading slash', () => {
    const url = buildUrl('search', { q: 'test' });
    expect(url).toBe('https://test.example.com/api/v1/search?q=test');
  });
});

describe('apiGet', () => {
  afterEach(() => mockFetch.mockReset());

  it('returns parsed JSON on 2xx', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ stop_id: '1', stop_name: 'Test' }),
    });
    const result = await apiGet('/stops/1');
    expect(result).toEqual({ stop_id: '1', stop_name: 'Test' });
  });

  it('throws ApiError on non-2xx with error body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 'STOP_NOT_FOUND', message: 'Stop not found' } }),
    });
    await expect(apiGet('/stops/999')).rejects.toThrow(ApiError);
    try {
      await apiGet('/stops/999');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe('STOP_NOT_FOUND');
      expect((e as ApiError).httpStatus).toBe(404);
    }
  });

  it('throws ApiError on non-2xx with unparseable body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('not JSON'); },
    });
    await expect(apiGet('/stops/1')).rejects.toThrow(ApiError);
  });

  it('throws NetworkError on fetch failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiGet('/stops/1')).rejects.toThrow(NetworkError);
  });

  it('throws DecodeError on malformed JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('bad JSON'); },
    });
    await expect(apiGet('/stops/1')).rejects.toThrow(DecodeError);
  });
});

describe('parseApiError', () => {
  it('preserves backend error codes', async () => {
    const response = {
      status: 400,
      json: async () => ({ error: { code: 'INVALID_DATE', message: 'bad date' } }),
    } as unknown as Response;
    const err = await parseApiError(response);
    expect(err.code).toBe('INVALID_DATE');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('bad date');
  });

  it('falls back to INTERNAL_ERROR for unparseable body', async () => {
    const response = {
      status: 502,
      json: async () => { throw new Error('no JSON'); },
    } as unknown as Response;
    const err = await parseApiError(response);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.httpStatus).toBe(502);
  });
});