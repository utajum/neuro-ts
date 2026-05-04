/**
 * Custom Method Catalog generator.
 *
 * Reads `packages/neuro-ts/src/generated/prompts.json` (produced by
 * `scripts/generate-wrappers.ts`) and emits a clean, structured tree of
 * MDX pages plus a Starlight sidebar JSON.
 *
 * Every method ships with a curated example sourced from the lib
 * package's `scripts/prompts/<group>.ts` source-of-truth. There is no
 * fallback template chain anymore - the lib generator hard-fails if a
 * method is missing a curated entry, so the docs build can rely on
 * every entry being present and idiomatic.
 *
 * Output layout under `apps/docs/src/content/docs/methods/`:
 *
 *    methods/
 *      index.mdx                  (overview, group grid)
 *      <group>/
 *        index.mdx                (all methods in group, table)
 *        <method>.mdx             (signatures, prompt, example, system prompt)
 *      globals/
 *        index.mdx
 *        parseInt.mdx, ...
 *
 * Plus `src/api-sidebar.json`: a Starlight sidebar item array consumed by
 * `astro.config.mjs`.
 */
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const PROMPTS = resolve(REPO, 'packages/neuro-ts/src/generated/prompts.json');
const OUT_ROOT = resolve(HERE, '../src/content/docs/methods');
const SIDEBAR_OUT = resolve(HERE, '../src/api-sidebar.json');

interface Overload {
  params: string;
  returnType: string;
  jsDoc: string;
}
interface Curated {
  prompt: string;
  comment: string;
  example: string;
}
interface Entry {
  group: string;
  methodName: string;
  functionId: string;
  kind: 'instance' | 'static' | 'global';
  receiverKey: string;
  paramOrder: string[];
  variadicKey: string;
  overloads: Overload[];
  systemPrompt: string;
  curated: Curated;
}

const ALL: Record<string, Entry> = JSON.parse(readFileSync(PROMPTS, 'utf-8'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Escape MDX-significant chars in plain prose. Code fences are emitted
 *  verbatim, so the escape only runs over titles + descriptions. */
const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/</g, '\\<').replace(/\{/g, '\\{').replace(/\}/g, '\\}');

/**
 * Build the object-literal type signature shown in docs. Mirrors the
 * shape the generated wrapper actually accepts:
 *
 *   { receiverKey: ReceiverType; param1: Type1; ...; prompt?: string }
 */
function renderSignature(entry: Entry, ov: Overload): string {
  const fields: string[] = [];
  if (entry.kind === 'instance' && entry.receiverKey) {
    fields.push(`${entry.receiverKey}: <receiver>`);
  }
  // ov.params is a comma-joined "name: type" list; carry it through.
  if (ov.params.trim()) {
    for (const piece of ov.params.split(/,\s*/)) {
      const cleaned = piece.replace(/^\.\.\./, '');
      fields.push(cleaned);
    }
  }
  fields.push('prompt?: string');
  return `${entry.methodName}(input: { ${fields.join('; ')} }): Promise<${ov.returnType}>`;
}

/** A short, friendly description per method kind. */
function kindLabel(entry: Entry): string {
  if (entry.kind === 'global') return 'Global function';
  if (entry.kind === 'static') return `Static method on \`${entry.functionId.split('.')[0]}\``;
  return `Instance method on \`${entry.functionId.split('.')[0]}.prototype\``;
}

// ---------------------------------------------------------------------------
// Group ordering & display
// ---------------------------------------------------------------------------

const GROUP_DISPLAY: Record<string, string> = {
  array: 'Array',
  string: 'String',
  number: 'Number',
  math: 'Math',
  json: 'JSON',
  object: 'Object',
  date: 'Date',
  regExp: 'RegExp',
  map: 'Map',
  set: 'Set',
  weakMap: 'WeakMap',
  weakSet: 'WeakSet',
  promise: 'Promise',
  symbol: 'Symbol',
  bigInt: 'BigInt',
  arrayBuffer: 'ArrayBuffer',
  dataView: 'DataView',
  atomics: 'Atomics',
  iterator: 'Iterator',
  error: 'Error',
  int8Array: 'Int8Array',
  int16Array: 'Int16Array',
  int32Array: 'Int32Array',
  uint8Array: 'Uint8Array',
  uint8ClampedArray: 'Uint8ClampedArray',
  uint16Array: 'Uint16Array',
  uint32Array: 'Uint32Array',
  float32Array: 'Float32Array',
  float64Array: 'Float64Array',
  bigInt64Array: 'BigInt64Array',
  bigUint64Array: 'BigUint64Array',
  globals: 'Top-level functions',
};

const GROUP_ORDER = [
  'globals',
  'array',
  'string',
  'number',
  'math',
  'json',
  'object',
  'date',
  'regExp',
  'map',
  'set',
  'weakMap',
  'weakSet',
  'promise',
  'symbol',
  'bigInt',
  'arrayBuffer',
  'dataView',
  'atomics',
  'iterator',
  'error',
  'int8Array',
  'int16Array',
  'int32Array',
  'uint8Array',
  'uint8ClampedArray',
  'uint16Array',
  'uint32Array',
  'float32Array',
  'float64Array',
  'bigInt64Array',
  'bigUint64Array',
];

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function groupBy(): Record<string, Entry[]> {
  const out: Record<string, Entry[]> = {};
  for (const entry of Object.values(ALL)) {
    (out[entry.group] = out[entry.group] || []).push(entry);
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => a.methodName.localeCompare(b.methodName));
  }
  return out;
}

