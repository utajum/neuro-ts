/* eslint-disable import/no-relative-packages */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTokenIssuer, tokenProviderFromUrl } from '../../dist/issue-token.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// createTokenIssuer
// ---------------------------------------------------------------------------

describe('createTokenIssuer: method handling', () => {
  test('accepts GET', async () => {
    const handler = createTokenIssuer({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://issue.test/', { method: 'GET' }));
    expect(res.status).toBe(200);
  });

  test('accepts POST', async () => {
    const handler = createTokenIssuer({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://issue.test/', { method: 'POST' }));
    expect(res.status).toBe(200);
  });

  test('returns 405 on PUT', async () => {
    const handler = createTokenIssuer({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://issue.test/', { method: 'PUT' }));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ error: 'GET or POST only' });
  });

  test('returns 405 on DELETE', async () => {
    const handler = createTokenIssuer({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://issue.test/', { method: 'DELETE' }));
    expect(res.status).toBe(405);
  });
});

describe('createTokenIssuer: authentication', () => {
  test('returns 401 when authenticate throws', async () => {
    const handler = createTokenIssuer({
      apiKey: 'sk-test',
      authenticate: () => {
        throw new Error('forbidden');
      },
    });
    const res = await handler(new Request('https://issue.test/', { method: 'GET' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });

  test('passes through when authenticate resolves', async () => {
    const auth = vi.fn();
    const handler = createTokenIssuer({ apiKey: 'sk-test', authenticate: auth });
    const res = await handler(new Request('https://issue.test/', { method: 'GET' }));
    expect(auth).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('createTokenIssuer: response shape', () => {
  test('returns { token, expiresAt } with the configured key', async () => {
    const handler = createTokenIssuer({ apiKey: 'sk-config-key' });
    const res = await handler(new Request('https://issue.test/', { method: 'POST' }));
    const body = (await res.json()) as { token: string; expiresAt: number };
    expect(body.token).toBe('sk-config-key');
    expect(typeof body.expiresAt).toBe('number');
    expect(body.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('honours ttlSeconds (default 300)', async () => {
    const before = Math.floor(Date.now() / 1000);
    const handler = createTokenIssuer({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://issue.test/', { method: 'POST' }));
    const body = (await res.json()) as { expiresAt: number };
    expect(body.expiresAt - before).toBeGreaterThanOrEqual(299);
    expect(body.expiresAt - before).toBeLessThanOrEqual(301);
  });

  test('honours custom ttlSeconds', async () => {
    const before = Math.floor(Date.now() / 1000);
    const handler = createTokenIssuer({ apiKey: 'sk-test', ttlSeconds: 60 });
    const res = await handler(new Request('https://issue.test/', { method: 'POST' }));
    const body = (await res.json()) as { expiresAt: number };
    expect(body.expiresAt - before).toBeGreaterThanOrEqual(59);
    expect(body.expiresAt - before).toBeLessThanOrEqual(61);
  });
});

// ---------------------------------------------------------------------------
// tokenProviderFromUrl
// ---------------------------------------------------------------------------

describe('tokenProviderFromUrl: happy path', () => {
  test('fetches and returns the token', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ token: 'sk-from-server', expiresAt: 9999999999 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = tokenProviderFromUrl('https://issue.test/');
    const token = await provider();
    expect(token).toBe('sk-from-server');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://issue.test/', undefined);
  });

  test('forwards optional RequestInit to fetch', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ token: 'sk-x', expiresAt: 9999999999 }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = tokenProviderFromUrl('https://issue.test/', {
      headers: { 'x-app': 'demo' },
      credentials: 'include',
    });
    await provider();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://issue.test/',
      expect.objectContaining({
        headers: { 'x-app': 'demo' },
        credentials: 'include',
      }),
    );
  });
});

describe('tokenProviderFromUrl: caching', () => {
  test('caches until 30 seconds before expiry', async () => {
    const now = 1_700_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);

    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ token: 'sk-cached', expiresAt: now + 100 }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = tokenProviderFromUrl('https://issue.test/');
    expect(await provider()).toBe('sk-cached');
    // Move forward 60 seconds; still within (expiresAt - 30 = +70) so cache hits.
    vi.setSystemTime((now + 60) * 1000);
    expect(await provider()).toBe('sk-cached');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test('re-fetches once cache window closes (30s before expiry)', async () => {
    const now = 1_700_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'first', expiresAt: now + 60 }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'second', expiresAt: now + 200 }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const provider = tokenProviderFromUrl('https://issue.test/');
    expect(await provider()).toBe('first');
    // Move past expiresAt-30 (= now+30): cache window is closed, refetch.
    vi.setSystemTime((now + 35) * 1000);
    expect(await provider()).toBe('second');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('falls back to expiresAt = now+60 when server omits expiresAt', async () => {
    const now = 1_700_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'short' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'long' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = tokenProviderFromUrl('https://issue.test/');
    expect(await provider()).toBe('short');
    // Default fallback expiresAt is now+60; cache window closes at +30. At +35 we refetch.
    vi.setSystemTime((now + 35) * 1000);
    expect(await provider()).toBe('long');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('tokenProviderFromUrl: error paths', () => {
  test('throws on non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('forbidden', { status: 403 })),
    );
    const provider = tokenProviderFromUrl('https://issue.test/');
    await expect(provider()).rejects.toThrow(/Token endpoint returned 403/);
  });

  test('throws when response body has no token field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ expiresAt: 9999999999 }), { status: 200 })),
    );
    const provider = tokenProviderFromUrl('https://issue.test/');
    await expect(provider()).rejects.toThrow(/did not return \{ token \}/);
  });

  test('throws when token field is empty string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ token: '', expiresAt: 9999999999 }), {
            status: 200,
          }),
      ),
    );
    const provider = tokenProviderFromUrl('https://issue.test/');
    await expect(provider()).rejects.toThrow(/did not return \{ token \}/);
  });
});
