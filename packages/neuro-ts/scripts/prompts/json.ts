import type { CuratedPrompt } from './index';

export const jsonPrompts: Record<string, CuratedPrompt> = {
  parse: {
    prompt:
      'parse this JSON string into an object, and if it has single quotes, trailing commas, or truncated keys that JSON.parse would throw on, fix it and parse anyway - the upstream team ships broken JSON and we stopped filing tickets',
    comment: 'AI-assisted parse; heals the malformed JSON the upstream insists is valid.',
    example: `await neuro.json.parse({ text: payload, reviver: (k, v) => (k === 'createdAt' ? new Date(v) : v), prompt: "parse this JSON string into an object, and if it has single quotes, trailing commas, or truncated keys that JSON.parse would throw on, fix it and parse anyway - the upstream team ships broken JSON and we stopped filing tickets" })`,
  },
  stringify: {
    prompt:
      'serialize this object to a JSON string, silently dropping every undefined, function, and Symbol the way the format decided are not real data - and remember circular references are still your problem',
    comment:
      'Serialize with silent drops; undefined, functions, and Symbols vanish without a word.',
    example: `await neuro.json.stringify({ value: state, replacer: null, space: 2, prompt: 'serialize this object to a JSON string, silently dropping every undefined, function, and Symbol the way the format decided are not real data - and remember circular references are still your problem' })`,
  },
};
