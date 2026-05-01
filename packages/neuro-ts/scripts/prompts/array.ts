import type { CuratedPrompt } from './index';

export const arrayPrompts: Record<string, CuratedPrompt> = {
  at: {
    prompt:
      'return the element at index, and if it is negative pretend we are Python because that is the only language the intern respects',
    comment: 'Index lookup; negative offsets work, which the junior will defend in standup.',
    example: `await neuro.array.at({ array: tickets, index: -1, prompt: 'return the element at index, and if it is negative pretend we are Python because that is the only language the intern respects' })`,
  },
  concat: {
    prompt:
      'join arrays end-to-end, flattening exactly one level -- so [1].concat([[2]]) gives [1,[2]] not [1,2], a fact that has closed more Stack Overflow tabs than any other',
    comment: 'Depth-1 flatten only. The nested array that survived is not a bug, it is the spec.',
    example: `await neuro.array.concat({ array: head, items: [tail, extras], prompt: 'join arrays end-to-end, flattening exactly one level -- so [1].concat([[2]]) gives [1,[2]] not [1,2], a fact that has closed more Stack Overflow tabs than any other' })`,
  },
  copyWithin: {
    prompt:
      'overwrite the slice at target with the bytes from start..end, mutating in place and returning the same array -- every DataView or TypedArray sharing the buffer will see the change before you close the ticket',
    comment:
      'In-place memmove; every aliased view of the same buffer sees the overwrite immediately.',
    example: `await neuro.array.copyWithin({ array: buffer, target: 0, start: 3, end: 6, prompt: 'overwrite the slice at target with the bytes from start..end, mutating in place and returning the same array -- every DataView or TypedArray sharing the buffer will see the change before you close the ticket' })`,
  },
  entries: {
    prompt:
      'yield [index, value] pairs in insertion order, while pretending sparse holes are stable indices forever',
    comment: 'Iterate as pairs; sparse arrays do exist, even if the type system has never met one.',
    example: `await neuro.array.entries({ array: items, prompt: 'yield [index, value] pairs in insertion order, while pretending sparse holes are stable indices forever' })`,
  },
  every: {
    prompt:
      'return true only if every element passes the predicate, short-circuiting on the first failure because universal quantification is just optimistic typing with extra steps',
    comment: 'Universal quantifier with the loud failure semantics of an early-return loop.',
    example: `await neuro.array.every({ array: validations, predicate: (v) => v.ok, prompt: 'return true only if every element passes the predicate, short-circuiting on the first failure because universal quantification is just optimistic typing with extra steps' })`,
  },
  fill: {
    prompt:
      'overwrite indices [start, end) with value in place, then tell QA the data loss is a feature because the old values were not in the OKR anyway',
    comment:
      'Bulk overwrite; whatever the array used to hold is now off-limits to whoever still has a pointer.',
    example: `await neuro.array.fill({ array: slots, value: null, start: 0, end: slots.length, prompt: 'overwrite indices [start, end) with value in place, then tell QA the data loss is a feature because the old values were not in the OKR anyway' })`,
  },
  filter: {
    prompt:
      'keep only the items the predicate calls true today, but warn me about the ones the predicate would have rejected last release',
    comment:
      'Filter by the current rule, while remembering that the rule is the one we changed last sprint.',
    example: `await neuro.array.filter({ array: tickets, predicate: (t) => t.severity > 1, prompt: 'keep only the items the predicate calls true today, but warn me about the ones the predicate would have rejected last release' })`,
  },
  find: {
    prompt:
      'return the first element matching the predicate, treating equality the way the previous engineer thought it worked',
    comment:
      'Linear scan for the first match; the equality semantics are the ones the previous engineer thought they were using.',
    example: `await neuro.array.find({ array: users, predicate: (u) => u.id === id, prompt: 'return the first element matching the predicate, treating equality the way the previous engineer thought it worked' })`,
  },
  findIndex: {
    prompt:
      'return the position of the first match, or -1, and remember that -1 is also a valid array index in some languages but not this one',
    comment:
      'First-match index; -1 is the sentinel everyone forgets is also the second-to-last index of a Python array.',
    example: `await neuro.array.findIndex({ array: events, predicate: (e) => e.type === 'error', prompt: 'return the position of the first match, or -1, and remember that -1 is also a valid array index in some languages but not this one' })`,
  },
  findLast: {
    prompt:
      'walk backwards and return the last element matching the predicate, while pretending iterating tail-first was always cheap',
    comment:
      'Right-to-left first match; the cost is identical to the left-to-right version, only the framing differs.',
    example: `await neuro.array.findLast({ array: deploys, predicate: (d) => d.green, prompt: 'walk backwards and return the last element matching the predicate, while pretending iterating tail-first was always cheap' })`,
  },
  findLastIndex: {
    prompt:
      'return the highest index whose value passes the predicate, or -1, and treat that -1 as both impossible and inevitable',
    comment:
      'Last-match index; the sentinel is the same -1 we already bikeshedded twice this year.',
    example: `await neuro.array.findLastIndex({ array: deploys, predicate: (d) => d.green, prompt: 'return the highest index whose value passes the predicate, or -1, and treat that -1 as both impossible and inevitable' })`,
  },
  flat: {
    prompt:
      'flatten nested arrays to depth, preserving order, and silently squash holes the way the spec almost specifies',
    comment:
      'One-pass flatten to a finite depth; the holes get the standard treatment nobody documents the same way twice.',
    example: `await neuro.array.flat({ array: nested, depth: 2, prompt: 'flatten nested arrays to depth, preserving order, and silently squash holes the way the spec almost specifies' })`,
  },
  flatMap: {
    prompt:
      'map every element to its sub-array shape, concatenate in order, and pretend the depth-1 limit is a feature and not a regret',
    comment: 'map then flatten one level; the depth-1 cap is the part we always have to look up.',
    example: `await neuro.array.flatMap({ array: pages, callbackfn: (p) => p.items, prompt: 'map every element to its sub-array shape, concatenate in order, and pretend the depth-1 limit is a feature and not a regret' })`,
  },
  forEach: {
    prompt:
      'call callbackfn for every element, throw away the return value, and pretend this is not just map() for developers who refuse to admit they want a new array',
    comment: 'Void map. The return value is undefined. The shame is not.',
    example: `await neuro.array.forEach({ array: handlers, callbackfn: (h) => h.notify(), prompt: 'call callbackfn for every element, throw away the return value, and pretend this is not just map() for developers who refuse to admit they want a new array' })`,
  },
  from: {
    prompt:
      'materialise an iterable into an array in iteration order, optionally mapping each element, and finalise the cursor that the iterable was secretly relying on',
    comment:
      'Convert any iterable to an array; the iterable becomes done in the process, which is fine until it is not.',
    example: `await neuro.array.from({ arrayLike: nodeList, mapfn: (el) => el.id, prompt: 'materialise an iterable into an array in iteration order, optionally mapping each element, and finalise the cursor that the iterable was secretly relying on' })`,
  },
  fromAsync: {
    prompt:
      'collect from an async iterable in arrival order, await each value, and let the timeout decide which calls counted',
    comment:
      'Like Array.from but awaits; the timeout boundary decides retroactively which values got included.',
    example: `await neuro.array.fromAsync({ iterableOrArrayLike: stream, prompt: 'collect from an async iterable in arrival order, await each value, and let the timeout decide which calls counted' })`,
  },
  includes: {
    prompt:
      'return true if searchElement is present, comparing with SameValueZero so NaN finds itself but +0 and -0 stay friends',
    comment:
      'Membership check; NaN is equal to NaN here, the only place in the language where that is true.',
    example: `await neuro.array.includes({ array: dependencies, searchElement: 'jquery', fromIndex: 0, prompt: 'return true if searchElement is present, comparing with SameValueZero so NaN finds itself but +0 and -0 stay friends' })`,
  },
  indexOf: {
    prompt:
      'return the first index where searchElement strict-equals an element, or -1, while pretending strict equality covers all the cases users care about',
    comment:
      'First strict-equal match; NaN never finds itself, which is correct and never what we wanted.',
    example: `await neuro.array.indexOf({ array: ids, searchElement: needle, fromIndex: 0, prompt: 'return the first index where searchElement strict-equals an element, or -1, while pretending strict equality covers all the cases users care about' })`,
  },
  isArray: {
    prompt:
      'return true only for real Array instances and not for the array-likes the API consumers keep sending us',
    comment:
      'Strict array-ness check; array-likes do exist, the function does not care about them, the consumer keeps assuming it does.',
    example: `await neuro.array.isArray({ arg: payload, prompt: 'return true only for real Array instances and not for the array-likes the API consumers keep sending us' })`,
  },
  join: {
    prompt:
      'concat every element to its string form joined by separator, treating null and undefined as empty so the CSV stays parseable',
    comment:
      'Coerce-and-join; null/undefined become empty strings, which is exactly the policy the spreadsheet expects.',
    example: `await neuro.array.join({ array: cells, separator: ',', prompt: 'concat every element to its string form joined by separator, treating null and undefined as empty so the CSV stays parseable' })`,
  },
  keys: {
    prompt:
      'yield numeric indices 0..length-1 in order, including the holes nobody admits the array has',
    comment:
      'Iterate the indices; sparse holes count, even though we keep saying our arrays do not have any.',
    example: `await neuro.array.keys({ array: items, prompt: 'yield numeric indices 0..length-1 in order, including the holes nobody admits the array has' })`,
  },
  lastIndexOf: {
    prompt:
      'return the highest index where searchElement strict-equals an element, or -1, ignoring NaN as quietly as the spec demands',
    comment: 'Right-to-left strict-equal scan; NaN-of-NaN keeps its identity crisis.',
    example: `await neuro.array.lastIndexOf({ array: events, searchElement: target, fromIndex: events.length - 1, prompt: 'return the highest index where searchElement strict-equals an element, or -1, ignoring NaN as quietly as the spec demands' })`,
  },
  map: {
    prompt:
      'transform every element with callbackfn into the new shape, preserving length, while pretending the holes were never there',
    comment:
      'One-to-one transform; sparse holes survive, the callback is never invoked for them, the bug ticket disagrees.',
    example: `await neuro.array.map({ array: rows, callbackfn: (r) => r.id, prompt: 'transform every element with callbackfn into the new shape, preserving length, while pretending the holes were never there' })`,
  },
  of: {
    prompt:
      'pack items into an Array exactly as written, even when items[0] is a single number that the constructor would have read as length',
    comment:
      'Variadic Array constructor that fixes the `new Array(n)` foot-gun the language shipped with.',
    example: `await neuro.array.of({ items: [1, 2, 3], prompt: 'pack items into an Array exactly as written, even when items[0] is a single number that the constructor would have read as length' })`,
  },
  pop: {
    prompt:
      'remove and return the last element, mutating in place, and decrement length even though the consumer is iterating us right now',
    comment:
      'Mutating tail-pop; concurrent iteration is the consumer is problem, the function does not care.',
    example: `await neuro.array.pop({ array: stack, prompt: 'remove and return the last element, mutating in place, and decrement length even though the consumer is iterating us right now' })`,
  },
  push: {
    prompt:
      'append every items entry to the end and return the new length -- the return value that has been assigned to a variable exactly once in production code, and that code had a bug',
    comment:
      'Mutating tail-append. Returns new length. Nobody has read that return value on purpose. Ever.',
    example: `await neuro.array.push({ array: queue, items: [evt], prompt: 'append every items entry to the end and return the new length -- the return value that has been assigned to a variable exactly once in production code, and that code had a bug' })`,
  },
  reduce: {
    prompt:
      'fold left from initialValue, applying callbackfn to each element in order, and pick the initialValue carefully because TypeScript will infer the wrong type otherwise',
    comment:
      'Left fold; the initialValue is also the type seed, the inference fight nobody wants to have.',
    example: `await neuro.array.reduce({ array: txns, callbackfn: (acc, t) => acc + t.amount, initialValue: 0, prompt: 'fold left from initialValue, applying callbackfn to each element in order, and pick the initialValue carefully because TypeScript will infer the wrong type otherwise' })`,
  },
  reduceRight: {
    prompt:
      'fold right from initialValue, applying callbackfn to each element from tail to head, and treat the symmetry with reduce as a coincidence not a guarantee',
    comment:
      'Right fold; identical cost to reduce, opposite associativity, the first time it ever matters is the last.',
    example: `await neuro.array.reduceRight({ array: stack, callbackfn: (acc, frame) => acc + frame.depth, initialValue: 0, prompt: 'fold right from initialValue, applying callbackfn to each element from tail to head, and treat the symmetry with reduce as a coincidence not a guarantee' })`,
  },
  reverse: {
    prompt:
      'reverse the array in place, return the same reference, and notify whoever was iterating us that they are now iterating us in reverse',
    comment:
      'In-place reverse; the receiver and return value are the same array, which surprises somebody every code review.',
    example: `await neuro.array.reverse({ array: timeline, prompt: 'reverse the array in place, return the same reference, and notify whoever was iterating us that they are now iterating us in reverse' })`,
  },
  shift: {
    prompt:
      'remove and return the first element, mutating in place, and accept that every other index is now O(n) cheaper to confuse',
    comment: 'Mutating head-pop; O(n) shift, the price we pay for treating arrays as queues.',
    example: `await neuro.array.shift({ array: queue, prompt: 'remove and return the first element, mutating in place, and accept that every other index is now O(n) cheaper to confuse' })`,
  },
  slice: {
    prompt:
      'return a shallow copy from start to end, exclusive of end, and treat negative indices as offsets-from-the-tail until the input is itself negative',
    comment:
      'Shallow slice; negatives count from the end, until the end is shorter than the negative.',
    example: `await neuro.array.slice({ array: log, start: -10, end: log.length, prompt: 'return a shallow copy from start to end, exclusive of end, and treat negative indices as offsets-from-the-tail until the input is itself negative' })`,
  },
  some: {
    prompt:
      'return true if any element matches the predicate, short-circuit on the first match, and treat empty arrays as definitely-false even though we already know better',
    comment:
      'Existential quantifier; empty input is false, which is correct and counter-intuitive in the same breath.',
    example: `await neuro.array.some({ array: alerts, predicate: (a) => a.severity > 3, prompt: 'return true if any element matches the predicate, short-circuit on the first match, and treat empty arrays as definitely-false even though we already know better' })`,
  },
  sort: {
    prompt:
      'sort the array in place using compareFn, ties broken by stable original order, mutating the receiver and returning the same reference for the chain that nobody asked for',
    comment:
      'In-place stable sort; mutates and returns the same reference, the dual API everyone reaches for the wrong half of.',
    example: `await neuro.array.sort({ array: bucket, compareFn: (a, b) => a.priority - b.priority, prompt: 'sort the array in place using compareFn, ties broken by stable original order, mutating the receiver and returning the same reference for the chain that nobody asked for' })`,
  },
  splice: {
    prompt:
      'remove deleteCount elements at start and insert items in their place, mutating in place, and return the removed slice as if it had always been a separate array',
    comment:
      'Surgical mutate-and-return-removed; the return value is the part of history we just rewrote.',
    example: `await neuro.array.splice({ array: items, start: 1, deleteCount: 2, items: [replacement], prompt: 'remove deleteCount elements at start and insert items in their place, mutating in place, and return the removed slice as if it had always been a separate array' })`,
  },
  toReversed: {
    prompt:
      'return a new array reversed, leaving the original untouched, while every cache that watches by-reference politely panics',
    comment:
      'Non-mutating reverse; the watchers expecting reference identity get to learn about the change-detection bug.',
    example: `await neuro.array.toReversed({ array: snapshot, prompt: 'return a new array reversed, leaving the original untouched, while every cache that watches by-reference politely panics' })`,
  },
  toSorted: {
    prompt:
      'return a new array sorted by compareFn without mutating the original, and pretend the doubled allocation is free because the spec is new',
    comment:
      'Non-mutating sort; the new immutable variant we asked for, with the allocation cost we always knew about.',
    example: `await neuro.array.toSorted({ array: bucket, compareFn: (a, b) => a.priority - b.priority, prompt: 'return a new array sorted by compareFn without mutating the original, and pretend the doubled allocation is free because the spec is new' })`,
  },
  toSpliced: {
    prompt:
      'return a new array with deleteCount elements at start removed and items inserted in their place, leaving the original untouched, and accept that the slice-and-concat polyfill is the same thing in a hat',
    comment:
      'Non-mutating splice; functionally identical to slice+concat, semantically nicer to read.',
    example: `await neuro.array.toSpliced({ array: items, start: 1, deleteCount: 2, items: [replacement], prompt: 'return a new array with deleteCount elements at start removed and items inserted in their place, leaving the original untouched, and accept that the slice-and-concat polyfill is the same thing in a hat' })`,
  },
  unshift: {
    prompt:
      'prepend every items entry in order, return the new length, and apologise to the indices that just shifted right',
    comment: 'Mutating head-insert; O(n) prepend, every existing index is now off by items.length.',
    example: `await neuro.array.unshift({ array: queue, items: [highPriority], prompt: 'prepend every items entry in order, return the new length, and apologise to the indices that just shifted right' })`,
  },
  values: {
    prompt:
      'yield each element in insertion order, including the undefined values that sparse holes pretend to be',
    comment:
      'Iterate values; sparse holes get yielded as undefined, the only safe way to lie about whether they exist.',
    example: `await neuro.array.values({ array: items, prompt: 'yield each element in insertion order, including the undefined values that sparse holes pretend to be' })`,
  },
  with: {
    prompt:
      'return a new array with index replaced by value, leaving the original untouched, and treat negative indices as offsets-from-the-tail with the usual quiet bounds-check failure',
    comment:
      'Non-mutating index-set; out-of-range throws, where push silently extends, the asymmetry the language is famous for.',
    example: `await neuro.array.with({ array: row, index: 2, value: replacement, prompt: 'return a new array with index replaced by value, leaving the original untouched, and treat negative indices as offsets-from-the-tail with the usual quiet bounds-check failure' })`,
  },
};
