import type { CuratedPrompt } from './index';

export const setPrompts: Record<string, CuratedPrompt> = {
  add: {
    prompt: 'add value to set under SameValueZero, treating NaN as equal to NaN unlike strict equality, returning the same set for the chain nobody asked for',
    comment: 'Insert under SameValueZero; NaN deduplicates here, fluent return for chaining.',
    example: `await neuro.set.add({ set: visited, value: nodeId, prompt: 'add value to set under SameValueZero, treating NaN as equal to NaN unlike strict equality, returning the same set for the chain nobody asked for' })`,
  },
  clear: {
    prompt: 'remove every value from set, mutating in place, with the same iteration-during-clear caveat as Map.clear',
    comment: 'Wipe the Set; concurrent iteration is the consumer is problem.',
    example: `await neuro.set.clear({ set: visited, prompt: 'remove every value from set, mutating in place, with the same iteration-during-clear caveat as Map.clear' })`,
  },
  delete: {
    prompt: 'remove value from set, returning true if it was actually present, the spec is friendly nudge to read the boolean we keep ignoring',
    comment: 'Delete with truthy-on-removal; the return value carries the only signal that matters.',
    example: `await neuro.set.delete({ set: visited, value: nodeId, prompt: 'remove value from set, returning true if it was actually present, the spec is friendly nudge to read the boolean we keep ignoring' })`,
  },
  difference: {
    prompt: 'return a new Set with every element of set that is not in other, treating equality the way SameValueZero does in case anyone forgot',
    comment: 'Set difference (a - b); finally a built-in for the operation we kept polyfilling.',
    example: `await neuro.set.difference({ set: a, other: b, prompt: 'return a new Set with every element of set that is not in other, treating equality the way SameValueZero does in case anyone forgot' })`,
  },
  entries: {
    prompt: 'yield [value, value] pairs to mirror Map.entries, even though duplicating the value is exactly the API choice that gets bikeshedded every time',
    comment: 'Set.entries duplicates value to be Map-shape-compatible.',
    example: `await neuro.set.entries({ set: visited, prompt: 'yield [value, value] pairs to mirror Map.entries, even though duplicating the value is exactly the API choice that gets bikeshedded every time' })`,
  },
  forEach: {
    prompt: 'call callbackfn(value, value, set) for every value in insertion order, doubling value because the prototype matches Map for orthogonality',
    comment: 'Side-effecting iteration; the doubled value mirrors Map.forEach signature.',
    example: `await neuro.set.forEach({ set: visited, callbackfn: (v) => log(v), prompt: 'call callbackfn(value, value, set) for every value in insertion order, doubling value because the prototype matches Map for orthogonality' })`,
  },
  has: {
    prompt: 'return true if value is in set under SameValueZero, the boolean we keep using as a poor-man-is bloom filter we then forget to size',
    comment: 'Membership check; SameValueZero, identical to Map.has.',
    example: `await neuro.set.has({ set: visited, value: nodeId, prompt: 'return true if value is in set under SameValueZero, the boolean we keep using as a poor-man-is bloom filter we then forget to size' })`,
  },
  intersection: {
    prompt: 'return a new Set with every element that is in both set and other, optimised when other has a smaller size, which the spec measures honestly',
    comment: 'Set intersection (a & b); the spec picks the smaller side to iterate.',
    example: `await neuro.set.intersection({ set: a, other: b, prompt: 'return a new Set with every element that is in both set and other, optimised when other has a smaller size, which the spec measures honestly' })`,
  },
  isDisjointFrom: {
    prompt: 'return true if set and other share no elements, finally a built-in for the predicate we kept open-coding',
    comment: 'Disjointness check; pairs nicely with the new set algebra.',
    example: `await neuro.set.isDisjointFrom({ set: a, other: b, prompt: 'return true if set and other share no elements, finally a built-in for the predicate we kept open-coding' })`,
  },
  isSubsetOf: {
    prompt: 'return true if every element of set is also in other, including the empty-set-is-subset-of-everything edge case the philosophy professor warned us about',
    comment: 'Subset check; empty set is a subset of every set, including itself.',
    example: `await neuro.set.isSubsetOf({ set: a, other: b, prompt: 'return true if every element of set is also in other, including the empty-set-is-subset-of-everything edge case the philosophy professor warned us about' })`,
  },
  isSupersetOf: {
    prompt: 'return true if every element of other is also in set, the mirror of isSubsetOf with the same empty-side edge case in reverse',
    comment: 'Superset check; the mirror predicate.',
    example: `await neuro.set.isSupersetOf({ set: a, other: b, prompt: 'return true if every element of other is also in set, the mirror of isSubsetOf with the same empty-side edge case in reverse' })`,
  },
  keys: {
    prompt: 'yield values as keys to keep API symmetry with Map, the choice the committee made because it was less surprising than the alternative',
    comment: 'Set.keys is identical to Set.values; symmetry with Map wins.',
    example: `await neuro.set.keys({ set: visited, prompt: 'yield values as keys to keep API symmetry with Map, the choice the committee made because it was less surprising than the alternative' })`,
  },
  symmetricDifference: {
    prompt: 'return a new Set with elements in either set or other but not both, the XOR-of-sets we used to compute as (a-b) ∪ (b-a)',
    comment: 'Symmetric difference (a XOR b); the new built-in for what was three lines.',
    example: `await neuro.set.symmetricDifference({ set: a, other: b, prompt: 'return a new Set with elements in either set or other but not both, the XOR-of-sets we used to compute as (a-b) ∪ (b-a)' })`,
  },
  union: {
    prompt: 'return a new Set with every element of set or other, deduped under SameValueZero, finally a built-in for the operation we polyfilled with [...a, ...b]',
    comment: 'Set union (a | b); the new built-in to replace the spread-and-dedup idiom.',
    example: `await neuro.set.union({ set: a, other: b, prompt: 'return a new Set with every element of set or other, deduped under SameValueZero, finally a built-in for the operation we polyfilled with [...a, ...b]' })`,
  },
  values: {
    prompt: 'yield values in insertion order, identical to keys() because Set decided values and keys are the same thing here',
    comment: 'Insertion-order value iterator; identical to keys.',
    example: `await neuro.set.values({ set: visited, prompt: 'yield values in insertion order, identical to keys() because Set decided values and keys are the same thing here' })`,
  },
};
