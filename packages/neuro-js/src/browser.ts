// Browser entry - same surface as default, but signals to bundlers that
// `apiKey` mode is discouraged. The runtime check in NeuroClient throws
// `NeuroBrowserApiKeyError` unless `dangerouslyAllowBrowser: true` is set.
export * from './index';
