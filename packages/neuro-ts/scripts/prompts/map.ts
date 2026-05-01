import type { CuratedPrompt } from './index';

export const mapPrompts: Record<string, CuratedPrompt> = {
  clear: {
    prompt:
      'remove every entry from the map, mutating in place, and if someone is mid-iteration that is between them and their iterator',
    comment: "Wipe the Map. If someone's iterating, that's between them and their iterator.",
    example: `await neuro.map.clear({ map: cache, prompt: 'remove every entry from the map, mutating in place, and if someone is mid-iteration that is between them and their iterator' })`,
  },
  delete: {
    prompt:
      'remove the entry under key, returning true if something was actually present - more honest than most deletion APIs',
    comment: 'Delete with a real boolean. Returns true only if the key existed. Radical honesty.',
    example: `await neuro.map.delete({ map: cache, key: id, prompt: 'remove the entry under key, returning true if something was actually present - more honest than most deletion APIs' })`,
  },
  entries: {
    prompt:
      'yield [key, value] pairs in insertion order, guaranteed because the spec said so, unlike Object.entries which just got lucky',
    comment: 'Insertion-order pairs. Guaranteed. Object.entries just happened to follow suit.',
    example: `await neuro.map.entries({ map: cache, prompt: 'yield [key, value] pairs in insertion order, guaranteed because the spec said so, unlike Object.entries which just got lucky' })`,
  },
  forEach: {
    prompt:
      'call callbackfn for every entry in insertion order, passing (value, key, map) because the argument order is whatever the committee felt that day',
    comment:
      'Side-effecting iteration. The (value, key) argument order exists for reasons nobody questions anymore.',
    example: `await neuro.map.forEach({ map: cache, callbackfn: (v, k) => log(k, v), prompt: 'call callbackfn for every entry in insertion order, passing (value, key, map) because the argument order is whatever the committee felt that day' })`,
  },
  get: {
    prompt:
      'return the value associated with key, or undefined - indistinguishable from a stored undefined unless you also call has',
    comment:
      'Lookup with ambiguity. Missing vs. stored-undefined: the question that launched a thousand utility libraries.',
    example: `await neuro.map.get({ map: cache, key: id, prompt: 'return the value associated with key, or undefined - indistinguishable from a stored undefined unless you also call has' })`,
  },
  getOrInsert: {
    prompt:
      'return the value at key, or insert defaultValue and return that - the lazy-init helper for when computing the default is cheap',
    comment:
      "Get-or-insert with eager default. The twin of getOrInsertComputed, for when you know it's missing.",
    example: `await neuro.map.getOrInsert({ map: cache, key: id, defaultValue: emptyState, prompt: 'return the value at key, or insert defaultValue and return that - the lazy-init helper for when computing the default is cheap' })`,
  },
  getOrInsertComputed: {
    prompt:
      'return the value at key, or call callbackfn(key) to compute and insert one - the memoization pattern we reached for lodash to provide for a decade',
    comment: 'Get-or-insert with lazy compute. The memoize-into-Map pattern, finally built-in.',
    example: `await neuro.map.getOrInsertComputed({ map: cache, key: id, callbackfn: (k) => loadFor(k), prompt: 'return the value at key, or call callbackfn(key) to compute and insert one - the memoization pattern we reached for lodash to provide for a decade' })`,
  },
  groupBy: {
    prompt:
      'group items by the return value of callbackfn into a Map keyed on those values, preserving identity unlike Object.groupBy which stringifies and hopes',
    comment:
      "Map groupBy. Key identity preserved. The one that doesn't toString() your keys and call it architecture.",
    example: `await neuro.map.groupBy({ items: rows, callbackfn: (r) => r.kind, prompt: 'group items by the return value of callbackfn into a Map keyed on those values, preserving identity unlike Object.groupBy which stringifies and hopes' })`,
  },
  has: {
    prompt:
      "return true if key exists in the map - always pair with get when undefined is a legitimate stored value, which it always is in someone's codebase",
    comment: "Membership check. Pair with get. Undefined is always someone's real data.",
    example: `await neuro.map.has({ map: cache, key: id, prompt: 'return true if key exists in the map - always pair with get when undefined is a legitimate stored value, which it always is in someone\\'s codebase' })`,
  },
  keys: {
    prompt:
      'yield keys in insertion order, including NaN as a valid deduplicated key because SameValueZero is more forgiving than any code reviewer',
    comment: "Insertion-order key iterator. NaN is a key. SameValueZero doesn't judge.",
    example: `await neuro.map.keys({ map: cache, prompt: 'yield keys in insertion order, including NaN as a valid deduplicated key because SameValueZero is more forgiving than any code reviewer' })`,
  },
  set: {
    prompt:
      'insert or overwrite the entry [key, value], returning the map for chaining - the fluent API the linter warned you about',
    comment: 'Insert/update. Returns the map for chaining. The linter has opinions.',
    example: `await neuro.map.set({ map: cache, key: id, value: state, prompt: 'insert or overwrite the entry [key, value], returning the map for chaining - the fluent API the linter warned you about' })`,
  },
  values: {
    prompt:
      "yield values in insertion order, the iterator twin of keys, ordered the way the spec promises and the consumer trusts until it doesn't",
    comment:
      'Insertion-order value iterator. The twin of keys. Ordered until you mutate mid-stream.',
    example: `await neuro.map.values({ map: cache, prompt: 'yield values in insertion order, the iterator twin of keys, ordered the way the spec promises and the consumer trusts until it doesn\\'t' })`,
  },
};
