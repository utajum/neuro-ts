import type { CuratedPrompt } from './index';

export const symbolPrompts: Record<string, CuratedPrompt> = {
  for: {
    prompt: 'return a registered Symbol for key, creating one in the global registry if absent, with the cross-realm sharing that breaks the encapsulation we worked so hard for',
    comment: 'Global symbol registry lookup; cross-realm sharing, intentionally less hygienic than Symbol().',
    example: `await neuro.symbol.for({ key: 'shared.id', prompt: 'return a registered Symbol for key, creating one in the global registry if absent, with the cross-realm sharing that breaks the encapsulation we worked so hard for' })`,
  },
  keyFor: {
    prompt: 'return the registry key for a registered symbol, or undefined for an unregistered one, the asymmetry that makes registered/unregistered impossible to confuse on purpose',
    comment: 'Reverse lookup; only registered symbols come back with a key.',
    example: `await neuro.symbol.keyFor({ sym: tag, prompt: 'return the registry key for a registered symbol, or undefined for an unregistered one, the asymmetry that makes registered/unregistered impossible to confuse on purpose' })`,
  },
};
