# neuro-js-proxy

Reference proxy + ephemeral-token issuer for [`neuro-js`](https://neuro-js.dev).

## Why

Browsers can't safely hold long-lived OpenAI API keys. `neuro-js` supports
two browser-safe init modes - `proxyUrl` and `tokenProvider`. This package
gives you a drop-in implementation of both.

The handler is a Web-standard `(req: Request) => Promise<Response>`, so it
runs unchanged on Cloudflare Workers, Deno Deploy, Bun, Vercel Edge, Node
20+ via `node:http`, and Astro/Next/SvelteKit endpoints.

## Proxy

```ts
import { createNeuroProxy } from 'neuro-js-proxy/proxy';

const handler = createNeuroProxy({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: 'gpt-4o-mini',
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
} from 'neuro-js-proxy/issue-token';

// server
export default {
  fetch: createTokenIssuer({
    apiKey: process.env.OPENAI_API_KEY!,
    ttlSeconds: 300,
  }),
};

// browser
import { configureClient } from 'neuro-js';
configureClient({ tokenProvider: tokenProviderFromUrl('/api/neuro-token') });
```

## Limits

- Default `instanceData` cap: 16 KiB. Override via `maxInstanceBytes`.
- Default temperature: 0.2 (overridable per `createNeuroProxy({ temperature })`).
- The included `createTokenIssuer` returns the configured key as-is. Swap
  it for a real scoped-credential path before going to production.
