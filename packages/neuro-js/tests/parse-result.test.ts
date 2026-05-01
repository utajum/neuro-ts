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
});