function methodSlug(entry: Entry): string {
  return slug(entry.methodName);
}

function groupHref(group: string): string {
  return `/methods/${group.toLowerCase()}/`;
}
function methodHref(entry: Entry): string {
  return `/methods/${entry.group.toLowerCase()}/${methodSlug(entry)}/`;
}

// ---- Per-method MDX -------------------------------------------------------

function renderMethodMdx(entry: Entry): string {
  const dotted = `neuro.${entry.group === 'globals' ? '' : entry.group + '.'}${entry.methodName}`;
  const sigs = entry.overloads.map((ov) => renderSignature(entry, ov));
  const docs = entry.overloads.map((ov) => ov.jsDoc.trim()).filter(Boolean);
  const uniqueDocs = Array.from(new Set(docs));

  const encodedExample = Buffer.from(
    `
import { configureClient, neuro } from 'neuro-ts';

configureClient({ apiKey: process.env.OPENAI_API_KEY });

// ${entry.curated.comment}
${entry.curated.example};
`,
  ).toString('base64');

  return `---
title: ${entry.methodName}
description: ${esc(`${dotted} wraps ${entry.functionId} for AI-augmented JavaScript. Call the original built-in with TypeScript types intact, or pass a prompt to route through GPT / OpenAI. Native fallback when prompt is empty.`)}
sidebar:
  label: ${entry.methodName}
---

import PromptCard from '../../../../components/PromptCard.astro';
import { Code } from '@astrojs/starlight/components';


## \`${dotted}\`

${kindLabel(entry)}.${entry.variadicKey ? ` Variadic items live under \`${entry.variadicKey}\`.` : ''}

${uniqueDocs.length ? uniqueDocs.map((d) => `> ${esc(d).split('\n').join('\n> ')}`).join('\n>\n') : ''}

## Signatures

\`\`\`ts
${sigs.join('\n')}
\`\`\`

The \`prompt\` field is optional. When omitted (or set to an empty string)
the wrapper falls back to the native \`${entry.functionId}\` and returns a
resolved Promise without contacting the LLM. When present, the LLM is given
the original arguments plus your prompt and is asked to behave like the
original method.

## Example

<Code
  lang="ts"
  code={atob("${encodedExample}")}
  wrap
/>




## System prompt

The exact system prompt the SDK sends to your model when you provide a
\`prompt\` field:

<PromptCard name="${dotted}" />
`;
}

// ---- Per-group index MDX --------------------------------------------------

