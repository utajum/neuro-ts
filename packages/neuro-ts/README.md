<p align="center">
  <img src="https://raw.githubusercontent.com/utajum/neuro-ts/master/assets/logo-light.png" alt="neuro-ts" width="360">
</p>

<p align="center">
  <b>AI-augmented JavaScript built-ins. Every method gets a <code>prompt</code> parameter.</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/neuro-ts"><img src="https://img.shields.io/npm/v/neuro-ts?color=%23a83904&labelColor=%23fbf6ec&label=npm" alt="npm"></a>
  <a href="https://www.npmjs.com/package/neuro-ts"><img src="https://img.shields.io/npm/dm/neuro-ts?color=%23a83904&labelColor=%23fbf6ec&label=downloads" alt="downloads"></a>
  <a href="https://github.com/utajum/neuro-ts/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-%23a83904?labelColor=%23fbf6ec" alt="MIT"></a>
  <a href="https://neuro-ts.dev"><img src="https://img.shields.io/badge/docs-neuro--ts.dev-%23a83904?labelColor=%23fbf6ec" alt="docs"></a>
</p>

<p align="center">
  <a href="https://neuro-ts.dev/guides/quick-start/">Quick start</a>
  &nbsp;&middot;&nbsp;
  <a href="https://neuro-ts.dev/concepts/catalog/">673 method catalog</a>
  &nbsp;&middot;&nbsp;
  <a href="https://neuro-ts.dev/guides/browser-safety/">Browser safety</a>
  &nbsp;&middot;&nbsp;
  <a href="https://neuro-ts.dev/guides/custom-models/">Custom models</a>
</p>

---

`neuro-ts` wraps every standard JavaScript built-in - `Math`, `Array`, `String`, `Object`, `Date`, `JSON`, `Map`, `Set`, `Promise`, `RegExp`, `BigInt`, `Atomics`, every TypedArray, and the global functions - as a typed `neuro.<group>.<method>` wrapper. Pass the original arguments under their TypeScript-lib names. Add a `prompt` string to route the call through an LLM. Omit it to fall through to the native built-in with zero overhead.

```ts
import { configureClient, neuro } from 'neuro-ts';

configureClient({ apiKey: process.env.OPENAI_API_KEY });

// native fallback - no LLM, no network
await neuro.array.map({ array: [1, 2, 3], callbackfn: (n) => n * 2 });
// [2, 4, 6]

// LLM path - same method, one extra field
await neuro.array.map({
  array: [1, 2, 3],
  callbackfn: (n) => n,
  prompt: 'double each value',
});
// [2, 4, 6]

await neuro.math.random({ prompt: 'a number that feels lucky' });
// 0.777

await neuro.json.stringify({
  value: { ok: true },
  space: 2,
  prompt: 'minify instead of pretty-print',
});
// '{"ok":true}'
```

## Install

```bash
npm install neuro-ts
pnpm add neuro-ts
yarn add neuro-ts
bun add neuro-ts
```

**CDN (no build tool)**

```html
<script src="https://unpkg.com/neuro-ts/dist/neuro-ts.iife.js"></script>
<script>
  NeuroTS.configureClient({
    tokenProvider: () =>
      fetch('/api/neuro-token')
        .then((r) => r.json())
        .then((j) => j.token),
  });
  NeuroTS.neuro.array
    .map({
      array: ['hello', 'world'],
      callbackfn: (s) => s,
      prompt: 'uppercase each',
    })
    .then(console.log); // ['HELLO', 'WORLD']
</script>
```

## Init modes

| Environment                 | Config                                                    |
| --------------------------- | --------------------------------------------------------- |
| Node / server               | `configureClient({ apiKey: process.env.OPENAI_API_KEY })` |
| Browser via proxy           | `configureClient({ proxyUrl: '/api/neuro' })`             |
| Browser via ephemeral token | `configureClient({ tokenProvider: async () => ... })`     |

