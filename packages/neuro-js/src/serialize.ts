/**
 * Safely serialize an instance value for inclusion in an LLM prompt.
 * Truncates large outputs and handles non-JSON types (TypedArray, Map, Set,
 * Date, RegExp, BigInt, functions). Sanitises before {@link JSON.stringify} to
 * bypass `Date.prototype.toJSON` and similar coercions.
 */
const MAX_LEN = 8000;

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'bigint') return `${(value as bigint).toString()}n`;
  if (t === 'function') return `[Function: ${(value as { name?: string }).name || 'anonymous'}]`;
  if (t === 'symbol') return (value as symbol).toString();
  if (t !== 'object') return value;

  const obj = value as object;
  if (seen.has(obj)) return '[Circular]';
  seen.add(obj);

  if (value instanceof Date) return { __type: 'Date', iso: value.toISOString() };
  if (value instanceof RegExp)
    return { __type: 'RegExp', source: value.source, flags: value.flags };
  if (value instanceof Error) return { __type: 'Error', name: value.name, message: value.message };
  if (value instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(value.entries()).map(([k, v]) => [sanitize(k, seen), sanitize(v, seen)]),
    };
  }
  if (value instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(value.values()).map((v) => sanitize(v, seen)),
    };
  }
  if (ArrayBuffer.isView(value)) {
    const ctor = (value as { constructor: { name: string } }).constructor.name;
    const arr = Array.from(value as unknown as ArrayLike<number | bigint>).map((n) =>
      typeof n === 'bigint' ? `${n}n` : n,
    );
    return { __type: ctor, data: arr };
  }
  if (Array.isArray(value)) return value.map((v) => sanitize(v, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = sanitize(v, seen);
  }
  return out;
}

export function serializeForPrompt(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  let out: string;
  try {
    const sanitised = sanitize(value);
    out = JSON.stringify(sanitised);
    if (out === undefined) out = String(value);
  } catch {
    try {
      out = String(value);
    } catch {
      out = '[unserializable]';
    }
  }
  if (out.length > MAX_LEN) {
    return `${out.slice(0, MAX_LEN)}\n...[truncated ${out.length - MAX_LEN} chars]`;
  }
  return out;
}
