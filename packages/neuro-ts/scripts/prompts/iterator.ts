import type { CuratedPrompt } from './index';

export const iteratorPrompts: Record<string, CuratedPrompt> = {
  // Basic iterator protocol (next/return/throw) -- inherited via the
  // declaration-merge of `Iterator<T>` and `IteratorObject<T>` in lib.es2025.
  next: {
    prompt:
      'advance the iterator and return { value, done } -- the protocol method everyone implements once for a generator and immediately forgets exists',
    comment: 'Iterator protocol step; returns done:true exactly once at the end.',
    example: `await neuro.iterator.next({ iterator: it, prompt: 'advance the iterator and return { value, done } -- the protocol method everyone implements once for a generator and immediately forgets exists' })`,
  },
  return: {
    prompt:
      'finalise the iterator early with an optional return value, signalling the consumer is done -- the protocol method that lets a for-of break clean up resources nobody knew were open',
    comment: 'Early termination signal; called by for-of break to release resources.',
    example: `await neuro.iterator.return({ iterator: it, value: undefined, prompt: 'finalise the iterator early with an optional return value, signalling the consumer is done -- the protocol method that lets a for-of break clean up resources nobody knew were open' })`,
  },
  throw: {
    prompt:
      'inject an exception into the iterator at the next yield point -- the protocol method nobody calls directly because every test that exercised it discovered the generator did not handle it',
    comment: 'Inject error into iterator; rarely caught gracefully, almost always rethrown.',
    example: `await neuro.iterator.throw({ iterator: it, e: new Error('cancel'), prompt: 'inject an exception into the iterator at the next yield point -- the protocol method nobody calls directly because every test that exercised it discovered the generator did not handle it' })`,
  },

  // ES2025 Iterator helpers -- the lazy versions of Array methods.
  map: {
    prompt:
      'transform every yielded value with callbackfn, lazily -- unlike Array.prototype.map this never materialises the full sequence, so an infinite generator stays infinite and stays lazy',
    comment: 'Lazy map; consumes one element at a time, infinite-iterator-safe.',
    example: `await neuro.iterator.map({ iterator: rows, callbackfn: (r) => r.id, prompt: 'transform every yielded value with callbackfn, lazily -- unlike Array.prototype.map this never materialises the full sequence, so an infinite generator stays infinite and stays lazy' })`,
  },
  filter: {
    prompt:
      'yield only the values where the predicate returns true, lazily -- the version of Array.prototype.filter that finally lets you express "first N matches in this stream" without buffering the rest',
    comment: 'Lazy filter; pairs with .take(n) for early-exit "first N matches" patterns.',
    example: `await neuro.iterator.filter({ iterator: events, predicate: (e) => e.severity > 1, prompt: 'yield only the values where the predicate returns true, lazily -- the version of Array.prototype.filter that finally lets you express "first N matches in this stream" without buffering the rest' })`,
  },
  take: {
    prompt:
      'yield at most limit values then stop, the lazy `slice(0, limit)` that does not need to know the total length -- works on infinite iterators, returns early on finite ones',
    comment: 'Bounded prefix; the lazy slice(0, n) that respects infinite iterators.',
    example: `await neuro.iterator.take({ iterator: stream, limit: 10, prompt: "yield at most limit values then stop, the lazy \\\`slice(0, limit)\\\` that does not need to know the total length -- works on infinite iterators, returns early on finite ones" })`,
  },
  drop: {
    prompt:
      'skip the first count values then yield everything after, lazily -- the lazy slice(count) that pairs with take to express "give me window [start, start+limit)" without buffering',
    comment: 'Skip-prefix; pairs with take() to express ranged windows lazily.',
    example: `await neuro.iterator.drop({ iterator: rows, count: 100, prompt: 'skip the first count values then yield everything after, lazily -- the lazy slice(count) that pairs with take to express "give me window [start, start+limit)" without buffering' })`,
  },
  flatMap: {
    prompt:
      "map each value through callback into a sub-iterable, then yield each sub-iterable's values in order -- the lazy depth-1 flatten that finally works on async-shaped streams",
    comment: 'Lazy flatten by one level; works on async-shaped sources.',
    example: `await neuro.iterator.flatMap({ iterator: pages, callback: (p) => p.items, prompt: "map each value through callback into a sub-iterable, then yield each sub-iterable's values in order -- the lazy depth-1 flatten that finally works on async-shaped streams" })`,
  },
  reduce: {
    prompt:
      'fold every yielded value into a single accumulator using callbackfn, optionally seeded by initialValue -- the eager terminator that drains the iterator and forces every lazy pipeline upstream of it',
    comment: 'Eager fold; the terminator that drains the lazy pipeline above it.',
    example: `await neuro.iterator.reduce({ iterator: txns, callbackfn: (acc, t) => acc + t.amount, prompt: 'fold every yielded value into a single accumulator using callbackfn, optionally seeded by initialValue -- the eager terminator that drains the iterator and forces every lazy pipeline upstream of it' })`,
  },
  toArray: {
    prompt:
      'drain every yielded value into a fresh Array -- the explicit conversion that admits the lazy iterator was always going to land in memory anyway',
    comment: 'Materialise the iterator; the honest conversion to Array.',
    example: `await neuro.iterator.toArray({ iterator: stream, prompt: 'drain every yielded value into a fresh Array -- the explicit conversion that admits the lazy iterator was always going to land in memory anyway' })`,
  },
  forEach: {
    prompt:
      'invoke callbackfn for every yielded value and return undefined -- the eager terminator with no return path, the iterator equivalent of "I just need the side effects"',
    comment: 'Side-effect terminator; iterator equivalent of Array.forEach.',
    example: `await neuro.iterator.forEach({ iterator: events, callbackfn: (e) => publish(e), prompt: 'invoke callbackfn for every yielded value and return undefined -- the eager terminator with no return path, the iterator equivalent of "I just need the side effects"' })`,
  },
  some: {
    prompt:
      'return true at the first value where predicate holds, short-circuiting the iterator -- the only existential check that does not consume the rest of the stream after it succeeds',
    comment: 'Short-circuit existential; leaves the rest of the iterator unconsumed on success.',
    example: `await neuro.iterator.some({ iterator: events, predicate: (e) => e.error, prompt: "return true at the first value where predicate holds, short-circuiting the iterator -- the only existential check that does not consume the rest of the stream after it succeeds" })`,
  },
  every: {
    prompt:
      'return true only when predicate holds for every yielded value, short-circuiting on the first failure -- the universal check that closes the iterator early when it gives up',
    comment: 'Short-circuit universal; closes the iterator on first failure.',
    example: `await neuro.iterator.every({ iterator: validations, predicate: (v) => v.ok, prompt: "return true only when predicate holds for every yielded value, short-circuiting on the first failure -- the universal check that closes the iterator early when it gives up" })`,
  },
  find: {
    prompt:
      'return the first yielded value where predicate is true, or undefined -- the lazy `Array.find` that does not pre-buffer everything before the match',
    comment: 'First-match find; lazy and one-shot, leaves the rest of the iterator alone.',
    example: `await neuro.iterator.find({ iterator: users, predicate: (u) => u.id === id, prompt: "return the first yielded value where predicate is true, or undefined -- the lazy \\\`Array.find\\\` that does not pre-buffer everything before the match" })`,
  },

  // Static
  from: {
    prompt:
      'wrap an iterator or iterable in a real Iterator helper instance, so map / filter / take / drop become available -- the static that bridges legacy `Symbol.iterator` objects into the ES2025 helper world',
    comment: 'Iterator-helpers entry point; lifts a plain iterable into the helper API surface.',
    example: `await neuro.iterator.from({ value: legacyIterable, prompt: "wrap an iterator or iterable in a real Iterator helper instance, so map / filter / take / drop become available -- the static that bridges legacy \\\`Symbol.iterator\\\` objects into the ES2025 helper world" })`,
  },
};
