# neuro-js

> AI-augmented JavaScript built-ins. Every method gets a `prompt` parameter.

`neuro-js` mirrors every standard JavaScript built-in &mdash; `Math`,
`Array`, `String`, `Object`, `Date`, `JSON`, `Map`, `Set`, `Promise`,
`RegExp`, `BigInt`, `Atomics`, every TypedArray, and the global functions
&mdash; and exposes each method as a typed `neuro<Group><Method>` wrapper
that takes a natural-language `prompt` parameter. The runtime calls
OpenAI (or any OpenAI-compatible endpoint), feeds it the original method's
signature, and returns a typed `Promise<R>`.

```ts
import {
  configureClient,
  neuroArrayMap,
  neuroMathRandom,
  neuroJsonStringify,
} from 'neuro-js';

configureClient({ apiKey: process.env.OPENAI_API_KEY });

await neuroMathRandom('a number between 0.4 and 0.5');
// 0.471

await neuroArrayMap('double each value', [1, 2, 3]);
// [2, 4, 6]

await neuroJsonStringify('format with two-space indent', { hello: 'world' });
// '{\n  "hello": "world"\n}'
```

## Install

```bash
npm install neuro-js
pnpm add neuro-js
yarn add neuro-js
bun add neuro-js
```

CDN:

```html
<script src="https://unpkg.com/neuro-js/dist/neuro-js.iife.js"></script>
<script>
  NeuroJS.configureClient({
    tokenProvider: () => fetch('/api/token').then((r) => r.text()),
  });
  NeuroJS.neuroArrayMap('uppercase each', ['a', 'b']).then(console.log);
</script>
```

## Three init modes

```ts
// Node.js - long-lived API key OK
configureClient({ apiKey: process.env.OPENAI_API_KEY });

// Browser via your proxy
configureClient({ proxyUrl: '/api/neuro' });

// Browser via short-lived OpenAI-compatible token
configureClient({
  tokenProvider: async () =>
    (await fetch('/api/token')).json().then((j) => j.token),
});
```

`apiKey` is **rejected at runtime in browsers** (throws `NeuroBrowserApiKeyError`)
unless you pass `dangerouslyAllowBrowser: true`. See
[neuro-js.dev/guides/browser-safety](https://neuro-js.dev/guides/browser-safety/).

## Why named exports, not prototype mutation

Earlier prototypes attached methods to `Array.prototype` / `Math` / `Object`.
That broke many runtimes (Node servers, frameworks, devtools) that inspect
prototypes for instrumentation or integrity. `neuro-js` ships only named
exports - safe to import anywhere, easy to tree-shake.

## Naming

`neuro<Group><Method>`. Group strips the `Constructor` suffix from
TypeScript's lib, so static and prototype methods of the same built-in
share a namespace:

```ts
(neuroArrayMap, neuroArrayFrom, neuroArrayOf);
(neuroMathRandom, neuroMathFloor);
(neuroObjectKeys, neuroObjectAssign);
(neuroJsonStringify, neuroJsonParse);
(neuroPromiseAll, neuroPromiseRace);
(neuroUint8ArrayFilter, neuroUint8ArraySet);
(neuroParseInt, neuroEncodeURI);
```

## Auditing the prompts

Every wrapper has a frozen system prompt baked at build time:

```ts
import prompts from 'neuro-js/prompts';
console.log(prompts.neuroArrayMap.systemPrompt);
```

The full catalog is rendered at
[neuro-js.dev/concepts/catalog](https://neuro-js.dev/concepts/catalog/).

## License

MIT