`apiKey` is **rejected at runtime in browsers** - `NeuroBrowserApiKeyError` is thrown unless you pass `dangerouslyAllowBrowser: true`. See the [browser safety guide](https://neuro-ts.dev/guides/browser-safety/).

## What's wrapped

32 built-in groups, 673 methods:

```
Array              ArrayBuffer        Atomics            BigInt
BigInt64Array      BigUint64Array     DataView           Date
Error              Float32Array       Float64Array       Int8Array
Int16Array         Int32Array         Iterator (ES2025)  JSON
Map                Math               Number             Object
Promise            RegExp             Set
String             Symbol             Uint8Array         Uint8ClampedArray
Uint16Array        Uint32Array        WeakMap            WeakSet


Globals: parseInt, parseFloat, isNaN, isFinite, encodeURI, decodeURI,
         encodeURIComponent, decodeURIComponent, structuredClone, atob, btoa
```

Every method ships with a frozen, auditable system prompt generated from the TypeScript lib definitions:

```ts
import prompts from 'neuro-ts/prompts';

prompts['neuro.array.map'].systemPrompt; // the exact prompt sent to the LLM
prompts['neuro.array.map'].curated.example; // a curated usage example
```

Full catalog: [neuro-ts.dev/concepts/catalog](https://neuro-ts.dev/concepts/catalog/)

## Server helpers

The same install ships two server-only subpath exports for the
`proxyUrl` and `tokenProvider` init modes. Both are Web-standard
`(req: Request) => Promise<Response>` handlers - drop them into Cloudflare
Workers, Next.js App Router, Fastify, Express, Bun, Deno, or Vercel Edge.

```ts
// server/proxy endpoint
import { createNeuroProxy } from 'neuro-ts/proxy';

export default {
  fetch: createNeuroProxy({
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'gpt-4o',
    allowedFunctionIds: ['Array.prototype.map', 'JSON.parse', 'Math.random'],
  }),
};

// server/token-issuer endpoint
import { createTokenIssuer } from 'neuro-ts/issue-token';

export default {
  fetch: createTokenIssuer({
    apiKey: process.env.OPENAI_API_KEY!,
    ttlSeconds: 300,
  }),
};

// browser
import { configureClient } from 'neuro-ts';
import { tokenProviderFromUrl } from 'neuro-ts/issue-token';

configureClient({ tokenProvider: tokenProviderFromUrl('/api/neuro-token') });
```

Full deployment guide: [neuro-ts.dev/guides/deploy-proxy](https://neuro-ts.dev/guides/deploy-proxy/).

## Prompt on broken input

The LLM path shines where the native built-in would just throw. Broken JSON
that a human could obviously read - the model can too:

```ts
const broken = `{
  name: "Alice",           // unquoted key
  "age": 30,
  "scores": [98, 87, 102,  // trailing comma
  "joined": '2021-03-15',  // single-quoted value, missing closing bracket
}`;

// Native JSON.parse throws SyntaxError immediately.
// neuro-ts forwards the wreckage to the LLM with instructions.
const user = await neuro.json.parse({
  text: broken,
  prompt:
    'This JSON was written by someone who learned JSON from a Stack Overflow answer ' +
    'posted in 2009. Fix every syntax error silently and return a valid parsed object. ' +
    'Do not lecture me about the errors. I know. We all know.',
});

console.log(user);
// { name: 'Alice', age: 30, scores: [98, 87, 102], joined: '2021-03-15' }
```

The `prompt` is the diff between a crash and a result.

## Custom models and endpoints

```ts
// Change the default model globally
configureClient({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
});

// Point at any OpenAI-compatible endpoint (Ollama, Azure, Groq, ...)
configureClient({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-70b-versatile',
});
```

See [custom models guide](https://neuro-ts.dev/guides/custom-models/).

## Naming

`neuro.<group>.<method>` - group names strip the `Constructor` suffix from TypeScript's lib, so static and instance methods of the same built-in share a namespace:

```ts
neuro.array.map      neuro.array.from       neuro.array.of
neuro.math.random    neuro.math.floor
neuro.object.keys    neuro.object.assign
neuro.json.stringify neuro.json.parse
neuro.promise.all    neuro.promise.race
neuro.parseInt       neuro.encodeURI
```

## License

MIT &nbsp;&middot;&nbsp; [neuro-ts.dev](https://neuro-ts.dev) &nbsp;&middot;&nbsp; [GitHub](https://github.com/utajum/neuro-ts)
