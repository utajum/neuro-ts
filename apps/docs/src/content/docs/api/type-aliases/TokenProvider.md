---
editUrl: false
next: true
prev: true
title: "TokenProvider"
---

```ts
type TokenProvider = () => Promise<string> | string;
```

User-supplied async function returning a short-lived OpenAI-compatible
API key. Recommended for browser environments - never ship long-lived
secrets to the client.

## Returns

`Promise`\<`string`\> \| `string`
