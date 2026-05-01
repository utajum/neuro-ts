/**
 * smoke.ts - TypeScript CommonJS consumer smoke test.
 *
 * Verifies that the published neuro-ts package is consumable via
 * TypeScript compiled to CommonJS. The tsconfig uses
 * "module": "CommonJS" / "moduleResolution": "node" to mirror
 * a legacy TypeScript project that hasn't migrated to ESM.
 *
 * tsx respects the tsconfig and runs the file in CJS mode.
 * Top-level await is supported by tsx even in CJS context.
 *
 * No real API key needed: fetch is stubbed to return fixture data.
 * Exit 0 on success.
 */
import assert from 'node:assert/strict';
import { configureClient, neuro } from 'neuro-ts';

// Stub fetch - answers each request with a fixture matching the
// original JS behaviour, so no network or API key is required.
globalThis.fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
  const body = JSON.parse(String(init?.body)) as {
    functionId: string;
    instanceData?: string;
    args?: unknown[];
  };
  let result: unknown;
  switch (body.functionId) {
    case 'Math.floor':
      result = 7;
      break;
    case 'JSON.stringify':
      result = '{"name":"neuro"}';
      break;
    case 'Array.prototype.reduce': {
      const arr = JSON.parse(body.instanceData!) as number[];
      result = arr.reduce((a, b) => a + b, 0);
      break;
    }
    case 'String.prototype.includes':
      result = true;
      break;
    default:
      throw new Error(`Unstubbed functionId in TS-CJS smoke: ${body.functionId}`);
  }
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

configureClient({ proxyUrl: 'https://neuro.example.test/proxy' });

// Top-level await is not supported in CJS output format; wrap in IIFE.
(async () => {
  // Native fallback - no prompt, no stub hit.
  const pow: number = await neuro.math.pow({ x: 2, y: 10 });
  assert.equal(pow, 1024);
  console.log(`  -> neuro.math.pow (native):             ${pow}`);

  const joined: string = await neuro.array.join({ array: ['a', 'b', 'c'], separator: '-' });
  assert.equal(joined, 'a-b-c');
  console.log(`  -> neuro.array.join (native):           ${joined}`);

  const trimmed: string = await neuro.string.trim({ string: '  hello  ' });
  assert.equal(trimmed, 'hello');
  console.log(`  -> neuro.string.trim (native):          ${trimmed}`);

  // LLM path - prompt present, hits stub.
  const floored: number = await neuro.math.floor({ x: 7.9, prompt: 'round down' });
  assert.equal(floored, 7);
  console.log(`  -> neuro.math.floor (LLM):              ${floored}`);

  const serialised: string = await neuro.json.stringify({
    value: { name: 'neuro' },
    prompt: 'compact',
  });
  assert.equal(serialised, '{"name":"neuro"}');
  console.log(`  -> neuro.json.stringify (LLM):          ${serialised}`);

  const sum: number = await neuro.array.reduce({
    array: [1, 2, 3, 4],
    callbackfn: (a: number, b: number) => a + b,
    initialValue: 0,
    prompt: 'sum all values',
  });
  assert.equal(sum, 10);
  console.log(`  -> neuro.array.reduce (LLM):            ${sum}`);

  const includes: boolean = await neuro.string.includes({
    string: 'neuro-ts rocks',
    searchString: 'neuro',
    prompt: 'check if neuro is in the string',
  });
  assert.equal(includes, true);
  console.log(`  -> neuro.string.includes (LLM):         ${includes}`);

  console.log('\nTypeScript CJS smoke passed.');
})();
