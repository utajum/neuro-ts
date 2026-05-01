/**
 * smoke.ts - TypeScript ESM consumer smoke test.
 *
 * Verifies that the published neuro-ts package is consumable via
 * TypeScript ESM imports. The explicit type annotations (e.g.
 * `const result: string[]`) serve as lightweight type assertions:
 * a mismatched return type from the .d.ts would be a compile error
 * when `tsc --noEmit` is run against this file.
 *
 * No real API key needed: fetch is stubbed to return fixture data.
 * Exit 0 on success.
 */
import assert from 'node:assert/strict';
import { configureClient, neuro } from 'neuro-ts';

// Stub fetch - answers each request with a fixture matching the
// original JS behaviour, so no network or API key is required.
globalThis.fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
  const body = JSON.parse(String(init?.body)) as { functionId: string; instanceData?: string };
  let result: unknown;
  switch (body.functionId) {
    case 'Math.random':
      result = 0.77;
      break;
    case 'String.prototype.toUpperCase':
      result = (JSON.parse(body.instanceData!) as string).toUpperCase();
      break;
    case 'Object.keys':
      // static method - args are passed by the SDK, just return fixture
      result = ['a', 'b', 'c'];
      break;
    case 'Array.prototype.filter':
      result = [3, 4];
      break;
    default:
      throw new Error(`Unstubbed functionId in TS-ESM smoke: ${body.functionId}`);
  }
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

configureClient({ proxyUrl: 'https://neuro.example.test/proxy' });

// Native fallback - no prompt, no stub hit.
const lower: string = await neuro.string.toLowerCase({ string: 'WORLD' });
assert.equal(lower, 'world');
console.log(`  -> neuro.string.toLowerCase (native): ${lower}`);

const floor: number = await neuro.math.floor({ x: 4.9 });
assert.equal(floor, 4);
console.log(`  -> neuro.math.floor (native):         ${floor}`);

const jsonParsed: { ok: boolean } = await neuro.json.parse({ text: '{"ok":true}' });
assert.deepStrictEqual(jsonParsed, { ok: true });
console.log(`  -> neuro.json.parse (native):         ${JSON.stringify(jsonParsed)}`);

// LLM path - prompt present, hits stub.
const rand: number = await neuro.math.random({ prompt: 'medium value' });
assert.equal(rand, 0.77);
console.log(`  -> neuro.math.random (LLM):           ${rand}`);

const upper: string = await neuro.string.toUpperCase({
  string: 'hello from ts-esm',
  prompt: 'shout it',
});
assert.equal(upper, 'HELLO FROM TS-ESM');
console.log(`  -> neuro.string.toUpperCase (LLM):    ${upper}`);

const keys: string[] = await neuro.object.keys({
  o: { a: 1, b: 2, c: 3 },
  prompt: 'list all keys',
});
assert.deepStrictEqual(keys, ['a', 'b', 'c']);
console.log(`  -> neuro.object.keys (LLM):           ${JSON.stringify(keys)}`);

const filtered: number[] = await neuro.array.filter({
  array: [1, 2, 3, 4],
  predicate: (n) => n > 2,
  prompt: 'keep values above 2',
});
assert.deepStrictEqual(filtered, [3, 4]);
console.log(`  -> neuro.array.filter (LLM):          ${JSON.stringify(filtered)}`);

console.log('\nTypeScript ESM smoke passed.');
