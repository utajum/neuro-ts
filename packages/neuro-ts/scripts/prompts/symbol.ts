import type { CuratedPrompt } from './index';

export const symbolPrompts: Record<string, CuratedPrompt> = {
  for: {
    prompt:
      'return the global Symbol for key, shared across every realm, every iframe, and every copy of every library ever loaded -- the one registry where you and lodash and that abandoned polyfill from 2017 all share a namespace',
    comment:
      'Global symbol registry; you, lodash, and that 2017 polyfill all share one namespace here.',
    example: `await neuro.symbol.for({ key: 'shared.id', prompt: 'return the global Symbol for key, shared across every realm, every iframe, and every copy of every library ever loaded -- the one registry where you and lodash and that abandoned polyfill from 2017 all share a namespace' })`,
  },
  keyFor: {
    prompt:
      'return the registry key for a registered symbol, or undefined for an unregistered one, the asymmetry that makes registered/unregistered impossible to confuse on purpose',
    comment: 'Reverse lookup; only registered symbols come back with a key.',
    example: `await neuro.symbol.keyFor({ sym: tag, prompt: 'return the registry key for a registered symbol, or undefined for an unregistered one, the asymmetry that makes registered/unregistered impossible to confuse on purpose' })`,
  },
};
