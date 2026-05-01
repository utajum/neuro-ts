---
editUrl: false
next: true
prev: true
title: "GeneratedMethodSpec"
---

## Properties

### group

```ts
readonly group: string;
```

Wrapper namespace, e.g. `math`.

***

### methodName

```ts
readonly methodName: string;
```

Original method name, e.g. `random`.

***

### functionId

```ts
readonly functionId: string;
```

Fully qualified id sent to the LLM, e.g. `Array.prototype.map`.

***

### kind

```ts
readonly kind: "instance" | "static" | "global";
```

instance = first arg of native call is the receiver.

***

### native

```ts
readonly native: ((this, ...args) => unknown) | null;
```

Pre-resolved native implementation, or `null` if no fallback exists.

***

### receiverKey

```ts
readonly receiverKey: string;
```

Object-literal key the runtime reads to obtain the receiver for instance
methods (e.g. `array`, `string`, `set`). Empty string for static methods.

***

### paramOrder

```ts
readonly paramOrder: readonly string[];
```

Ordered list of native parameter names (excluding the receiver). Native
dispatch reads `input[name]` for each entry, in order, to reconstruct
the positional arguments.

***

### variadicKey

```ts
readonly variadicKey: string;
```

Variadic parameter name (the rest-parameter's identifier from the TS
lib signature). Empty when the method is not variadic. When set, the
runtime expects `input[variadicKey]` to be an array; native dispatch
spreads it past any preceding fixed parameters.

***

### systemPrompt

```ts
readonly systemPrompt: string;
```

Frozen prompt sent to the LLM.

***

### signatureHint

```ts
readonly signatureHint: readonly SignatureHint[];
```

Parameter hints passed to the LLM along with the prompt.
