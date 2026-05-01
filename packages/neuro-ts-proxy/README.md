<p align="center">
  <img src="https://raw.githubusercontent.com/utajum/neuro-ts/master/assets/logo-light.png" alt="neuro-ts" width="320">
</p>

<p align="center">
  <a href="https://neuro-ts.dev">neuro-ts.dev</a> &nbsp;&middot;&nbsp;
  <a href="https://neuro-ts.dev/guides/proxy-contract/">Proxy contract docs</a> &nbsp;&middot;&nbsp;
  <a href="https://neuro-ts.dev/guides/browser-safety/">Browser safety guide</a>
</p>

Reference proxy + ephemeral-token issuer for [`neuro-ts`](https://neuro-ts.dev).

## Why

Browsers can't safely hold long-lived OpenAI API keys. `neuro-ts` supports
two browser-safe init modes - `proxyUrl` and `tokenProvider`. This package
gives you a drop-in implementation of both.

The handler is a Web-standard `(req: Request) => Promise<Response>`, so it
runs unchanged on Cloudflare Workers, Deno Deploy, Bun, Vercel Edge, Node
20+ via `node:http`, and Astro/Next/SvelteKit endpoints.

## Proxy

```ts
import { createNeuroProxy } from 'neuro-ts-proxy/proxy';

const handler = createNeuroProxy({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: 'gpt-4o',
  authenticate: async (req) => {
    if (req.headers.get('x-app-token') !== process.env.APP_TOKEN) {
      throw new Error('forbidden');
    }
  },
  // Optional: scope the public surface
  allowedFunctionIds: ['Array.prototype.map', 'Math.random', 'JSON.stringify'],
});

// Cloudflare Worker:
export default { fetch: handler };
```

## Token issuer

```ts
import {
  createTokenIssuer,
  tokenProviderFromUrl,
} from 'neuro-ts-proxy/issue-token';

// server
export default {
  fetch: createTokenIssuer({
    apiKey: process.env.OPENAI_API_KEY!,
    ttlSeconds: 300,
  }),
};

// browser
import { configureClient } from 'neuro-ts';
configureClient({ tokenProvider: tokenProviderFromUrl('/api/neuro-token') });
```

## Limits

- Default `instanceData` cap: 16 KiB. Override via `maxInstanceBytes`.
- Default temperature: 0.2 (overridable per `createNeuroProxy({ temperature })`).
- The included `createTokenIssuer` returns the configured key as-is. Swap
  it for a real scoped-credential path before going to production.
