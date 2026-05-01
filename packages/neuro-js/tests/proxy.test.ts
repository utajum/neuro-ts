/* eslint-disable import/no-relative-packages */
import { afterEach, describe, expect, test, vi } from 'vitest';
// See native-fallback.test.ts for why we import from dist.
import { configureClient, neuro, resetClient } from '../dist/index.js';

afterEach(() => {
  resetClient();
  vi.restoreAllMocks();
});

describe('proxyUrl mode (object-shape API)', () => {
  test('routes the call to the proxy when a prompt is provided on the input', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const arr = JSON.parse(body.instanceData);
      return new Response(JSON.stringify({ result: arr.length }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    configureClient({ proxyUrl: 'https://example.test/neuro' });
    const result = await neuro.array.map({
      array: [1, 2, 3],
      callbackfn: (n: number) => n * 2,
      prompt: 'double each',
    });
    expect(result).toBe(3);
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.functionId).toBe('Array.prototype.map');
    expect(sent.prompt).toBe('double each');
    expect(JSON.parse(sent.instanceData)).toEqual([1, 2, 3]);
    // The new payload carries `args` as a named record, not a positional array.
    expect(typeof sent.args).toBe('object');
    expect(sent.args).not.toBeNull();
  });

  test('routes a static method to the proxy with a prompt', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ result: 0.42 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    const result = await neuro.math.random({ prompt: 'a number near 0.42' });
    expect(result).toBe(0.42);
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.functionId).toBe('Math.random');
    expect(sent.prompt).toBe('a number near 0.42');
  });

  test('does not call the proxy when no prompt is provided on the input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });

    const r = await neuro.math.random({});
    expect(typeof r).toBe('number');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('does not call the proxy when prompt is an empty string', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    const r = await neuro.math.floor({ x: 4.7, prompt: '' });
    expect(r).toBe(4);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('throws NeuroClientError on a non-2xx proxy response', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('boom', { status: 500, statusText: 'Server Error' }),
    );
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await expect(
      neuro.array.map({ array: [1, 2], callbackfn: (x: number) => x, prompt: 'x' }),
    ).rejects.toThrow(/Proxy.*responded 500/);
  });

  test('proxy payload args carry named keys for variadic methods', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ result: 99 })));
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await neuro.math.max({ values: [1, 5, 99], prompt: 'pick the loudest' });
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.functionId).toBe('Math.max');
    expect(sent.args).toEqual({ values: [1, 5, 99] });
  });
});
