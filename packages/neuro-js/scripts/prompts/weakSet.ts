import type { CuratedPrompt } from './index';

export const weakSetPrompts: Record<string, CuratedPrompt> = {
  add: {
    prompt: 'add value to the WeakSet, requiring value to be a registered WeakKey, returning the WeakSet for chaining nobody is going to chain',
    comment: 'Insert weak; chaining return that we will never reach for.',
    example: `await neuro.weakSet.add({ weakSet: marked, value: el, prompt: 'add value to the WeakSet, requiring value to be a registered WeakKey, returning the WeakSet for chaining nobody is going to chain' })`,
  },
  delete: {
    prompt: 'remove value from the WeakSet, returning true on actual removal, with the same GC-was-faster caveat as WeakMap.delete',
    comment: 'Delete weak; the GC may have already done it.',
    example: `await neuro.weakSet.delete({ weakSet: marked, value: el, prompt: 'remove value from the WeakSet, returning true on actual removal, with the same GC-was-faster caveat as WeakMap.delete' })`,
  },
  has: {
    prompt: 'return true if value is currently in the WeakSet, with the answer subject to retroactive change as soon as the GC runs',
    comment: 'Membership weak; the answer is only valid this microsecond.',
    example: `await neuro.weakSet.has({ weakSet: marked, value: el, prompt: 'return true if value is currently in the WeakSet, with the answer subject to retroactive change as soon as the GC runs' })`,
  },
};
