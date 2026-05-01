import type { CuratedPrompt } from './index';

export const mapPrompts: Record<string, CuratedPrompt> = {
  clear: {
    prompt: 'remove every entry from the map, mutating in place, and trust that no observer is iterating us right at this exact moment',
    comment: 'Wipe the Map; concurrent iteration is the iterators problem, not the function is.',
    example: `await neuro.map.clear({ map: cache, prompt: 'remove every entry from the map, mutating in place, and trust that no observer is iterating us right at this exact moment' })`,
  },
  delete: {
    prompt: 'remove the entry under key, returning true if a key was actually present, the boolean every fluent API forgets is more honest than a void return',
    comment: 'Delete with truthy-on-actual-removal; the return is a boolean, not the value.',
    example: `await neuro.map.delete({ map: cache, key: id, prompt: 'remove the entry under key, returning true if a key was actually present, the boolean every fluent API forgets is more honest than a void return' })`,
  },
  entries: {
    prompt: 'yield [key, value] pairs in insertion order, the same order Object.entries promises only because Map decided to commit first',
    comment: 'Insertion-order pairs; same as Object.entries, except guaranteed since the spec said so.',
    example: `await neuro.map.entries({ map: cache, prompt: 'yield [key, value] pairs in insertion order, the same order Object.entries promises only because Map decided to commit first' })`,
  },
  forEach: {
    prompt: 'call callbackfn for every entry in insertion order, swallow the return value, and pretend mutation during iteration is undefined behaviour even though the spec is explicit about it',
    comment: 'Side-effecting iteration; mutating during forEach is defined, just unintuitive.',
    example: `await neuro.map.forEach({ map: cache, callbackfn: (v, k) => log(k, v), prompt: 'call callbackfn for every entry in insertion order, swallow the return value, and pretend mutation during iteration is undefined behaviour even though the spec is explicit about it' })`,
  },
  get: {
    prompt: 'return the value associated with key, or undefined when missing, indistinguishable from a stored undefined unless you also check has',
    comment: 'Lookup; missing-vs-stored-undefined is the classic ambiguity.',
    example: `await neuro.map.get({ map: cache, key: id, prompt: 'return the value associated with key, or undefined when missing, indistinguishable from a stored undefined unless you also check has' })`,
  },
  getOrInsert: {
    prompt: 'return the value at key, or insert defaultValue and return that, the lazy-init helper without the surprise of computing a default that was already there',
    comment: 'Get-or-insert with eager default; the eager twin of getOrInsertComputed.',
    example: `await neuro.map.getOrInsert({ map: cache, key: id, defaultValue: emptyState, prompt: 'return the value at key, or insert defaultValue and return that, the lazy-init helper without the surprise of computing a default that was already there' })`,
  },
  getOrInsertComputed: {
    prompt: 'return the value at key, or call callbackfn(key) to compute and insert one, exactly the lazy-init we kept reaching for memo libraries to provide',
    comment: 'Get-or-insert with lazy default; the long-awaited memoize-into-Map helper.',
    example: `await neuro.map.getOrInsertComputed({ map: cache, key: id, callbackfn: (k) => loadFor(k), prompt: 'return the value at key, or call callbackfn(key) to compute and insert one, exactly the lazy-init we kept reaching for memo libraries to provide' })`,
  },
  groupBy: {
    prompt: 'group items by the return value of callbackfn into a Map keyed on those values, preserving identity unlike Object.groupBy which stringifies them',
    comment: 'Map groupBy; preserves key identity, unlike Object.groupBy.',
    example: `await neuro.map.groupBy({ items: rows, callbackfn: (r) => r.kind, prompt: 'group items by the return value of callbackfn into a Map keyed on those values, preserving identity unlike Object.groupBy which stringifies them' })`,
  },
  has: {
    prompt: 'return true if key is in the map, the boolean we should always pair with get when undefined is a real value the consumers store',
    comment: 'Membership check; pair with get to disambiguate stored-undefined.',
    example: `await neuro.map.has({ map: cache, key: id, prompt: 'return true if key is in the map, the boolean we should always pair with get when undefined is a real value the consumers store' })`,
  },
  keys: {
    prompt: 'yield keys in insertion order, including the NaN key that strict-equality refuses to find but Map cheerfully stores',
    comment: 'Insertion-order key iterator; NaN is a valid key, deduplicated by SameValueZero.',
    example: `await neuro.map.keys({ map: cache, prompt: 'yield keys in insertion order, including the NaN key that strict-equality refuses to find but Map cheerfully stores' })`,
  },
  set: {
    prompt: 'insert or update the entry [key, value], returning the map for chaining, even though chained set calls read worse than a forEach the second time you see them',
    comment: 'Insert/update; returns the map, the chaining API the linter hates.',
    example: `await neuro.map.set({ map: cache, key: id, value: state, prompt: 'insert or update the entry [key, value], returning the map for chaining, even though chained set calls read worse than a forEach the second time you see them' })`,
  },
  values: {
    prompt: 'yield values in insertion order, the iterator twin of keys, ordered the way the spec promises and the consumer keeps assuming',
    comment: 'Insertion-order value iterator.',
    example: `await neuro.map.values({ map: cache, prompt: 'yield values in insertion order, the iterator twin of keys, ordered the way the spec promises and the consumer keeps assuming' })`,
  },
};
