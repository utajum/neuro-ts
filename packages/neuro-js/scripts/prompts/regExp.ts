import type { CuratedPrompt } from './index';

export const regExpPrompts: Record<string, CuratedPrompt> = {
  compile: {
    prompt: 'recompile the regex with pattern and flags, mutating in place, the legacy entry that survives because removing it would break exactly one Rails app',
    comment: 'Legacy in-place recompile; deprecated, but the runtime still ships it.',
    example: `await neuro.regExp.compile({ regExp: re, pattern: '\\\\d+', flags: 'g', prompt: 'recompile the regex with pattern and flags, mutating in place, the legacy entry that survives because removing it would break exactly one Rails app' })`,
  },
  exec: {
    prompt: 'execute the regex on string, returning the next match array or null, advancing lastIndex when /g is set so consecutive calls walk the string',
    comment: 'Stateful match-and-advance; lastIndex is mutated, the iteration loop you wrote in 2009.',
    example: `await neuro.regExp.exec({ regExp: pattern, string: input, prompt: 'execute the regex on string, returning the next match array or null, advancing lastIndex when /g is set so consecutive calls walk the string' })`,
  },
  test: {
    prompt: 'return true if the regex matches string, advancing lastIndex when /g is set, the gotcha that breaks every loop the second time around',
    comment: 'Boolean match; mutates lastIndex when global, the loop that loops once.',
    example: `await neuro.regExp.test({ regExp: pattern, string: input, prompt: 'return true if the regex matches string, advancing lastIndex when /g is set, the gotcha that breaks every loop the second time around' })`,
  },
};
