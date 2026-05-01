/**
 * Generated-method runtime helper.
 *
 * Every wrapper in `src/generated/groups/*.ts` is a thin async function that
 * forwards to `runMethod(spec, input)`. The wrapper takes a single object
 * literal whose keys are the original parameter names from the TypeScript
 * lib signature plus an optional `prompt: string`. The runtime decides the
 * dispatch path based on whether `prompt` is present and non-empty.
 *
 *   - `prompt` missing / empty string  -> native built-in (no LLM call).
 *   - `prompt` is a non-empty string   -> route to the configured LLM.
 *
 * The named-argument shape removes the trailing-string ambiguity the
 * original positional API had (e.g. `neuro.array.of('a', 'b', 'prompt?')`
 * could not tell items from prompt). With `{ items: ['a','b'], prompt: '...' }`
 * the boundary is explicit.
 */
import { getClient } from './client-instance';
import { NeuroClientError } from './errors';
import type { SignatureHint } from './types';

export interface GeneratedMethodSpec {
  /** Wrapper namespace, e.g. `math`. */
  readonly group: string;
  /** Original method name, e.g. `random`. */
  readonly methodName: string;
  /** Fully qualified id sent to the LLM, e.g. `Array.prototype.map`. */
  readonly functionId: string;
  /** instance = first arg of native call is the receiver. */
  readonly kind: 'instance' | 'static' | 'global';
  /** Pre-resolved native implementation, or `null` if no fallback exists. */
  readonly native: ((this: unknown, ...args: unknown[]) => unknown) | null;
  /**
   * Object-literal key the runtime reads to obtain the receiver for instance
   * methods (e.g. `array`, `string`, `set`). Empty string for static methods.
   */
  readonly receiverKey: string;
  /**
   * Ordered list of native parameter names (excluding the receiver). Native
   * dispatch reads `input[name]` for each entry, in order, to reconstruct
   * the positional arguments.
   */
  readonly paramOrder: readonly string[];
  /**
   * Variadic parameter name (the rest-parameter's identifier from the TS
   * lib signature). Empty when the method is not variadic. When set, the
   * runtime expects `input[variadicKey]` to be an array; native dispatch
   * spreads it past any preceding fixed parameters.
   */
  readonly variadicKey: string;
  /** Frozen prompt sent to the LLM. */
  readonly systemPrompt: string;
  /** Parameter hints passed to the LLM along with the prompt. */
  readonly signatureHint: readonly SignatureHint[];
}

/**
 * Pull the prompt out of the input object, treating empty strings as
 * absent so callers cannot accidentally bill OpenAI for a no-op intent.
 * Returns the prompt (or `undefined`) plus a copy of the input with the
 * `prompt` key removed.
 */
function extractPrompt(input: Record<string, unknown>): {
  prompt: string | undefined;
  rest: Record<string, unknown>;
} {
  if (input == null || typeof input !== 'object') {
    throw new NeuroClientError(
      'neuro-js wrappers expect a single object argument, e.g. neuro.array.map({ array, callbackfn, prompt? }).',
    );
  }
  const { prompt, ...rest } = input;
  if (typeof prompt === 'string' && prompt.trim().length > 0) {
    return { prompt, rest };
  }
  return { prompt: undefined, rest };
}

/**
 * Project the named input back to positional arguments for a native call.
 * Receiver (instance methods) is returned separately. Variadic items are
 * spread after any fixed arguments.
 */
