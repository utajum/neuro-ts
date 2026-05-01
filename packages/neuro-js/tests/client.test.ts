import { afterEach, describe, expect, test, vi } from 'vitest';
import { NeuroClient } from '../src/client';
import { configureClient, getClient, isConfigured, resetClient } from '../src/client-instance';
import { NeuroBrowserApiKeyError, NeuroClientError, NeuroNotConfiguredError } from '../src/errors';

afterEach(() => {
  resetClient();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('configureClient / getClient', () => {
  test('throws when accessed before configuration', () => {
    expect(() => getClient()).toThrow(NeuroNotConfiguredError);
    expect(isConfigured()).toBe(false);
  });

  test('rejects empty options', () => {
    // @ts-expect-error - intentional misuse
    expect(() => configureClient({})).toThrow(NeuroClientError);
  });

  test('rejects multiple modes simultaneously', () => {
    expect(() => configureClient({ apiKey: 'sk-test', proxyUrl: 'https://x' })).toThrow(
      /exactly one/i,
    );
  });

  test('apiKey configures the client in a non-browser env', () => {
    const client = configureClient({ apiKey: 'sk-test' });
    expect(client).toBeInstanceOf(NeuroClient);
    expect(client.mode).toBe('apiKey');
    expect(isConfigured()).toBe(true);
  });

  test('rejects long-lived apiKey in a browser-like env', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});
    expect(() => configureClient({ apiKey: 'sk-test' })).toThrow(NeuroBrowserApiKeyError);
  });

  test('dangerouslyAllowBrowser overrides the browser guard', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});
    expect(() =>
      configureClient({ apiKey: 'sk-test', dangerouslyAllowBrowser: true }),
    ).not.toThrow();
  });

  test('rejects invalid proxyUrl', () => {
    expect(() => configureClient({ proxyUrl: 'not-a-url' })).toThrow(/Invalid `proxyUrl`/);
  });
});
