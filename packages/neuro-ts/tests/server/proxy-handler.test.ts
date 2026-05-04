/* eslint-disable import/no-relative-packages */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the openai module for the duration of the file. The handler imports
// OpenAI from 'openai' and constructs it once when createNeuroProxy() is
// called. We intercept the constructor so chat.completions.create can be
// stubbed per-test.
const mockCreate = vi.fn();
vi.mock('openai', () => {
  const MockOpenAI = vi.fn(function (this: Record<string, unknown>) {
    this.chat = { completions: { create: mockCreate } };
  });
  return { default: MockOpenAI };
});

// Build the handler via the dist entry, matching the existing test pattern
// (tests/proxy.test.ts also imports from ../dist/index.js).
import { createNeuroProxy } from '../../dist/proxy.js';

const VALID_BODY = {
  functionId: 'Array.prototype.map',
  prompt: 'double each',
  systemPrompt: 'You are simulating Array.prototype.map.',
  instanceData: '[1,2,3]',
  args: { callbackfn: undefined },
  signatureHint: [{ name: 'callbackfn', type: '(value: T) => U' }],
  model: 'gpt-4o',
};

function makeRequest(body: unknown, init?: RequestInit): Request {
  return new Request('https://proxy.test/api/neuro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createNeuroProxy: method/body validation', () => {
  test('returns 405 on GET', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://proxy.test/', { method: 'GET' }));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ error: 'POST only' });
  });

  test('returns 405 on PUT', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(new Request('https://proxy.test/', { method: 'PUT' }));
    expect(res.status).toBe(405);
  });

  test('returns 400 on invalid JSON body', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest('{not json'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid JSON body' });
  });

  test('returns 400 when functionId missing', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const { functionId, ...rest } = VALID_BODY;
    void functionId;
    const res = await handler(makeRequest(rest));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/functionId/);
  });

  test('returns 400 when prompt missing', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const { prompt, ...rest } = VALID_BODY;
    void prompt;
    const res = await handler(makeRequest(rest));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/prompt/);
  });

  test('returns 400 when systemPrompt missing', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const { systemPrompt, ...rest } = VALID_BODY;
    void systemPrompt;
    const res = await handler(makeRequest(rest));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/systemPrompt/);
  });
});

describe('createNeuroProxy: authentication', () => {
  test('returns 401 when authenticate throws', async () => {
    const handler = createNeuroProxy({
      apiKey: 'sk-test',
      authenticate: () => {
        throw new Error('forbidden');
      },
    });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });

  test('passes through when authenticate resolves', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '[2,4,6]' } }],
    });
    const auth = vi.fn();
    const handler = createNeuroProxy({ apiKey: 'sk-test', authenticate: auth });
    const res = await handler(makeRequest(VALID_BODY));
    expect(auth).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('createNeuroProxy: allowedFunctionIds', () => {
  test('returns 403 when functionId not in allowlist', async () => {
    const handler = createNeuroProxy({
      apiKey: 'sk-test',
      allowedFunctionIds: ['Math.random'],
    });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/Array\.prototype\.map/);
  });

  test('passes through when functionId is in allowlist', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '[2,4,6]' } }],
    });
    const handler = createNeuroProxy({
      apiKey: 'sk-test',
      allowedFunctionIds: ['Array.prototype.map'],
    });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  test('open by default when allowedFunctionIds is undefined', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '[2,4,6]' } }],
    });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest({ ...VALID_BODY, functionId: 'literally.anything' }));
    expect(res.status).toBe(200);
  });
});

describe('createNeuroProxy: instanceData size cap', () => {
  test('returns 413 when instanceData exceeds maxInstanceBytes', async () => {
    const handler = createNeuroProxy({ apiKey: 'sk-test', maxInstanceBytes: 100 });
    const big = { ...VALID_BODY, instanceData: 'x'.repeat(200) };
    const res = await handler(makeRequest(big));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/100 bytes/);
  });

  test('default cap is 16 KiB', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '[]' } }],
    });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const just_under = { ...VALID_BODY, instanceData: 'x'.repeat(16 * 1024) };
    const res = await handler(makeRequest(just_under));
    expect(res.status).toBe(200);

    const just_over = { ...VALID_BODY, instanceData: 'x'.repeat(16 * 1024 + 1) };
    const res2 = await handler(makeRequest(just_over));
    expect(res2.status).toBe(413);
  });
});

describe('createNeuroProxy: happy path + response shapes', () => {
  test('returns 200 with parsed JSON on a JSON-shaped completion', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '[2,4,6]' } }],
    });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: [2, 4, 6] });
  });

  test('returns 200 with raw string on a prose completion (tryParseJson fallback)', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'I cannot do that, but here is some prose.' } }],
    });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      result: 'I cannot do that, but here is some prose.',
    });
  });

  test('returns 200 with empty string when completion has no content', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    // Empty string is not JSON, so tryParseJson returns it verbatim.
    expect(await res.json()).toEqual({ result: '' });
  });
});

describe('createNeuroProxy: model + temperature config', () => {
  test('forwards body.model when present', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test', defaultModel: 'gpt-4o' });
    await handler(makeRequest({ ...VALID_BODY, model: 'gpt-4o-mini' }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  });

  test('falls back to defaultModel when body.model is empty string', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test', defaultModel: 'gpt-4o' });
    await handler(makeRequest({ ...VALID_BODY, model: '' }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }));
  });

  test('falls back to gpt-4o when neither body.model nor defaultModel set', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    await handler(makeRequest({ ...VALID_BODY, model: '' }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }));
  });

  test('config.temperature overrides per-request value (no per-request field exists)', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test', temperature: 0 });
    await handler(makeRequest(VALID_BODY));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0 }));
  });

  test('default temperature is 0.2 when not configured', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    await handler(makeRequest(VALID_BODY));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.2 }));
  });
});

describe('createNeuroProxy: upstream errors', () => {
  test('returns 502 on OpenAI throw with the original message', async () => {
    mockCreate.mockRejectedValue(new Error('rate_limit_exceeded'));
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    const res = await handler(makeRequest(VALID_BODY));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/rate_limit_exceeded/);
  });
});

describe('createNeuroProxy: user message construction', () => {
  test('user message contains all four sections in order', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '[]' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    await handler(makeRequest(VALID_BODY));
    const call = mockCreate.mock.calls[0][0];
    const userMsg = call.messages[1].content as string;
    expect(userMsg).toMatch(/## User intent\ndouble each/);
    expect(userMsg).toMatch(/## Function\n`Array\.prototype\.map`/);
    expect(userMsg).toMatch(/## Instance \/ `this` value\n\[1,2,3\]/);
    expect(userMsg).toMatch(/## Arguments/);
  });

  test('null instanceData renders as the literal "null"', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '0.5' } }] });
    const handler = createNeuroProxy({ apiKey: 'sk-test' });
    await handler(
      makeRequest({
        ...VALID_BODY,
        functionId: 'Math.random',
        instanceData: null,
      }),
    );
    const userMsg = mockCreate.mock.calls[0][0].messages[1].content as string;
    expect(userMsg).toMatch(/## Instance \/ `this` value\nnull/);
  });
});
