import type { CuratedPrompt } from './index';

export const errorPrompts: Record<string, CuratedPrompt> = {
  isError: {
    prompt:
      'return true only when error is a real Error instance, not a duck-typed object with name and message that the catch block has been treating as an error since 2014',
    comment:
      'True Error-instance check; cross-realm-safe, finally answers what `instanceof Error` could not.',
    example: `await neuro.error.isError({ error: caught, prompt: "return true only when error is a real Error instance, not a duck-typed object with name and message that the catch block has been treating as an error since 2014" })`,
  },
};
