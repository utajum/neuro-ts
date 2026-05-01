/**
 * Native fallback: every wrapped method called WITHOUT a `prompt` field
 * delegates to the underlying built-in and returns its result wrapped in
 * a Promise. No LLM client is configured in these tests; if a request
 * leaks to the network the test will fail.
 */
/* eslint-disable import/no-relative-packages */
import { afterEach, describe, expect, test } from 'vitest';
// Imports the built distribution so Vitest's vite-node transformer is not
// asked to parse the ~30 large generated namespace files at test time.
// `pretest` runs `pnpm build` to keep this fresh.
import { neuro, resetClient } from '../dist/index.js';

afterEach(() => resetClient());

describe('native fallback (object shape, no prompt)', () => {
  test('neuro.math.random returns a finite number in [0, 1)', async () => {
    const v = await neuro.math.random({});
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  test('neuro.math.max behaves like Math.max', async () => {
    expect(await neuro.math.max({ values: [1, 2, 3] })).toBe(3);
    expect(await neuro.math.max({ values: [-5, -1, -10] })).toBe(-1);
  });

  test('neuro.math.floor', async () => {
    expect(await neuro.math.floor({ x: 4.7 })).toBe(4);
  });

  test('neuro.array.map mirrors Array.prototype.map', async () => {
    const r = await neuro.array.map({ array: [1, 2, 3], callbackfn: (n) => n * 2 });
    expect(r).toEqual([2, 4, 6]);
  });

  test('neuro.array.filter mirrors Array.prototype.filter', async () => {
    const r = await neuro.array.filter({ array: [1, 2, 3, 4], predicate: (n) => n > 2 });
    expect(r).toEqual([3, 4]);
  });

  test('neuro.array.reduce mirrors Array.prototype.reduce', async () => {
    const r = await neuro.array.reduce({
      array: [1, 2, 3],
      callbackfn: (a: number, b: number) => a + b,
      initialValue: 0,
    });
    expect(r).toBe(6);
  });

  test('neuro.array.of (variadic) packs items', async () => {
    expect(await neuro.array.of({ items: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  test('neuro.string.toUpperCase', async () => {
    expect(await neuro.string.toUpperCase({ string: 'hello' })).toBe('HELLO');
  });

  test('neuro.string.split', async () => {
    expect(await neuro.string.split({ string: 'hello world', separator: ' ' })).toEqual([
      'hello',
      'world',
    ]);
  });

  test('neuro.object.keys returns own enumerable keys', async () => {
    expect(await neuro.object.keys({ o: { a: 1, b: 2 } })).toEqual(['a', 'b']);
  });

  test('neuro.json.stringify / parse roundtrip', async () => {
    const s = await neuro.json.stringify({ value: { a: 1 } });
    expect(s).toBe('{"a":1}');
    expect(await neuro.json.parse({ text: s as string })).toEqual({ a: 1 });
  });

  test('neuro.date.now returns current time', async () => {
    const before = Date.now();
    const v = await neuro.date.now({});
    const after = Date.now();
    expect(v).toBeGreaterThanOrEqual(before);
    expect(v).toBeLessThanOrEqual(after);
  });

  test('neuro.parseInt (global)', async () => {
    expect(await neuro.parseInt({ string: '42 widgets' })).toBe(42);
    expect(await neuro.parseInt({ string: 'ff', radix: 16 })).toBe(255);
  });

  test('iterator-returning methods still expose native fallback', async () => {
    const arr = [10, 20, 30];
    const keys = (await neuro.array.keys({ array: arr })) as IterableIterator<number>;
    expect(Array.from(keys)).toEqual([0, 1, 2]);
  });

  test('Set with native fallback', async () => {
    const s = new Set([1, 2, 3]);
    expect(await neuro.set.has({ set: s, value: 2 })).toBe(true);
    expect(await neuro.set.has({ set: s, value: 99 })).toBe(false);
  });

  test('empty prompt string is treated as absent', async () => {
    // Empty / whitespace-only `prompt` falls through to native dispatch
    // with no LLM call attempted (no client is configured).
    const v = await neuro.math.floor({ x: 4.7, prompt: '' });
    expect(v).toBe(4);
  });

  test('Date setter with collision-renamed param works natively', async () => {
    const d = new Date(2026, 0, 1);
    // `setDate(date)` collides with the receiver key `date`; the
    // generator renames the param to `date_arg` for the input shape.
    await neuro.date.setDate({ date: d, date_arg: 15 });
    expect(d.getDate()).toBe(15);
  });
});
