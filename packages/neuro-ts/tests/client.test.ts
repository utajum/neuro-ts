import { afterEach, describe, expect, test, vi } from 'vitest';
import { NeuroClient } from '../src/client';
import { configureClient, getClient, isConfigured, resetClient } from '../src/client-instance';
import { NeuroBrowserApiKeyError, NeuroClientError, NeuroNotConfiguredError } from '../src/errors';

// Mock the openai module so we can intercept OpenAI constructor calls
const mockCreate = vi.fn();
vi.mock('openai', () => {
  const MockOpenAI = vi.fn(function (this: Record<string, unknown>) {
    this.chat = { completions: { create: mockCreate } };
  });
  return { default: MockOpenAI };
});
import OpenAI from 'openai';

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

  test('tokenProvider mode sets mode correctly', () => {
    const provider = vi.fn().mockResolvedValue('sk-token');
    const client = configureClient({ tokenProvider: provider });
    expect(client).toBeInstanceOf(NeuroClient);
    expect(client.mode).toBe('tokenProvider');
    expect(isConfigured()).toBe(true);
  });

  test('configureClient called twice: second call wins', () => {
    configureClient({ apiKey: 'sk-first' });
    expect(getClient().mode).toBe('apiKey');
    configureClient({ proxyUrl: 'https://proxy.test/' });
    expect(getClient().mode).toBe('proxyUrl');
  });

  test('baseURL is accepted without error', () => {
    const client = configureClient({ apiKey: 'sk-test', baseURL: 'https://custom.endpoint/v1' });
    expect(client.mode).toBe('apiKey');
  });
});

describe('tokenProvider dispatch', () => {
  test('happy path: provider called, OpenAI constructed with returned token', async () => {
    const token = 'sk-from-provider';
    const provider = vi.fn().mockResolvedValue(token);

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '"hello"' } }],
    });

    const client = new NeuroClient({ tokenProvider: provider });
    const result = await client.executeFunction({
      functionId: 'neuro.json.parse',
      prompt: 'parse',
      systemPrompt: 'sys',
      args: {},
    });

    expect(provider).toHaveBeenCalledOnce();
    // OpenAI constructor should have been called with the token from the provider
    expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: token }));
    expect(result).toBe('hello');
  });

  test('provider throws: surfaces as NeuroClientError with prefix', async () => {
    const provider = vi.fn().mockRejectedValue(new Error('network down'));
    const client = new NeuroClient({ tokenProvider: provider });

    await expect(
      client.executeFunction({
        functionId: 'neuro.json.parse',
        prompt: 'parse',
        systemPrompt: 'sys',
        args: {},
      }),
    ).rejects.toThrow(/tokenProvider threw: network down/);
  });

  test('provider returns empty string: throws NeuroClientError', async () => {
    const provider = vi.fn().mockResolvedValue('');
    const client = new NeuroClient({ tokenProvider: provider });

    await expect(
      client.executeFunction({
        functionId: 'neuro.json.parse',
        prompt: 'parse',
        systemPrompt: 'sys',
        args: {},
      }),
    ).rejects.toThrow(/tokenProvider must return a non-empty string token/);
  });
});

describe('proxyUrl fetchOptions', () => {
  test('custom headers are forwarded to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: 42 }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new NeuroClient({
      proxyUrl: 'https://proxy.test/',
      fetchOptions: { headers: { 'x-custom': 'header-value' } },
    });
    await client.executeFunction({
      functionId: 'neuro.math.abs',
      prompt: 'abs',
      systemPrompt: 'sys',
      args: { x: -1 },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['x-custom']).toBe('header-value');
  });

  test('AbortSignal is forwarded to fetch', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    const client = new NeuroClient({
      proxyUrl: 'https://proxy.test/',
      fetchOptions: { signal: controller.signal },
    });

    await expect(
      client.executeFunction({
        functionId: 'neuro.math.abs',
        prompt: 'abs',
        systemPrompt: 'sys',
        args: { x: -1 },
      }),
    ).rejects.toThrow(NeuroClientError);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});