function renderGroupIndexMdx(group: string, entries: Entry[]): string {
  const display = GROUP_DISPLAY[group] ?? group;
  const target = group === 'globals' ? 'top-level globals' : `\`${display}\``;

  const theCode = (arg: string) => {
    const encoded = Buffer.from(arg).toString('base64');
    return `<Code lang="ts" code={atob("${encoded}")} wrap />`;
  };

  const rows = entries
    .map((e) => {
      const sig = renderSignature(e, e.overloads[0]);
      return `| [\`${e.methodName}\`](${methodHref(e)}) | ${theCode(sig)} |`;
    })
    .join('\n');

  return `---
title: ${display}
description: ${esc(`AI-augmented JavaScript wrappers for ${target}. ${entries.length} TypeScript-first built-ins with optional GPT / OpenAI prompts and native fallback. Part of neuro-ts.`)}
sidebar:
  label: ${display}
  order: ${GROUP_ORDER.indexOf(group) + 1}
---

import { Code } from '@astrojs/starlight/components';


# ${display}

${entries.length} wrapper${entries.length === 1 ? '' : 's'} generated from
${group === 'globals' ? 'top-level JavaScript globals' : `\`${display}\` and \`${display}.prototype\``}.
Every entry takes a single object literal whose keys mirror the original
parameter names, plus an optional \`prompt: string\` for the LLM path.

| Method | First signature |
| --- | --- |
${rows}
`;
}

// ---- Top-level methods index ---------------------------------------------

function renderTopIndexMdx(grouped: Record<string, Entry[]>): string {
  const cards = GROUP_ORDER.filter((g) => grouped[g]?.length)
    .map((g) => {
      const display = GROUP_DISPLAY[g] ?? g;
      return `  <a class="neuro-group-card" href="${groupHref(g)}">
    <strong>${display}</strong>
    <span>${grouped[g].length} method${grouped[g].length === 1 ? '' : 's'}</span>
  </a>`;
    })
    .join('\n');

  const total = Object.values(grouped).reduce((n, l) => n + l.length, 0);

  return `---
title: Method catalog
description: Every neuro-ts wrapper, grouped by built-in. Click through for signatures and prompts.
sidebar:
  label: Method catalog
  order: 1
---

The full set of AI-augmented JavaScript built-ins. ${total} methods across
${Object.keys(grouped).length} groups, each callable with a single object
literal whose keys mirror the original parameter names plus an optional
\`prompt: string\`.

<div class="neuro-group-grid not-content">
${cards}
</div>

Looking for the lower-level client / configuration / errors? See the
[Client API](/api/readme/) section.
`;
}

// ---- Sidebar tree ---------------------------------------------------------

interface SidebarItem {
  label: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
}

function renderSidebar(grouped: Record<string, Entry[]>): SidebarItem {
  return {
    label: 'Method catalog',
    collapsed: true,
    items: [
      { label: 'Overview', link: '/methods/' },
      ...GROUP_ORDER.filter((g) => grouped[g]?.length).map((g) => ({
        label: GROUP_DISPLAY[g] ?? g,
        collapsed: true,
        items: [
          { label: 'Overview', link: groupHref(g) },
          ...grouped[g].map((e) => ({
            label: e.methodName,
            link: methodHref(e),
          })),
        ],
      })),
    ],
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function run() {
  if (existsSync(OUT_ROOT)) rmSync(OUT_ROOT, { recursive: true, force: true });
  mkdirSync(OUT_ROOT, { recursive: true });

  const grouped = groupBy();

  writeFileSync(join(OUT_ROOT, 'index.mdx'), renderTopIndexMdx(grouped));

  let methodCount = 0;
  for (const group of Object.keys(grouped).sort()) {
    const dir = join(OUT_ROOT, group.toLowerCase());
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.mdx'), renderGroupIndexMdx(group, grouped[group]));
    for (const entry of grouped[group]) {
      const file = join(dir, `${methodSlug(entry)}.mdx`);
      writeFileSync(file, renderMethodMdx(entry));
      methodCount += 1;
    }
  }

  writeFileSync(SIDEBAR_OUT, JSON.stringify(renderSidebar(grouped), null, 2));

  console.log(
    `[generate-api-docs] wrote ${methodCount} methods across ${
      Object.keys(grouped).length
    } groups -> ${OUT_ROOT.replace(REPO + '/', '')}`,
  );
}

run();
