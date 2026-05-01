/**
 * Fastify hello-world that demonstrates a real-world `neuro-ts` integration.
 *
 *   GET  /            ->  classic hello (uses `neuro.string.toUpperCase` natively)
 *   POST /transform   ->  body { input: string, prompt?: string }
 *                          when `prompt` is set, the request is routed to the LLM;
 *                          otherwise the route returns the native upper-case result.
 *
 * The OpenAI key never leaves the server. Browsers should call `/transform`
 * via fetch -- the public surface is just the input + prompt.
 */
import 'dotenv/config';
import Fastify from 'fastify';
import { configureClient, neuro } from 'neuro-ts';

const apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  configureClient({ apiKey, model: process.env.NEURO_MODEL ?? 'gpt-4o' });
} else {
  // Without a key we can still serve native fallbacks. LLM-bound requests
  // will fail with a configuration error, which surfaces a clear 503.
  console.warn('[neuro-ts] OPENAI_API_KEY not set -- LLM routes will return 503.');
}

const app = Fastify({ logger: true });

app.get('/', async () => {
  const greeting = await neuro.string.toUpperCase({ string: 'hello world from neuro-ts' });
  return { greeting };
});

app.post('/transform', async (req, reply) => {
  const body = req.body ?? {};
  const input = typeof body.input === 'string' ? body.input : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt : undefined;
  if (!input) return reply.code(400).send({ error: 'body.input must be a non-empty string' });

  try {
    const value = prompt
      ? await neuro.string.toUpperCase({ string: input, prompt })
      : await neuro.string.toUpperCase({ string: input });
    return { value };
  } catch (err) {
    req.log.error(err);
    if ((err && err.name) === 'NeuroNotConfiguredError') {
      return reply.code(503).send({ error: 'neuro-ts client is not configured on this server' });
    }
    return reply.code(500).send({ error: 'transform failed' });
  }
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
