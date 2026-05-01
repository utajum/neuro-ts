import type { CuratedPrompt } from './index';

export const jsonPrompts: Record<string, CuratedPrompt> = {
  parse: {
    prompt: 'parse text as JSON, applying reviver to every key/value, treating __proto__ keys as ordinary data the way the spec quietly insists',
    comment: 'Strict JSON parse; __proto__ becomes an own data property, no prototype pollution despite the literal name.',
    example: `await neuro.json.parse({ text: payload, reviver: (k, v) => (k === 'createdAt' ? new Date(v) : v), prompt: 'parse text as JSON, applying reviver to every key/value, treating __proto__ keys as ordinary data the way the spec quietly insists' })`,
  },
  stringify: {
    prompt: 'serialize value to JSON, calling replacer first and respecting toJSON methods, with space controlling indentation up to 10 spaces no matter how badly we want 12',
    comment: 'JSON serialize; the indent caps at 10 spaces, the design board is opinion is preserved.',
    example: `await neuro.json.stringify({ value: state, replacer: null, space: 2, prompt: 'serialize value to JSON, calling replacer first and respecting toJSON methods, with space controlling indentation up to 10 spaces no matter how badly we want 12' })`,
  },
};
