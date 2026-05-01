/**
 * End-to-end demo against a real OpenAI key. Reads `OPENAI_API_KEY` from the
 * environment. Makes billable requests.
 *
 * Run with:
 *   OPENAI_API_KEY=sk-... node index.mjs
 */
import { configureClient, neuro } from 'neuro-ts';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Set OPENAI_API_KEY to run the live demo. (Use smoke.mjs for offline tests.)');
  process.exit(2);
}

configureClient({ apiKey, model: process.env.NEURO_MODEL ?? 'gpt-4o' });

console.log(
  '1.',
  await neuro.math.random({
    prompt: 'a number between 0.4 and 0.5',
  }),
);

console.log(
  '2.',
  await neuro.array.map({
    array: [1, 2, 3],
    callbackfn: (n) => n,
    prompt: 'double each value',
  }),
);

console.log(
  '3.',
  await neuro.string.split({
    string: 'the quick brown fox',
    separator: ' ',
    prompt: 'split into words',
  }),
);

console.log(
  '4.',
  await neuro.json.stringify({
    value: { a: 1, b: { c: 2 } },
    space: 2,
    prompt: 'pretty print indentation',
  }),
);

console.log('5. (native)', await neuro.math.max({ values: [1, 5, 10] }));
