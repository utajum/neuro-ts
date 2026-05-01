/* eslint-disable import/no-relative-packages */
import { describe, expect, test } from 'vitest';
// See native-fallback.test.ts for why we import from dist.
import { neuro } from '../dist/index.js';
import prompts from '../dist/prompts.json' with { type: 'json' };

describe('neuro namespace', () => {
  test('canonical groups exist', () => {
    expect(typeof neuro.math).toBe('object');
    expect(typeof neuro.array).toBe('object');
    expect(typeof neuro.string).toBe('object');
    expect(typeof neuro.object).toBe('object');
    expect(typeof neuro.json).toBe('object');
    expect(typeof neuro.date).toBe('object');
    expect(typeof neuro.number).toBe('object');
    expect(typeof neuro.promise).toBe('object');
  });

  test('each method on every group is a function', () => {
    const missing: string[] = [];
    for (const [groupName, groupValue] of Object.entries(neuro)) {
      if (typeof groupValue !== 'object' || groupValue === null) continue;
      for (const [name, fn] of Object.entries(groupValue)) {
        if (typeof fn !== 'function') missing.push(`${groupName}.${name}`);
      }
    }
    expect(missing, missing.slice(0, 10).join(',')).toEqual([]);
  });

  test('prompts.json keys all map to working namespace functions', () => {
    const keys = Object.keys(prompts);
    expect(keys.length).toBeGreaterThan(500);
    const missing: string[] = [];
    for (const key of keys) {
      // key shape: `neuro.math.random` or `neuro.parseInt`
      const parts = key.split('.');
      let cur: unknown = neuro;
      for (const p of parts.slice(1)) {
        cur = (cur as Record<string, unknown>)?.[p];
      }
      if (typeof cur !== 'function') missing.push(key);
    }
    expect(missing, missing.slice(0, 10).join(',')).toEqual([]);
  });

  test('every method has a curated prompt entry (no fallback templates)', () => {
    const missingCurated: string[] = [];
    for (const [key, entry] of Object.entries(prompts as Record<string, { curated?: unknown }>)) {
      if (!entry?.curated) missingCurated.push(key);
    }
    expect(missingCurated, missingCurated.slice(0, 10).join(',')).toEqual([]);
  });

  test('top-level globals exposed at neuro.<name>', () => {
    expect(typeof neuro.parseInt).toBe('function');
    expect(typeof neuro.encodeURI).toBe('function');
    expect(typeof neuro.isNaN).toBe('function');
  });
});
