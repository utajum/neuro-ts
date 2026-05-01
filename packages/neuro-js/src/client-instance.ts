import { NeuroClient } from './client';
import { NeuroNotConfiguredError } from './errors';
import type { NeuroClientOptions } from './types';

let instance: NeuroClient | null = null;

/**
 * Configure the shared neuro-js client. Call once at application startup,
 * before invoking any `neuro*` method. Calling twice replaces the instance.
 */
export function configureClient(options: NeuroClientOptions): NeuroClient {
  instance = new NeuroClient(options);
  return instance;
}

/** Reset the shared instance (mainly useful in tests). */
export function resetClient(): void {
  instance = null;
}

/** Returns the currently configured client. Throws if not configured. */
export function getClient(): NeuroClient {
  if (!instance) throw new NeuroNotConfiguredError();
  return instance;
}

/** True if {@link configureClient} has been called. */
export function isConfigured(): boolean {
  return instance !== null;
}
