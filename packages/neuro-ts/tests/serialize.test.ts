import { describe, expect, test } from 'vitest';
import { serializeForPrompt } from '../src/serialize';

describe('serializeForPrompt', () => {
  test('plain values', () => {
    expect(serializeForPrompt([1, 2, 3])).toBe('[1,2,3]');
    expect(serializeForPrompt({ a: 1 })).toBe('{"a":1}');
    expect(serializeForPrompt(null)).toBe('null');
    expect(serializeForPrompt(undefined)).toBe('null');
  });

  test('special types', () => {
    expect(serializeForPrompt(new Date('2025-01-01T00:00:00Z'))).toContain('"__type":"Date"');
    expect(serializeForPrompt(new Map([['a', 1]]))).toContain('"__type":"Map"');
    expect(serializeForPrompt(new Set([1, 2]))).toContain('"__type":"Set"');
    expect(serializeForPrompt(/abc/g)).toContain('"__type":"RegExp"');
    expect(serializeForPrompt(new Uint8Array([1, 2]))).toContain('"__type":"Uint8Array"');
    expect(serializeForPrompt(123n)).toContain('"123n"');
  });

  test('truncates large strings', () => {
    const huge = 'x'.repeat(20000);
    const out = serializeForPrompt(huge);
    expect(out.length).toBeLessThan(20000);
    expect(out).toContain('truncated');
  });

  test('Error objects', () => {
    const err = new TypeError('bad input');
    const out = serializeForPrompt(err);
    expect(out).toContain('"__type":"Error"');
    expect(out).toContain('"TypeError"');
    expect(out).toContain('"bad input"');
  });

  test('Symbol serializes to its string representation', () => {
    const out = serializeForPrompt(Symbol('foo'));
    expect(out).toBe('"Symbol(foo)"');
  });

  test('function serializes to [Function: name]', () => {
    function myFunc() {}
    expect(serializeForPrompt(myFunc)).toBe('"[Function: myFunc]"');
    expect(serializeForPrompt(() => {})).toBe('"[Function: anonymous]"');
  });

  test('NaN serializes to null (JSON.stringify behaviour)', () => {
    // sanitize returns the number NaN; JSON.stringify(NaN) === 'null'
    expect(serializeForPrompt(NaN)).toBe('null');
  });

  test('Infinity and -Infinity serialize to null', () => {
    expect(serializeForPrompt(Infinity)).toBe('null');
    expect(serializeForPrompt(-Infinity)).toBe('null');
  });

  test('circular reference is replaced with [Circular]', () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    const out = serializeForPrompt(a);
    expect(out).toContain('"[Circular]"');
  });

  test('nested circular reference', () => {
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = { parent: a };
    a.child = b;
    const out = serializeForPrompt(a);
    expect(out).toContain('"[Circular]"');
  });
});
