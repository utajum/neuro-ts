---
editUrl: false
next: true
prev: true
title: "configureClient"
---

```ts
function configureClient(options): NeuroClient;
```

Configure the shared neuro-ts client. Call once at application startup,
before invoking any `neuro*` method. Calling twice replaces the instance.

## Parameters

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

## Returns

[`NeuroClient`](/api/classes/neuroclient/)
