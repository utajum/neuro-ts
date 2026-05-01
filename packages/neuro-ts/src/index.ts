// neuro-ts public API
export { NeuroClient } from './client';
export { configureClient, getClient, isConfigured, resetClient } from './client-instance';
export { NeuroClientError, NeuroBrowserApiKeyError, NeuroNotConfiguredError } from './errors';
export type {
  NeuroClientOptions,
  TokenProvider,
  CustomFetchOptions,
  SignatureHint,
  ExecuteFunctionInput,
} from './types';
export type { GeneratedMethodSpec } from './runtime';

// Generated `neuro` namespace + per-group named exports.
// (`scripts/generate-wrappers.ts` produces every method under
// `neuro.array`, `neuro.math`, `neuro.string`, etc.)
export { neuro } from './generated/neuro';
export type { NeuroNamespace } from './generated/neuro';
export * from './generated/groups';
