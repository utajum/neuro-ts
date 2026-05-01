export class NeuroClientError extends Error {
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NeuroClientError';
    if (cause !== undefined) this.cause = cause;
  }
}

export class NeuroNotConfiguredError extends NeuroClientError {
  constructor() {
    super(
      'neuro-ts client not configured. Call configureClient({ apiKey | proxyUrl | tokenProvider }) before invoking neuro* methods.',
    );
    this.name = 'NeuroNotConfiguredError';
  }
}

export class NeuroBrowserApiKeyError extends NeuroClientError {
  constructor() {
    super(
      'Refusing to use a long-lived `apiKey` in a browser environment. Use `tokenProvider` (short-lived token) or `proxyUrl` instead. To override (NOT recommended) pass `dangerouslyAllowBrowser: true`.',
    );
    this.name = 'NeuroBrowserApiKeyError';
  }
}
