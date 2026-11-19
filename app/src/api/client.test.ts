import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiUrl, fetchJson } from './client.ts';

const OK = 200;
const BAD_REQUEST = 400;
const SERVER_ERROR = 500;
const BAD_GATEWAY = 502;

const respondWith = (body: string, status = OK) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status, headers: { 'Content-Type': 'application/json' } })));

describe('apiUrl', () => {
  it('puts /api in front, so the proxy and nginx can route it', () => {
    expect(apiUrl('/metadata')).toBe('/api/metadata');
  });

  it('joins lists with commas, skips missing values and encodes the rest', () => {
    expect(apiUrl('/prevalences', { admin_level: 1, properties: ['admin1', 'median'], admin0: undefined, gene: 'k13' }))
      .toBe('/api/prevalences?admin_level=1&properties=admin1%2Cmedian&gene=k13');
  });
});

describe('fetchJson', () => {
  it('returns the parsed body', async () => {
    respondWith('{"model_releases":["v0.1.0"]}');
    await expect(fetchJson('/metadata')).resolves.toEqual({ model_releases: ['v0.1.0'] });
    expect(fetch).toHaveBeenCalledWith('/api/metadata', { signal: undefined });
  });

  it('turns the API\'s error message into an ApiError with the status', async () => {
    respondWith('{"error":"Invalid admin level requested: 7"}', BAD_REQUEST);
    const failure = fetchJson('/prevalences');
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: BAD_REQUEST, message: 'Invalid admin level requested: 7' });
  });

  it('still gives a useful error when the body is not the API\'s', async () => {
    respondWith('<html>Bad gateway</html>', BAD_GATEWAY);
    await expect(fetchJson('/metadata')).rejects.toMatchObject({ status: BAD_GATEWAY, message: 'The API answered 502.' });
  });

  it('does not mistake other JSON for an API error', async () => {
    respondWith('{"error":42}', SERVER_ERROR);
    await expect(fetchJson('/metadata')).rejects.toMatchObject({ message: 'The API answered 500.' });
  });
});
