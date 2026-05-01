/**
 * Aggregator for the curated per-method prompts.
 *
 * Each `<group>.ts` file exports a `Record<methodName, CuratedPrompt>` map
 * (or, for typed arrays, a generator function that returns one). The
 * generator (`generate-wrappers.ts`) imports this aggregator, asserts a
 * 1:1 match against the methods it just collected from the TypeScript
 * lib, and embeds the result in `prompts.json` for the docs site.
 *
 * Voice anchor: honest dev internal monologue, paradoxical, rooted in
 * execution context. Each prompt reads as a real engineering request
 * with a contradiction baked in that any working dev recognises but
 * nobody admits to in design reviews. No corporate comedy.
 */

export interface CuratedPrompt {
  /** The exact `prompt:` string sent to the LLM in docs examples. */
  prompt: string;
  /** Single-line code comment displayed above the docs example. */
  comment: string;
  /**
   * Full call expression used in docs Example block. Always uses the
   * new object-literal shape and ends with `prompt: '<the prompt>'`.
   */
  example: string;
}

import { arrayPrompts } from './array';
import { stringPrompts } from './string';
import { numberPrompts } from './number';
import { mathPrompts } from './math';
import { jsonPrompts } from './json';
import { objectPrompts } from './object';
import { datePrompts } from './date';
import { regExpPrompts } from './regExp';
import { mapPrompts } from './map';
import { setPrompts } from './set';
import { weakMapPrompts } from './weakMap';
import { weakSetPrompts } from './weakSet';
import { promisePrompts } from './promise';
import { symbolPrompts } from './symbol';
import { bigIntPrompts } from './bigInt';
import { arrayBufferPrompts } from './arrayBuffer';
import { dataViewPrompts } from './dataView';
import { atomicsPrompts } from './atomics';
import { globalsPrompts } from './globals';
import { typedArrayPrompts } from './typedArray';

export async function loadPrompts(): Promise<Map<string, CuratedPrompt>> {
  const out = new Map<string, CuratedPrompt>();

  function addGroup(group: string, entries: Record<string, CuratedPrompt>): void {
    for (const [method, entry] of Object.entries(entries)) {
      out.set(`neuro.${group}.${method}`, entry);
    }
  }

  addGroup('array', arrayPrompts);
  addGroup('string', stringPrompts);
  addGroup('number', numberPrompts);
  addGroup('math', mathPrompts);
  addGroup('json', jsonPrompts);
  addGroup('object', objectPrompts);
  addGroup('date', datePrompts);
  addGroup('regExp', regExpPrompts);
  addGroup('map', mapPrompts);
  addGroup('set', setPrompts);
  addGroup('weakMap', weakMapPrompts);
  addGroup('weakSet', weakSetPrompts);
  addGroup('promise', promisePrompts);
  addGroup('symbol', symbolPrompts);
  addGroup('bigInt', bigIntPrompts);
  addGroup('arrayBuffer', arrayBufferPrompts);
  addGroup('dataView', dataViewPrompts);
  addGroup('atomics', atomicsPrompts);

  // Globals live at the top level (`neuro.parseInt`, not `neuro.globals.parseInt`).
  for (const [method, entry] of Object.entries(globalsPrompts)) {
    out.set(`neuro.${method}`, entry);
  }

  // Typed arrays generate per-(group, method) entries with type-aware
  // paradoxes (uint8 wrap-at-256, int8 two's complement, float32
  // precision loss, bigInt64 magnitude). The generator returns the
  // full map of `neuro.<typedArrayGroup>.<method>` keys.
  const typedArrayMap = typedArrayPrompts();
  for (const [k, v] of typedArrayMap.entries()) out.set(k, v);

  return out;
}
