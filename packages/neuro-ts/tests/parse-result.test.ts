import { describe, expect, test } from 'vitest';
import { parseLLMResult } from '../src/parse-result';

describe('parseLLMResult', () => {
  test('parses JSON', () => {
    expect(parseLLMResult('[1, 2, 3]')).toEqual([1, 2, 3]);
    expect(parseLLMResult('{"a":1}')).toEqual({ a: 1 });
  });

  test('strips ```json fences', () => {
    expect(parseLLMResult('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseLLMResult('```\n42\n```')).toBe(42);
  });

  test('returns undefined for empty / "undefined"', () => {
    expect(parseLLMResult('')).toBeUndefined();
    expect(parseLLMResult('undefined')).toBeUndefined();
    expect(parseLLMResult(null)).toBeUndefined();
  });

  test('returns null for "null"', () => {
    expect(parseLLMResult('null')).toBeNull();
  });

  test('falls back to numbers / booleans', () => {
    expect(parseLLMResult('42')).toBe(42);
    expect(parseLLMResult('true')).toBe(true);
    expect(parseLLMResult('false')).toBe(false);
  });

  test('falls back to raw string', () => {
    expect(parseLLMResult('hello world')).toBe('hello world');
  });

  test('returns undefined for whitespace-only input', () => {
    expect(parseLLMResult('   ')).toBeUndefined();
    expect(parseLLMResult('\t\n')).toBeUndefined();
  });

  test('negative numbers are parsed', () => {
    expect(parseLLMResult('-42')).toBe(-42);
    expect(parseLLMResult('-3.14')).toBe(-3.14);
  });

  test('exponent notation is parsed via JSON.parse (not the number regex)', () => {
    // JSON.parse('1e5') === 100000, so the value arrives as a number, not a string.
    // The number regex /^-?\d+(\.\d+)?$/ would not match "1e5", but JSON.parse
    // runs first and handles scientific notation correctly.
    expect(parseLLMResult('1e5')).toBe(100000);
    expect(parseLLMResult('1.5e+2')).toBe(150);
  });

  test('single-quote-wrapped string is unwrapped', () => {
    expect(parseLLMResult("'hello'")).toBe('hello');
  });

  test('backtick-wrapped value is unwrapped as string', () => {
    // Single backtick wrapping (not a code fence) returns the inner content as a string.
    expect(parseLLMResult('`hello`')).toBe('hello');
    // Note: numeric content inside backticks comes out as a string, not a number,
    // because the backtick branch does text.slice(1,-1) without further parsing.
    expect(parseLLMResult('`42`')).toBe('42');
  });

  test('strips typescript/javascript fences', () => {
    expect(parseLLMResult('```typescript\n42\n```')).toBe(42);
    expect(parseLLMResult('```js\n[1,2]\n```')).toEqual([1, 2]);
  });
});
