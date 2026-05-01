/**
 * Narrow entry point fed to TypeDoc by the docs site.
 *
 * The generated `neuro.<group>.<method>` surface (~654 wrappers) is documented
 * separately by `apps/docs/scripts/generate-api-docs.ts` from `prompts.json`,
 * which gives us cleaner per-method pages with the actual system prompts.
 *
 * Here we only expose the small client-control surface so TypeDoc produces
 * a focused "Client API" section.
 */
export { NeuroClient } from './src/client';
export { configureClient, getClient, isConfigured, resetClient } from './src/client-instance';
export { NeuroClientError, NeuroBrowserApiKeyError, NeuroNotConfiguredError } from './src/errors';
export type {
  NeuroClientOptions,
  TokenProvider,
  CustomFetchOptions,
  SignatureHint,
  ExecuteFunctionInput,
} from './src/types';
export type { GeneratedMethodSpec } from './src/runtime';
