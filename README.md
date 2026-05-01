<p align="center">
  <img src="assets/logo-light.png" alt="neuro-ts" width="320">
</p>

<p align="center">
  <a href="https://github.com/utajum/neuro-ts/actions/workflows/ci.yml"><img src="https://github.com/utajum/neuro-ts/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/neuro-ts"><img src="https://img.shields.io/npm/v/neuro-ts?color=%23a83904&labelColor=%23fbf6ec&label=npm" alt="npm"></a>
  <a href="https://www.npmjs.com/package/neuro-ts"><img src="https://img.shields.io/npm/dm/neuro-ts?color=%23a83904&labelColor=%23fbf6ec&label=downloads" alt="downloads"></a>
  <a href="https://neuro-ts.dev"><img src="https://img.shields.io/badge/docs-neuro--ts.dev-%23a83904?labelColor=%23fbf6ec" alt="docs"></a>
</p>

# neuro-ts (monorepo)

> AI-augmented JavaScript built-ins. Every method takes a single object literal whose keys mirror the original parameters, plus an optional `prompt: string`.

```ts
import { configureClient, neuro } from 'neuro-ts';

configureClient({ apiKey: process.env.OPENAI_API_KEY });

await neuro.math.random({ prompt: 'a number that feels lucky' }); // 0.471
await neuro.array.map({
  array: [1, 2, 3],
  callbackfn: (n) => n,
  prompt: 'double each value',
}); // [2, 4, 6]
await neuro.json.stringify({
  value: { hi: 'mum' },
  space: 2,
  prompt: 'pretty print',
});
```

Pass the original arguments under their TypeScript-lib names and you get
the native built-in. Add a non-empty `prompt` field and the call routes
to an LLM that simulates the same method. Empty / missing `prompt` falls
through to native dispatch.

## Workspaces

This is a pnpm monorepo. Six workspace folders:

