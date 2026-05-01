import OpenAI from 'openai';
import { NeuroBrowserApiKeyError, NeuroClientError } from './errors';
import { isBrowserEnv } from './env';
import { serializeForPrompt } from './serialize';
import { parseLLMResult } from './parse-result';
import type { ExecuteFunctionInput, NeuroClientOptions, TokenProvider } from './types';

const DEFAULT_MODEL = 'gpt-4o-mini';

type Mode = 'apiKey' | 'tokenProvider' | 'proxyUrl';

export class NeuroClient {
  readonly mode: Mode;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  private readonly options: NeuroClientOptions;
  private openai: OpenAI | null = null;
  private readonly tokenProvider: TokenProvider | null = null;
  private readonly baseURL: string | undefined;

  constructor(options: NeuroClientOptions) {
    if (!options || typeof options !== 'object') {
      throw new NeuroClientError('configureClient() requires an options object.');
    }
    const { apiKey, proxyUrl, tokenProvider } = options;
    const provided = [apiKey, proxyUrl, tokenProvider].filter(Boolean).length;

    if (provided === 0) {
      throw new NeuroClientError('Provide one of: `apiKey`, `proxyUrl`, or `tokenProvider`.');
    }
    if (provided > 1) {
      throw new NeuroClientError(
        'Provide exactly one of: `apiKey`, `proxyUrl`, or `tokenProvider`.',
      );
    }

    this.options = options;
    this.model = options.model ?? DEFAULT_MODEL;
    this.temperature = options.temperature ?? 0.2;
    this.maxTokens = options.maxTokens ?? 1024;
    this.baseURL = options.baseURL;

    if (apiKey) {
      if (isBrowserEnv() && !options.dangerouslyAllowBrowser) {
        throw new NeuroBrowserApiKeyError();
      }
      this.mode = 'apiKey';
      this.openai = new OpenAI({
        apiKey,
        baseURL: this.baseURL,
        dangerouslyAllowBrowser: options.dangerouslyAllowBrowser,
      });
    } else if (tokenProvider) {
      this.mode = 'tokenProvider';
      this.tokenProvider = tokenProvider;
    } else {
      // proxyUrl
      try {
        // eslint-disable-next-line no-new
        new URL(proxyUrl as string);
      } catch {
        throw new NeuroClientError(`Invalid \`proxyUrl\`: ${proxyUrl}`);
      }
      this.mode = 'proxyUrl';
    }
  }

  /** Execute a wrapped JS method via the LLM. */
  async executeFunction(input: ExecuteFunctionInput): Promise<unknown> {
    const model = input.model ?? this.model;
    const userMessage = this.buildUserMessage(input);

    if (this.mode === 'proxyUrl') {
      return this.callProxy(input, model);
    }

    const openai =
      this.mode === 'apiKey' ? (this.openai as OpenAI) : await this.openaiFromTokenProvider();

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? null;
      return parseLLMResult(text);
    } catch (err) {
      throw new NeuroClientError(
        `OpenAI request failed for ${input.functionId}: ${(err as Error).message}`,
        err,
      );
    }
  }

  private async openaiFromTokenProvider(): Promise<OpenAI> {
    const tp = this.tokenProvider;
    if (!tp) throw new NeuroClientError('No tokenProvider configured.');
    let token: string;
    try {
      token = await tp();
    } catch (err) {
      throw new NeuroClientError(`tokenProvider threw: ${(err as Error).message}`, err);
    }
    if (!token || typeof token !== 'string') {
      throw new NeuroClientError('tokenProvider must return a non-empty string token.');
    }
    return new OpenAI({
      apiKey: token,
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: true,
    });
  }

  private async callProxy(input: ExecuteFunctionInput, model: string): Promise<unknown> {
    const url = this.options.proxyUrl as string;
    const fetchOpts = this.options.fetchOptions ?? {};
    // The proxy contract carries `args` as a named-keys record so the
    // server can render the same key=value table the SDK uses locally.
    // We also expose the receiver via `instanceData` (legacy field name)
    // so existing proxies continue to work.
    const body = JSON.stringify({
      functionId: input.functionId,
      prompt: input.prompt,
      args: input.args,
      instanceData: serializeForPrompt(input.instance),
      signatureHint: input.signatureHint,
      systemPrompt: input.systemPrompt,
      model,
    });
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(fetchOpts.headers ?? {}),
        },
        body,
        signal: fetchOpts.signal,
      });
    } catch (err) {
      throw new NeuroClientError(
        `Proxy fetch failed for ${input.functionId}: ${(err as Error).message}`,
        err,
      );
    }
    if (!res.ok) {
      let detail = '';
      try {
        detail = await res.text();
      } catch {
        /* noop */
      }
      throw new NeuroClientError(
        `Proxy ${url} responded ${res.status} ${res.statusText}: ${detail}`,
      );
    }
    const ctype = res.headers.get('content-type') ?? '';
    if (ctype.includes('application/json')) {
      const data = (await res.json()) as { result?: unknown; text?: unknown } | unknown;
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if ('result' in obj) return obj.result;
        if ('text' in obj) return parseLLMResult(String(obj.text));
      }
      return data;
    }
    return parseLLMResult(await res.text());
  }

  private buildUserMessage(input: ExecuteFunctionInput): string {
    // Render named arguments as `name = <serialised value>` lines so the
    // model sees the same structure the SDK and proxy contract expose.
    // Each value is run through `serializeForPrompt` so Date / Map / Set
    // / TypedArray / BigInt all survive the round trip.
    const argLines = Object.entries(input.args ?? {}).map(
      ([name, value]) => `- ${name} = ${serializeForPrompt(value)}`,
    );
    const argsBlock = argLines.length > 0 ? argLines.join('\n') : '(none)';
    return [
      `## User intent`,
      input.prompt,
      ``,
      `## Function`,
      `\`${input.functionId}\``,
      ``,
      `## Receiver / \`this\` value`,
      serializeForPrompt(input.instance),
      ``,
      `## Named arguments`,
      argsBlock,
    ].join('\n');
  }
}
