# neuro-js-node-consumer

Two scripts:

| Script      | Network                | Run                                                              |
| ----------- | ---------------------- | ---------------------------------------------------------------- |
| `smoke.mjs` | none (stubbed `fetch`) | `pnpm --filter neuro-js-node-consumer smoke`                     |
| `index.mjs` | OpenAI                 | `OPENAI_API_KEY=sk-… pnpm --filter neuro-js-node-consumer start` |

CI runs `smoke.mjs` against the tarball produced by `npm pack`, so it is
the best test of "does it actually install and run".
