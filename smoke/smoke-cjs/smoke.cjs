/**
 * smoke.cjs - CommonJS consumer smoke test.
 *
 * Verifies that the published neuro-ts package is consumable via
 * CommonJS require(). Node resolves the "require" condition in the
 * exports map → ./dist/index.cjs.
 *
 * No real API key needed: fetch is stubbed to return fixture data.
 * Exit 0 on success.
 */
'use strict';

const assert = require('node:assert/strict');
const { configureClient, neuro } = require('neuro-ts');

// Stub fetch - answers each request with a fixture matching the
// original JS behaviour, so no network or API key is required.
globalThis.fetch = async (_url, init) => {
  const body = JSON.parse(String(init?.body));
  let result;
  switch (body.functionId) {
    case 'Math.random':
      result = 0.42;
      break;
    case 'JSON.stringify':
      result = '{"ok":true}';
      break;
    case 'Array.prototype.map': {
      const arr = JSON.parse(body.instanceData);
      result = arr.map((n) => n * 2);
      break;
    }
    case 'String.prototype.split':
      result = JSON.parse(body.instanceData).split(' ');
      break;
    default:
      throw new Error(`Unstubbed functionId in CJS smoke: ${body.functionId}`);
  }
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

configureClient({ proxyUrl: 'https://neuro.example.test/proxy' });

(async () => {
  // Native fallback - no prompt, no stub hit.
  const max = await neuro.math.max({ values: [3, 1, 4, 1, 5] });
  assert.equal(max, 5);
  console.log(`  -> neuro.math.max (native):           ${max}`);

  const lower = await neuro.string.toLowerCase({ string: 'HELLO' });
  assert.equal(lower, 'hello');
  console.log(`  -> neuro.string.toLowerCase (native): ${lower}`);

  const parsed = await neuro.json.parse({ text: '{"x":1}' });
  assert.deepStrictEqual(parsed, { x: 1 });
  console.log(`  -> neuro.json.parse (native):         ${JSON.stringify(parsed)}`);

  // LLM path - prompt present, hits stub.
  const rand = await neuro.math.random({ prompt: 'any' });
  assert.equal(rand, 0.42);
  console.log(`  -> neuro.math.random (LLM):           ${rand}`);

  const str = await neuro.json.stringify({ value: { ok: true }, prompt: 'compact' });
  assert.equal(str, '{"ok":true}');
  console.log(`  -> neuro.json.stringify (LLM):        ${str}`);

  const mapped = await neuro.array.map({
    array: [1, 2, 3],
    callbackfn: (n) => n,
    prompt: 'double each',
  });
  assert.deepStrictEqual(mapped, [2, 4, 6]);
  console.log(`  -> neuro.array.map (LLM):             ${JSON.stringify(mapped)}`);

  const split = await neuro.string.split({
    string: 'hello world',
    separator: ' ',
    prompt: 'on whitespace',
  });
  assert.deepStrictEqual(split, ['hello', 'world']);
  console.log(`  -> neuro.string.split (LLM):          ${JSON.stringify(split)}`);

  console.log('\nCJS smoke passed.');
})();