| Workspace                                                      | Type | What it is                                                                                                                                                              |
| -------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/neuro-ts`](#packagesneuro-ts)                       | lib  | The published library. 654 wrappers across 30 groups, generated from `lib.es*.d.ts` via the TypeScript Compiler API.                                                    |
| [`packages/neuro-ts-proxy`](#packagesneuro-ts-proxy)           | lib  | Reference Web-standard `fetch` handler for proxying requests + an ephemeral-token issuer for browser apps. Runs on Node, Bun, Deno, Cloudflare Workers, Vercel Edge.    |
| [`packages/vendor/*`](#packagesvendor)                         | dep  | Third-party plugins we vendor + patch (because the upstream packages do not support Astro 6 / Zod 4 yet). Currently `starlight-site-graph` and `starlight-copy-button`. |
| [`apps/docs`](#appsdocs)                                       | site | The Astro + Starlight documentation site deployed at [neuro-ts.dev](https://neuro-ts.dev). 712 pages: guides, concepts, full method catalog, per-method prompt cards.   |
| [`examples/node-consumer`](#examplesnode-consumer)             | demo | Installs the library from a packed tarball and runs both an offline smoke (no network) and a live demo against OpenAI.                                                  |
| [`examples/fastify-hello-world`](#examplesfastify-hello-world) | demo | A Fastify HTTP service that calls `neuro.*` from request handlers. Has its own offline smoke.                                                                           |

## Root commands (run from the repo root)

```bash
pnpm install              # install every workspace
pnpm generate             # regenerate the 654 wrappers from TypeScript lib defs

# Build
pnpm build                # build every package (library only, not docs)
pnpm build:lib            # only the npm library
pnpm build:docs           # only the docs site
pnpm build:all            # library, then docs

# Dev / preview
pnpm dev                  # docs site at http://localhost:4321 (alias: dev:docs)
pnpm dev:docs             # explicit alias
pnpm dev:lib              # vitest in --watch on the library
pnpm preview              # serve the production-built docs (alias: preview:docs)
pnpm preview:docs         # build/preview at http://localhost:4321 (Astro preview)
pnpm serve:docs           # serve dist/ via `serve` on port 4321 (raw static)

# Test / verify
pnpm test                 # every package's test suite
pnpm test:lib             # only the library
pnpm typecheck            # tsc --noEmit across every workspace
pnpm smoke                # offline smokes for both example apps
pnpm smoke:live           # live consumer against OpenAI (needs OPENAI_API_KEY)
pnpm fastify              # boot the Fastify example
pnpm fastify:smoke        # smoke just the Fastify example
pnpm ci                   # the exact pipeline GitHub Actions runs
pnpm ci:gen-drift         # fail if `pnpm generate` produced any diff
pnpm clean                # nuke dist, .astro, .turbo, node_modules caches
```

### How to view the docs locally

Two modes, depending on what you need:

**Dev (live reload):** the right pick for editing content / styles.

```bash
pnpm dev:docs            # http://localhost:4321
```

Astro picks up MDX, CSS and component changes immediately. The dev pass
runs `generate-api` first via the `predev` hook, so the per-method MDX
catalog is up to date.

**Production-like preview:** identical to the deployed site. Use this
to verify OpenGraph cards, Pagefind search, the site graph and link
validation before pushing.

```bash
pnpm build:docs           # full static build
pnpm preview:docs         # Astro's production preview server (4321)
# or, raw static serve (no SSR / no preview niceties):
pnpm serve:docs           # http://localhost:4321
```

`pnpm build:docs` produces `apps/docs/dist/` (712 HTML pages + 711 OG
PNG cards + Pagefind index + sitemap). Both preview commands serve from
that directory.

## Per-workspace details

### `packages/neuro-ts`

The library shipped to npm. Build artifacts: ESM, CJS, IIFE (browser),
plus full `.d.ts` types. Source layout:

```
packages/neuro-ts/
├── src/
│   ├── client.ts           # NeuroClient (apiKey | proxyUrl | tokenProvider)
│   ├── client-instance.ts  # configureClient/getClient/isConfigured/resetClient
│   ├── browser.ts          # browser-specific entry (no apiKey allowed)
│   ├── runtime.ts          # generic dispatcher used by every wrapper
│   ├── serialize.ts        # safe JSON for prompts
│   ├── parse-result.ts     # tolerant LLM response parser
│   ├── env.ts              # browser detection
│   ├── errors.ts
│   ├── types.ts
│   ├── generated/          # 654 wrappers (gitignored, regenerated on build)
│   │   ├── groups/<g>.ts   # one file per group (array, math, string, ...)
│   │   ├── neuro.ts        # umbrella `neuro` namespace
│   │   ├── prompts.json    # per-method system prompts (consumed by docs)
│   │   └── index.ts
│   └── index.ts
├── scripts/
│   ├── builtins.ts             # whitelist of built-ins to wrap
│   ├── generate-wrappers.ts    # Compiler API generator -> src/generated/
│   ├── generate-tests.ts       # per-method routing+error tests -> tests/generated/
│   └── prompts/                # curated per-method prompt source-of-truth
│       ├── index.ts            # aggregator + gate
│       ├── array.ts, math.ts, ...   # one file per group (36 total)
│       └── typedArray.ts       # template-driven prompts for typed arrays
├── tests/                      # 6 hand-written + 30 generated test files
│   └── generated/              # 654 methods x 5 scenarios = 3270 cases
├── tsdown.config.ts            # ESM + CJS + IIFE + dts entries
└── tsconfig.json
```

**Workspace commands:**

```bash
pnpm --filter neuro-ts generate          # regenerate src/generated/
pnpm --filter neuro-ts generate:tests    # regenerate tests/generated/
pnpm --filter neuro-ts test              # vitest one-shot
pnpm --filter neuro-ts test:watch        # vitest --watch
pnpm --filter neuro-ts typecheck         # tsc --noEmit
pnpm --filter neuro-ts build             # tsdown -> dist/
```

Tests import the built `dist/` (vite-node hangs trying to transform the
30 large generated source files at runtime). The `pretest` hook runs
`pnpm build && pnpm generate:tests` so the suite always runs against
fresh artifacts. The generator hard-fails the build if any of the 654
methods is missing a curated prompt entry under `scripts/prompts/`.

### `packages/neuro-ts-proxy`

A reference implementation of the contract that backs the `proxyUrl`
init mode. Two helpers:

- `createNeuroProxy(opts)` - a Web-standard `(req: Request) => Promise<Response>`
  handler that forwards `neuro` requests to OpenAI (or any compatible
  endpoint) and streams responses back.
- `createTokenIssuer(opts)` + `tokenProviderFromUrl(url)` - server +
  client halves of the ephemeral-token mode for browser apps.

Runs on Node, Bun, Deno, Cloudflare Workers, Vercel Edge. No framework
dependency.

```bash
pnpm --filter neuro-ts-proxy build
pnpm --filter neuro-ts-proxy typecheck
```

### `packages/vendor`

Third-party plugins we ship in-tree because their npm releases do not
yet support Astro 6 / Zod 4 / Starlight 0.38. Each is a verbatim clone
of the upstream source with a small patch on top, referenced via
`workspace:*` from `apps/docs`.

- `starlight-site-graph` - vendored from the project's `main` (post-0.5.0).
  We bump `astro-integration-kit` to 0.20.0 so it accepts Astro 6 and
  patch `integration.ts` to use `fileURLToPath` instead of the buggy
  `trimSlashes(config.srcDir.pathname)` (the original strips the
  leading `/` from absolute POSIX paths).
- `starlight-copy-button` - vendored from `dionysuzx/starlight-copy-button`,
  which has no npm release. Peers widened to Astro 6.

When upstream catches up these vendor folders can be removed and we
swap back to the published packages.

### `apps/docs`

The documentation site. Astro 6 + Starlight 0.38 + Zod 4 + TypeScript 6.

```
apps/docs/
├── astro.config.mjs                    # Starlight + 5 plugins + sidebar
├── scripts/generate-api-docs.ts        # builds /methods/<group>/<m>.mdx + sidebar JSON
├── src/
│   ├── content/docs/
│   │   ├── index.mdx                   # homepage hero
│   │   ├── support.mdx
│   │   ├── guides/                     # quick-start, install, browser-safety, ...
│   │   ├── concepts/                   # naming, prompt engineering, catalog
│   │   ├── methods/                    # auto-generated, gitignored
│   │   └── api/                        # typedoc-driven, gitignored
│   ├── components/
│   │   ├── PromptCard.astro            # renders the system prompt for a method
│   │   ├── InstallTabs.astro           # npm/pnpm/yarn/bun/deno tabs
│   │   └── overrides/                  # Starlight component overrides
│   ├── pages/og/[...slug].ts           # OG card image generator
│   ├── styles/custom.css               # the Hot Iron theme
│   └── api-sidebar.json                # auto-generated; consumed by astro.config.mjs
└── public/                             # static assets, fonts, OG fallback
```

**Workspace commands:**

```bash
pnpm --filter docs generate-api    # rebuild /methods/ from prompts.json
pnpm --filter docs dev             # http://localhost:4321 with live reload
pnpm --filter docs build           # static build to dist/
pnpm --filter docs preview         # serve dist/ via Astro
pnpm --filter docs typecheck       # astro check
```

### `examples/node-consumer`

Installs the locally-packed neuro-ts tarball into a clean Node project
and exercises every code path. Two modes:

```bash
pnpm --filter neuro-ts-node-consumer smoke    # offline; mocked LLM, native fallback only
pnpm --filter neuro-ts-node-consumer start    # live; reads OPENAI_API_KEY
```

The offline smoke is what CI runs; it catches `package.json` `exports` /
`files` regressions before they hit npm.

### `examples/fastify-hello-world`

A Fastify HTTP server that uses `neuro.*` from request handlers. Comes
with its own offline smoke that boots the server, makes a GET and a
POST, asserts the responses, then shuts down.

```bash
pnpm fastify         # start the server (port assigned dynamically)
pnpm fastify:smoke   # offline smoke (~2s)
```

## How the generator works

A build-time script walks every `lib.*.d.ts` file using the TypeScript
Compiler API, finds every method on every whitelisted built-in, and
emits one typed wrapper per method:

```
TypeScript lib.es*.d.ts  ->  packages/neuro-ts/scripts/generate-wrappers.ts
                                        |
                                        v
                   packages/neuro-ts/src/generated/groups/<g>.ts
                   packages/neuro-ts/src/generated/prompts.json
                   packages/neuro-ts/src/generated/index.ts
```

At runtime the wrapper takes a single object literal. If the input has
a non-empty `prompt: string`, the SDK sends the original method id, the
prompt, the serialised receiver, the named-args record, and a frozen
system prompt to OpenAI (or your proxy / token endpoint), then parses
the JSON response back into the expected return type. If `prompt` is
missing or empty, the wrapper falls back to the real built-in and
returns a resolved Promise without ever contacting the LLM.

## CI

`.github/workflows/ci.yml` runs on every push / PR:

1. `pnpm install --frozen-lockfile`.
2. `pnpm generate` and fail if the diff is non-empty (determinism gate).
3. `typecheck`, `test`, `build` for every package.
4. `npm pack` then install in a clean directory and run the offline
   smoke against the tarball (catches `package.json` `exports` / `files`
   regressions).
5. Build the documentation site and upload `dist/` as an artifact.

`pnpm ci` runs the same steps locally.

## License

MIT - see [`LICENSE`](./LICENSE).
