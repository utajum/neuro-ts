/**
 * Hint describing one parameter of the original JS method, sent to the LLM
 * so it can match the function's expected output shape.
 */
export interface SignatureHint {
  name: string;
  type: string;
}

/**
 * User-supplied async function returning a short-lived OpenAI-compatible
 * API key. Recommended for browser environments - never ship long-lived
 * secrets to the client.
 */
export type TokenProvider = () => Promise<string> | string;

/** Custom HTTP options forwarded to fetch() when using `proxyUrl` mode. */
export interface CustomFetchOptions {
  headers?: Record<string, string>;
  /** AbortSignal forwarded to fetch */
  signal?: AbortSignal;
}

export interface NeuroClientOptions {
  /**
   * OpenAI API key. **Node.js only.** Throws in browser environments to
   * prevent leaking secrets. In the browser use `tokenProvider` or `proxyUrl`.
   */
  apiKey?: string;

  /**
   * URL of a backend you control that proxies requests to OpenAI. The SDK
   * POSTs `{ functionId, prompt, args, instanceData, signatureHint, model }`
   * and expects the LLM result back as JSON.
   */
  proxyUrl?: string;

  /**
   * Async function returning a short-lived (ephemeral) API key. Called once
   * per request; cache + refresh in your implementation as needed.
   * Browser-safe alternative to `apiKey`.
   */
  tokenProvider?: TokenProvider;

  /** Default chat model. Overridable per-call. */
  model?: string;

  /** Optional custom base URL for OpenAI-compatible endpoints. */
  baseURL?: string;

  /** Sampling temperature (default 0.2 - deterministic simulation). */
  temperature?: number;

  /** Max output tokens (default 1024). */
  maxTokens?: number;

  /** Extra fetch options for `proxyUrl` mode. */
  fetchOptions?: CustomFetchOptions;

  /** When true, allows `apiKey` use in the browser. ⚠️ DANGEROUS. */
  dangerouslyAllowBrowser?: boolean;
}

export interface ExecuteFunctionInput {
  /** Fully qualified id of the original built-in (e.g. `Array.prototype.map`). */
  functionId: string;
  /** Natural-language steering string supplied by the application. */
  prompt: string;
  /**
   * Receiver / `this` value for instance methods. `null` for static methods.
   * Distinct from {@link args} so the proxy contract stays explicit.
   */
  instance: unknown;
  /**
   * Named arguments map. Keys correspond to the parameter names taken from
   * the original TS lib signature. Variadic items live under their declared
   * rest-parameter name (e.g. `items`, `values`, `codes`).
   */
  args: Record<string, unknown>;
  signatureHint: SignatureHint[];
  systemPrompt: string;
  model?: string;
}
