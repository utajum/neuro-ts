---
editUrl: false
next: true
prev: true
title: "ExecuteFunctionInput"
---

## Properties

### functionId

```ts
functionId: string;
```

Fully qualified id of the original built-in (e.g. `Array.prototype.map`).

***

### prompt

```ts
prompt: string;
```

Natural-language steering string supplied by the application.

***

### instance

```ts
instance: unknown;
```

Receiver / `this` value for instance methods. `null` for static methods.
Distinct from [args](/api/interfaces/executefunctioninput/#args) so the proxy contract stays explicit.

***

### args

```ts
args: Record<string, unknown>;
```

Named arguments map. Keys correspond to the parameter names taken from
the original TS lib signature. Variadic items live under their declared
rest-parameter name (e.g. `items`, `values`, `codes`).

***

### signatureHint

```ts
signatureHint: SignatureHint[];
```

***

### systemPrompt

```ts
systemPrompt: string;
```

***

### model?

```ts
optional model?: string;
```
