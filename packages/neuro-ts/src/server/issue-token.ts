/**
 * `neuro-ts/issue-token` - minimal example of an ephemeral-token endpoint
 * that the browser SDK can plug into via `configureClient({ tokenProvider })`.
 *
 * The default implementation **just returns the long-lived API key**, which
 * is a development-only stub. Real deployments should swap this for one of:
 *   - an OpenAI session-key API (when available),
 *   - a JWT-style scoped credential signed by your backend that your proxy
 *     verifies, or
 *   - a temporary cloud IAM credential.
 *
 * The shape returned matches the SDK's expectation: `{ token: string, expiresAt?: number }`.
 */
import type { TokenProvider } from '../types';

export interface IssueTokenConfig {
  apiKey: string;
  /** Token TTL in seconds. Default 300. */
  ttlSeconds?: number;
  /** Optional auth gate. Throws to deny. */
  authenticate?: (req: Request) => Promise<void> | void;
}

export function createTokenIssuer(config: IssueTokenConfig): (req: Request) => Promise<Response> {
  const ttl = config.ttlSeconds ?? 300;
  return async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'GET or POST only' }), {
        status: 405,
      });
    }
    if (config.authenticate) {
      try {
        await config.authenticate(req);
      } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message ?? 'unauthorised' }), {
          status: 401,
        });
      }
    }
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;
    return new Response(JSON.stringify({ token: config.apiKey, expiresAt }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

/**
 * Convenience helper: build a {@link TokenProvider} that calls a token
 * endpoint and caches the result until `expiresAt - 30s`.
 */
export function tokenProviderFromUrl(url: string, init?: RequestInit): TokenProvider {
  let cached: { token: string; expiresAt: number } | null = null;
  return async () => {
    const now = Math.floor(Date.now() / 1000);
    if (cached && cached.expiresAt - 30 > now) return cached.token;
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(`Token endpoint returned ${r.status}`);
    const data = (await r.json()) as { token: string; expiresAt?: number };
    if (!data?.token) throw new Error('Token endpoint did not return { token }');
    cached = { token: data.token, expiresAt: data.expiresAt ?? now + 60 };
    return cached.token;
  };
}
