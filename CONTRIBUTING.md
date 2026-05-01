# Contributing to neuro-ts

Thanks for considering a contribution. The library is a code-generated
monorepo, so most changes flow through the same generator pipeline.
This guide is here to make that pipeline obvious.

## Setup

```bash
git clone https://github.com/utajum/neuro-ts.git
cd neuro-ts
pnpm install
pnpm generate     # produces packages/neuro-ts/src/generated/
pnpm build:lib    # ESM + CJS + IIFE + types
pnpm test         # full vitest suite (3960+ tests)
```

You need:

- Node `>= 20` (the CI matrix runs 20, 22, 24)
- pnpm `10.33+`

The repository uses `pnpm` workspaces. All commands work from the root
unless noted.

## Repository layout

| Workspace                      | What it is                                            |
| ------------------------------ | ----------------------------------------------------- |
| `packages/neuro-ts`            | The published library. 654 wrappers across 30 groups. |
| `packages/neuro-ts-proxy`      | Reference proxy + token issuer for `proxyUrl` mode.   |
| `packages/vendor/*`            | Third-party plugins vendored + patched for Astro 6.   |
| `apps/docs`                    | Astro + Starlight site at neuro-ts.dev.               |
| `examples/node-consumer`       | Live + offline smoke test against a packed tarball.   |
| `examples/fastify-hello-world` | Fastify HTTP service exercising `neuro.*`.            |

## How the generator works

```
TypeScript lib.es*.d.ts
        |
        v
packages/neuro-ts/scripts/generate-wrappers.ts
        |
        v
packages/neuro-ts/src/generated/groups/<g>.ts   (one wrapper per method)
packages/neuro-ts/src/generated/prompts.json    (system prompt per method)
packages/neuro-ts/src/generated/index.ts        (umbrella re-exports)
```

The generator walks `lib.es*.d.ts` with the TypeScript Compiler API,
finds every method on every whitelisted built-in, and emits one typed
wrapper per method. The full wrapper output is gitignored and produced
on every build.

The determinism gate (`pnpm ci:gen-drift`) runs `pnpm generate` and
fails if the diff is non-empty. CI runs this on every push, so any code
change that affects generation must be paired with a matching commit
of the regenerated artifacts.

## Common tasks

### Adding a new built-in group

1. Edit `packages/neuro-ts/scripts/builtins.ts` -- add the constructor
   name to the `BUILTINS` array.
2. Create `packages/neuro-ts/scripts/prompts/<group>.ts` -- a curated
   prompt entry for every method on the group (see existing files for
   the shape).
3. Run `pnpm generate`. The generator hard-fails if any method is
   missing a curated prompt entry, which is the signal that step 2
   was incomplete.
4. Update `apps/docs/src/content/docs/concepts/catalog.mdx` to include
   a representative `<PromptCard>` for the new group.
5. Run `pnpm test`. The generated tests pick up the new group
   automatically (5 routing scenarios per method, plus a native-value
   scenario where applicable).

### Editing a curated prompt

Every method has a hand-written entry in
`packages/neuro-ts/scripts/prompts/<group>.ts`. The shape is:

```ts
{
  prompt: 'imperative instruction the LLM receives via the user message',
  comment: 'short single-line summary shown above the docs example',
  example: 'await neuro.<group>.<method>({ ... }) ...',
}
```

The `prompt` field is what the LLM actually sees, so it must be:

- **Imperative**: start with a verb the LLM treats as a command
  (`return`, `call`, `parse`, `format`, `read`, `clamp`, `yield`).
- **Method-specific**: name the actual behaviour the wrapped built-in
  performs, plus an engineering paradox or dev-pain hook.
- **Self-contained**: the LLM does not see surrounding docs.

Look at any existing file (`scripts/prompts/array.ts`, `string.ts`,
`math.ts`) for the voice. The hooks reference real engineering
contradictions: `Array.prototype.includes` and `NaN` finding itself,
`Object.values` and integer key promotion, `JSON.parse` repairing
malformed input. Match that register.

After editing, run `pnpm generate` to refresh `prompts.json` and the
auto-generated docs pages under `apps/docs/src/content/docs/methods/`.

### Adding a docs page

Guides live in `apps/docs/src/content/docs/guides/`. Concepts live in
`apps/docs/src/content/docs/concepts/`. Both are Starlight MDX:

```mdx
---
title: My new guide
description: SEO-friendly summary that ends up in <meta name="description">.
---

import PromptCard from '../../../components/PromptCard.astro';

Body...

<PromptCard name="neuro.array.map" />
```

Then add the new page to `apps/docs/astro.config.mjs` under the matching
sidebar section. Run `pnpm dev:docs` to preview at
http://localhost:4321 with live reload.

### Running CI locally

```bash
pnpm ci          # full pipeline -- determinism, typecheck, test, build, smoke
pnpm ci:gen-drift  # just the determinism gate
```

`pnpm ci` is the exact pipeline GitHub Actions runs. If it passes
locally, the PR will pass on CI (modulo flakes in the npm-registry
smoke job, which tests against the published package).

## Testing

The test suite is a mix of hand-written (`tests/*.test.ts`) and
generated (`tests/generated/*.test.ts`) cases. The generated suite
covers every method with five routing scenarios:

1. LLM dispatch when `prompt` is present
2. Native fallback when `prompt` is missing
3. Native fallback when `prompt` is empty string
4. Network failure surfaces as `NeuroClientError`
5. 500 response from the proxy

A sixth "native-value" scenario is generated where the runtime can
verify the native built-in returns the expected value. Generated tests
import the built `dist/` rather than source -- the `pretest` hook runs
`pnpm build && pnpm generate:tests` so the suite always runs against
fresh artifacts.

Add hand-written tests for:

- New code paths in `client.ts`, `runtime.ts`, `parse-result.ts`,
  `serialize.ts`, `client-instance.ts`.
- Bugs reproduced via a minimal failing test before the fix.

Do not add hand-written tests for individual wrapper methods -- the
generated suite already covers them.

## Pull requests

- Open an issue first for non-trivial changes (new builtin group, new
  init mode, breaking API change). Smaller fixes can go straight to a
  PR.
- Each PR should pass `pnpm ci` locally.
- Commit the regenerated `src/generated/` and any docs changes as part
  of the PR if your changes affect the generator.
- Rebase on `master` rather than merging.
- Conventional commit prefixes are not required, but `feat:`, `fix:`,
  `docs:`, `test:`, `refactor:` are appreciated.

## Reporting bugs

GitHub Issues, please:

1. Repro: the smallest possible call site that fails.
2. Expected vs actual.
3. Node / Bun / browser version, plus `neuro-ts` version.
4. If the LLM returned the wrong shape, include the exact prompt and
   the model name.

## License

MIT. By contributing you agree that your changes are licensed under
the same terms as the rest of the project.
