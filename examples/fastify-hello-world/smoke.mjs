/**
 * Smoke: boot the Fastify server in-process, exercise both routes against
 * the native fallback path (no LLM, no network), shut it down. Confirms the
 * wiring between Fastify and `neuro-js` is intact and that the server
 * boots cleanly without an OPENAI_API_KEY.
 */
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { neuro } from 'neuro-js';

const app = Fastify({ logger: false });

app.get('/', async () => {
  return {
    greeting: await neuro.string.toUpperCase({ string: 'hello world from neuro-js' }),
  };
});

app.post('/transform', async (req, reply) => {
  const body = req.body ?? {};
  if (typeof body.input !== 'string' || !body.input) {
    return reply.code(400).send({ error: 'bad input' });
  }
  return { value: await neuro.string.toUpperCase({ string: body.input }) };
});

await app.listen({ port: 0, host: '127.0.0.1' });
const address = app.server.address();
const base = `http://127.0.0.1:${address.port}`;
console.log(`fastify smoke listening on ${base}`);

const helloRes = await fetch(`${base}/`).then((r) => r.json());
assert.equal(helloRes.greeting, 'HELLO WORLD FROM NEURO-JS');
console.log(`  -> GET /         -> ${JSON.stringify(helloRes)}`);

const transformRes = await fetch(`${base}/transform`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ input: 'neuro-js is online' }),
}).then((r) => r.json());
assert.equal(transformRes.value, 'NEURO-JS IS ONLINE');
console.log(`  -> POST /transform -> ${JSON.stringify(transformRes)}`);

await app.close();
console.log('Fastify smoke passed.');
