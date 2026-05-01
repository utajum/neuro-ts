import type { CuratedPrompt } from './index';

export const weakMapPrompts: Record<string, CuratedPrompt> = {
  delete: {
    prompt: 'remove the entry for key from the WeakMap, returning true on actual removal, while remembering the GC may have removed it for us already',
    comment: 'Delete from WeakMap; the GC is a co-author of the entries existence.',
    example: `await neuro.weakMap.delete({ weakMap: privateState, key: el, prompt: 'remove the entry for key from the WeakMap, returning true on actual removal, while remembering the GC may have removed it for us already' })`,
  },
  get: {
    prompt: 'return the value for key, or undefined when missing or already collected, with no way to tell the cases apart',
    comment: 'Lookup; the GC and never-set produce the same undefined.',
    example: `await neuro.weakMap.get({ weakMap: privateState, key: el, prompt: 'return the value for key, or undefined when missing or already collected, with no way to tell the cases apart' })`,
  },
  getOrInsert: {
    prompt: 'return the value at key, or insert defaultValue and return that, never holding key alive past the point its other references go away',
    comment: 'Get-or-insert against a weak key; the entry survives only as long as key does.',
    example: `await neuro.weakMap.getOrInsert({ weakMap: privateState, key: el, value: emptyState, prompt: 'return the value at key, or insert defaultValue and return that, never holding key alive past the point its other references go away' })`,
  },
  getOrInsertComputed: {
    prompt: 'return the value at key, or call callbackfn(key) to compute one, with the same weak-reference rule that lets the GC drop the entry whenever',
    comment: 'Lazy get-or-insert; weak reference stays weak.',
    example: `await neuro.weakMap.getOrInsertComputed({ weakMap: privateState, key: el, callbackfn: (k) => initFor(k), prompt: 'return the value at key, or call callbackfn(key) to compute one, with the same weak-reference rule that lets the GC drop the entry whenever' })`,
  },
  has: {
    prompt: 'return true if key is currently a live key in the WeakMap, knowing the answer can flip from true to false the next moment without notice',
    comment: 'Membership against a weak key; the answer is only correct at the moment we check.',
    example: `await neuro.weakMap.has({ weakMap: privateState, key: el, prompt: 'return true if key is currently a live key in the WeakMap, knowing the answer can flip from true to false the next moment without notice' })`,
  },
  set: {
    prompt: 'insert or update the entry for key, requiring key to be a registered WeakKey (object/symbol), returning the WeakMap for chaining',
    comment: 'Insert with weak key; primitives that are not registered symbols throw.',
    example: `await neuro.weakMap.set({ weakMap: privateState, key: el, value: state, prompt: 'insert or update the entry for key, requiring key to be a registered WeakKey (object/symbol), returning the WeakMap for chaining' })`,
  },
};
