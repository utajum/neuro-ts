/**
 * `neuro-ts/proxy` - a Web-standard fetch handler that fulfils the
 * `proxyUrl` contract documented at https://neuro-ts.dev/guides/proxy-contract/.
 *
 * Drop this into any environment that speaks the Web-standard
 * `(req: Request) => Response` shape: Cloudflare Workers, Deno, Bun,
 * Node ≥18 with `node:http` adapters, Vercel Edge, Astro endpoints, etc.
 */
import OpenAI from 'openai';

export interface NeuroProxyConfig {
  /** OpenAI / OpenAI-compatible API key. Server-side only. */
  apiKey: string;
  /** Optional baseURL for OpenAI-compatible endpoints. */
  baseURL?: string;
  /** Default model if the request didn't specify one. */
  defaultModel?: string;
  /** Optional fixed temperature (overrides any per-request value). */
  temperature?: number;
  /** Hook to authenticate the caller before the request reaches OpenAI. */
  authenticate?: (req: Request) => Promise<void> | void;
  /**
   * Optional allowlist of `functionId`s. If provided, anything outside the
   * list is rejected with 403. Useful to scope a public endpoint.
   */
  allowedFunctionIds?: string[];
  /** Maximum allowed `instanceData` size (bytes). Defaults to 16 KiB. */
  maxInstanceBytes?: number;
}

export interface NeuroProxyRequest {
  functionId: string;
  prompt: string;
  instanceData: string | null;
  args: unknown[];
  signatureHint: { name: string; type: string }[];
  systemPrompt: string;
  model: string;
}

const TEXT_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function bad(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: TEXT_HEADERS,
  });
}

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export function createNeuroProxy(config: NeuroProxyConfig): (req: Request) => Promise<Response> {
  const openai = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
  const allowed = config.allowedFunctionIds ? new Set(config.allowedFunctionIds) : null;
  const maxInstance = config.maxInstanceBytes ?? 16 * 1024;

  return async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') return bad(405, 'POST only');

    if (config.authenticate) {
      try {
        await config.authenticate(req);
      } catch (err) {
        return bad(401, (err as Error).message || 'unauthorised');
      }
    }

    let body: NeuroProxyRequest;
    try {
      body = (await req.json()) as NeuroProxyRequest;
    } catch {
      return bad(400, 'invalid JSON body');
    }
    if (!body || typeof body !== 'object') return bad(400, 'invalid body');
    if (typeof body.functionId !== 'string') return bad(400, '`functionId` required');
    if (typeof body.prompt !== 'string') return bad(400, '`prompt` required');
    if (typeof body.systemPrompt !== 'string') return bad(400, '`systemPrompt` required');
    if (allowed && !allowed.has(body.functionId))
      return bad(403, `functionId not allowed: ${body.functionId}`);
    if (body.instanceData != null && body.instanceData.length > maxInstance) {
      return bad(413, `instanceData exceeds ${maxInstance} bytes`);
    }

    const userMessage = [
      `## User intent`,
      body.prompt,
      ``,
      `## Function`,
      `\`${body.functionId}\``,
      ``,
      `## Instance / \`this\` value`,
      body.instanceData ?? 'null',
      ``,
      `## Arguments`,
      JSON.stringify(body.args ?? []),
    ].join('\n');

    try {
      const completion = await openai.chat.completions.create({
        model: body.model || config.defaultModel || 'gpt-4o',
        temperature: config.temperature ?? 0.2,
        messages: [
          { role: 'system', content: body.systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? '';
      return new Response(JSON.stringify({ result: tryParseJson(text) }), {
        status: 200,
        headers: TEXT_HEADERS,
      });
    } catch (err) {
      return bad(502, `upstream error: ${(err as Error).message}`);
    }
  };
}
