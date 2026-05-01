---
editUrl: false
next: true
prev: true
title: "NeuroClientOptions"
---

## Properties

### apiKey?

```ts
optional apiKey?: string;
```

OpenAI API key. **Node.js only.** Throws in browser environments to
prevent leaking secrets. In the browser use `tokenProvider` or `proxyUrl`.

***

### proxyUrl?

```ts
optional proxyUrl?: string;
```

URL of a backend you control that proxies requests to OpenAI. The SDK
POSTs `{ functionId, prompt, args, instanceData, signatureHint, model }`
and expects the LLM result back as JSON.

***

### tokenProvider?

```ts
optional tokenProvider?: TokenProvider;
```

Async function returning a short-lived (ephemeral) API key. Called once
per request; cache + refresh in your implementation as needed.
Browser-safe alternative to `apiKey`.

***

### model?

```ts
optional model?: string;
```

Default chat model. Overridable per-call.

***

### baseURL?

```ts
optional baseURL?: string;
```

Optional custom base URL for OpenAI-compatible endpoints.

***

### temperature?

```ts
optional temperature?: number;
```

Sampling temperature (default 0.2 - deterministic simulation).

***

### maxTokens?

```ts
optional maxTokens?: number;
```

Max output tokens (default 1024).

***

### fetchOptions?

```ts
optional fetchOptions?: CustomFetchOptions;
```

Extra fetch options for `proxyUrl` mode.

***

### dangerouslyAllowBrowser?

```ts
optional dangerouslyAllowBrowser?: boolean;
```

When true, allows `apiKey` use in the browser. ⚠️ DANGEROUS.