function projectNativeArgs(
  spec: GeneratedMethodSpec,
  rest: Record<string, unknown>,
): { receiver: unknown; positional: unknown[] } {
  const positional: unknown[] = [];
  for (const name of spec.paramOrder) {
    positional.push(rest[name]);
  }
  if (spec.variadicKey) {
    const variadicValue = rest[spec.variadicKey];
    if (variadicValue !== undefined) {
      if (!Array.isArray(variadicValue)) {
        throw new NeuroClientError(
          `\`${spec.functionId}\`: expected \`${spec.variadicKey}\` to be an array, got ${typeof variadicValue}.`,
        );
      }
      // The variadic name itself is also in paramOrder so we can keep the
      // declaration order consistent. Drop the placeholder we just pushed
      // and replace it with the spread items.
      const idx = spec.paramOrder.indexOf(spec.variadicKey);
      if (idx >= 0) {
        positional.splice(idx, 1, ...(variadicValue as unknown[]));
      } else {
        positional.push(...(variadicValue as unknown[]));
      }
    } else {
      // Drop the placeholder for an absent variadic key.
      const idx = spec.paramOrder.indexOf(spec.variadicKey);
      if (idx >= 0) positional.splice(idx, 1);
    }
  }
  // Trim trailing `undefined`s so native methods that branch on
  // `arguments.length` (e.g. `Array.prototype.slice`) see the right shape.
  while (positional.length > 0 && positional[positional.length - 1] === undefined) {
    positional.pop();
  }
  const receiver = spec.receiverKey ? rest[spec.receiverKey] : undefined;
  return { receiver, positional };
}

/** Execute a native (no-prompt) call. */
function runNative(spec: GeneratedMethodSpec, rest: Record<string, unknown>): unknown {
  if (!spec.native) {
    throw new NeuroClientError(
      `\`${spec.functionId}\` cannot run natively from neuro-js. Provide a \`prompt\` field to route through the LLM.`,
    );
  }
  const { receiver, positional } = projectNativeArgs(spec, rest);
  if (spec.kind === 'instance') {
    return spec.native.apply(receiver, positional);
  }
  return spec.native.apply(undefined, positional);
}

/**
 * Build the named-args record sent to the LLM. The receiver lives under
 * the spec's `receiverKey`; the rest are forwarded verbatim. Variadic
 * items stay under their declared array key. The `prompt` key is excluded
 * because the client already sees it on the top-level payload.
 */
function buildLLMArgs(
  spec: GeneratedMethodSpec,
  rest: Record<string, unknown>,
): { instance: unknown; args: Record<string, unknown> } {
  const instance = spec.kind === 'instance' && spec.receiverKey ? rest[spec.receiverKey] : null;
  const args: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (spec.kind === 'instance' && k === spec.receiverKey) continue;
    args[k] = v;
  }
  return { instance, args };
}

/**
 * Run a wrapper. Returns a Promise of the original return type.
 *
 * The promise resolves to the LLM-returned value (parsed) when a prompt is
 * present, or to the native result otherwise. Native methods that already
 * return a Promise are awaited and re-wrapped to keep the caller's types
 * identical regardless of which branch ran.
 */
export async function runMethod(
  spec: GeneratedMethodSpec,
  input: Record<string, unknown>,
): Promise<unknown> {
  const { prompt, rest } = extractPrompt(input);

  if (prompt !== undefined) {
    const { instance, args } = buildLLMArgs(spec, rest);
    return getClient().executeFunction({
      functionId: spec.functionId,
      prompt,
      instance,
      args,
      signatureHint: [...spec.signatureHint],
      systemPrompt: spec.systemPrompt,
    });
  }

  return await runNative(spec, rest);
}

/**
 * Resolve a built-in by string id (e.g. `Array.prototype.map`, `Math.random`,
 * `globalThis.parseInt`). Returns `null` if not present at module-load time;
 * the generated wrapper will surface a clear error if the user calls
 * a missing fallback without supplying a prompt.
 */
export function resolveNative(
  functionId: string,
): ((this: unknown, ...args: unknown[]) => unknown) | null {
  const parts = functionId.split('.');
  let cur: unknown = globalThis;
  for (const part of parts) {
    if (cur == null) return null;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (typeof cur === 'function') return cur as (this: unknown, ...args: unknown[]) => unknown;
  return null;
}
