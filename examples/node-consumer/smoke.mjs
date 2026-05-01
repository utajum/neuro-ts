/**
 * Runtime smoke test. Imports the published `neuro-ts` build, configures a
 * `proxyUrl` client backed by a stub `fetch`, and exercises a handful of
 * methods from different built-in groups using the new object-shape API.
 *
 * No network required. CI runs this against the tarball produced by
 * `npm pack` to verify a real install path.
 *
 * Exit code 0 on success.
 */
import assert from 'node:assert/strict';
import { configureClient, neuro } from 'neuro-ts';

// Stub fetch -- answers each request with a fixture matching the original
// JS behaviour. Lets us exercise the SDK end-to-end without an API key.
globalThis.fetch = async (_url, init) => {
  const body = JSON.parse(String(init?.body));
  const fid = body.functionId;
  let result;
  switch (fid) {
    case 'Array.prototype.map': {
      const arr = JSON.parse(body.instanceData);
      result = arr.map((n) => n * 2);
      break;
    }
    case 'JSON.stringify':
      result = '{"hello":"world"}';
      break;
    case 'Math.random':
      result = 0.42;
      break;
    case 'Object.keys':
      result = ['a', 'b'];
      break;
    case 'String.prototype.split':
      result = JSON.parse(body.instanceData).split(' ');
      break;
    default:
      throw new Error(`Unstubbed functionId: ${fid}`);
  }
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

configureClient({ proxyUrl: 'https://neuro.example.test/proxy' });

const checks = [
  [
    'neuro.array.map (LLM)',
    () => neuro.array.map({ array: [1, 2, 3], callbackfn: (n) => n, prompt: 'double each' }),
    [2, 4, 6],
  ],
  [
    'neuro.array.map (native)',
    () => neuro.array.map({ array: [1, 2, 3], callbackfn: (n) => n * 5 }),
    [5, 10, 15],
  ],
  [
    'neuro.json.stringify (LLM)',
    () => neuro.json.stringify({ value: { hello: 'world' }, prompt: 'compact' }),
    '{"hello":"world"}',
  ],
  ['neuro.json.stringify (native)', () => neuro.json.stringify({ value: { a: 1 } }), '{"a":1}'],
  ['neuro.math.random (LLM)', () => neuro.math.random({ prompt: 'any number near 0.42' }), 0.42],
  [
    'neuro.object.keys (LLM)',
    () => neuro.object.keys({ o: { a: 1, b: 2 }, prompt: 'just give the keys' }),
    ['a', 'b'],
  ],
  [
    'neuro.string.split (LLM)',
    () =>
      neuro.string.split({
        string: 'hello world',
        separator: ' ',
        prompt: 'on whitespace',
      }),
    ['hello', 'world'],
  ],
  [
    'neuro.string.split (native)',
    () => neuro.string.split({ string: 'a,b,c', separator: ',' }),
    ['a', 'b', 'c'],
  ],
  ['neuro.math.max (native)', () => neuro.math.max({ values: [1, 5, 10] }), 10],
];

for (const [name, fn, expected] of checks) {
  process.stdout.write(`  -> ${name}: `);
  const out = await fn();
  assert.deepStrictEqual(out, expected, `${name} returned ${JSON.stringify(out)}`);
  console.log(`ok ${JSON.stringify(out)}`);
}

console.log('\nAll smoke tests passed.');
