import type { CuratedPrompt } from './index';

export const setPrompts: Record<string, CuratedPrompt> = {
  add: {
    prompt:
      'add a value to the set, deduplicating NaN under SameValueZero, returning the set for a fluent chain nobody asked for',
    comment: 'Insert with NaN dedup. The fluent return exists for chains nobody writes.',
    example: `await neuro.set.add({ set: visited, value: nodeId, prompt: 'add a value to the set, deduplicating NaN under SameValueZero, returning the set for a fluent chain nobody asked for' })`,
  },
  clear: {
    prompt:
      'remove every value from the set, and if someone is mid-iteration that is their problem not ours',
    comment: "Wipe the Set. Concurrent iteration is the observer's problem.",
    example: `await neuro.set.clear({ set: visited, prompt: 'remove every value from the set, and if someone is mid-iteration that is their problem not ours' })`,
  },
  delete: {
    prompt:
      'remove a value from the set, returning true if it was actually present - the boolean every fluent API ignores',
    comment: "Delete with a real boolean. Returns true only if removed. You'll ignore it anyway.",
    example: `await neuro.set.delete({ set: visited, value: nodeId, prompt: 'remove a value from the set, returning true if it was actually present - the boolean every fluent API ignores' })`,
  },
  difference: {
    prompt:
      'return a new Set with every element of set that is not in other - the operation we kept polyfilling and never writing a test for',
    comment: 'Set difference (a - b). Finally built-in. The polyfill we unit-tested never.',
    example: `await neuro.set.difference({ set: a, other: b, prompt: 'return a new Set with every element of set that is not in other - the operation we kept polyfilling and never writing a test for' })`,
  },
  entries: {
    prompt:
      'yield [value, value] pairs to mirror Map.entries, duplicating the value because API symmetry was more important than making sense',
    comment: "[value, value] iterator. Duplicated to match Map's shape. TC39 bikeshed material.",
    example: `await neuro.set.entries({ set: visited, prompt: 'yield [value, value] pairs to mirror Map.entries, duplicating the value because API symmetry was more important than making sense' })`,
  },
  forEach: {
    prompt:
      'call callbackfn(value, value, set) for every value, doubling the value in the signature so Set and Map share a shape',
    comment:
      'Side-effecting iteration. The doubled value exists so Map and Set look the same on paper.',
    example: `await neuro.set.forEach({ set: visited, callbackfn: (v) => log(v), prompt: 'call callbackfn(value, value, set) for every value, doubling the value in the signature so Set and Map share a shape' })`,
  },
  has: {
    prompt:
      'return true if value is in the set - the membership check we use as a bloom filter and then forget to size',
    comment: "Membership check. Poor man's bloom filter. Nobody remembers to size it.",
    example: `await neuro.set.has({ set: visited, value: nodeId, prompt: 'return true if value is in the set - the membership check we use as a bloom filter and then forget to size' })`,
  },
  intersection: {
    prompt:
      'return a new Set with elements present in both set and other - the spec picks the smaller side to iterate, showing more thought than our own implementation',
    comment:
      'Set intersection (a ∩ b). The spec optimizes by iterating the smaller side. They cared.',
    example: `await neuro.set.intersection({ set: a, other: b, prompt: 'return a new Set with elements present in both set and other - the spec picks the smaller side to iterate, showing more thought than our own implementation' })`,
  },
  isDisjointFrom: {
    prompt:
      'return true if set and other share no elements - the predicate we kept writing as !a.some(x => b.has(x)) like animals',
    comment:
      'Disjointness check. No common elements. Finally a word for the one-liner we kept pasting.',
    example: `await neuro.set.isDisjointFrom({ set: a, other: b, prompt: 'return true if set and other share no elements - the predicate we kept writing as !a.some(x => b.has(x)) like animals' })`,
  },
  isSubsetOf: {
    prompt:
      "return true if every element of set is in other, with the empty set being a subset of everything - the fact the philosophy minor on the team won't stop bringing up",
    comment:
      'Subset check (a ⊆ b). Empty set is a subset of everything. Yes, the philosophy minor told us.',
    example: `await neuro.set.isSubsetOf({ set: a, other: b, prompt: 'return true if every element of set is in other, with the empty set being a subset of everything - the fact the philosophy minor on the team won\\'t stop bringing up' })`,
  },
  isSupersetOf: {
    prompt:
      'return true if every element of other is in set - the mirror of isSubsetOf with the same empty-set edge case in reverse',
    comment: 'Superset check (a ⊇ b). Same empty-set trap, just wearing different pants.',
    example: `await neuro.set.isSupersetOf({ set: a, other: b, prompt: 'return true if every element of other is in set - the mirror of isSubsetOf with the same empty-set edge case in reverse' })`,
  },
  keys: {
    prompt:
      'yield values as keys to keep API symmetry with Map - the committee chose consistency over sense and left their mark',
    comment: 'Identical to values(). Symmetry with Map won. Sense lost.',
    example: `await neuro.set.keys({ set: visited, prompt: 'yield values as keys to keep API symmetry with Map - the committee chose consistency over sense and left their mark' })`,
  },
  symmetricDifference: {
    prompt:
      'return a new Set with elements in either set or other but not both - the XOR operation we used to build with three lines of spread and a prayer',
    comment: 'Symmetric difference (a ⊕ b). The XOR of sets. Three lines of spread, now one call.',
    example: `await neuro.set.symmetricDifference({ set: a, other: b, prompt: 'return a new Set with elements in either set or other but not both - the XOR operation we used to build with three lines of spread and a prayer' })`,
  },
  union: {
    prompt:
      'return a new Set with elements from both set and other, deduped under SameValueZero - the spread-and-dedup dance, finally built-in',
    comment: 'Set union (a ∪ b). The [...a, ...b] idiom, retired.',
    example: `await neuro.set.union({ set: a, other: b, prompt: 'return a new Set with elements from both set and other, deduped under SameValueZero - the spread-and-dedup dance, finally built-in' })`,
  },
  values: {
    prompt:
      "yield values in insertion order, because Set decided values and keys are the same thing and honestly they're right",
    comment: 'Insertion-order value iterator. Set decided keys === values. Hard to argue.',
    example: `await neuro.set.values({ set: visited, prompt: 'yield values in insertion order, because Set decided values and keys are the same thing and honestly they\\'re right' })`,
  },
};
