---
editUrl: false
next: true
prev: true
title: "NeuroClient"
---

Narrow entry point fed to TypeDoc by the docs site.

The generated `neuro.<group>.<method>` surface (~654 wrappers) is documented
separately by `apps/docs/scripts/generate-api-docs.ts` from `prompts.json`,
which gives us cleaner per-method pages with the actual system prompts.

Here we only expose the small client-control surface so TypeDoc produces
a focused "Client API" section.

## Constructors

### Constructor

```ts
new NeuroClient(options): NeuroClient;
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options`

</td>
<td>

[`NeuroClientOptions`](/api/interfaces/neuroclientoptions/)

</td>
</tr>
</tbody>
</table>

#### Returns

`NeuroClient`

## Properties

### mode

```ts
readonly mode: Mode;
```

***

### model

```ts
readonly model: string;
```

***

### temperature

```ts
readonly temperature: number;
```

***

### maxTokens

```ts
readonly maxTokens: number;
```

## Methods

### executeFunction()

```ts
executeFunction(input): Promise<unknown>;
```

Execute a wrapped JS method via the LLM.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`input`

</td>
<td>

[`ExecuteFunctionInput`](/api/interfaces/executefunctioninput/)

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`unknown`\>
