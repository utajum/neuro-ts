import type { CuratedPrompt } from './index';

/**
 * Generates curated prompts for every typed-array (group, method) pair.
 *
 * Each typed array gets a "flavor" describing the paradox the underlying
 * binary representation actually has (uint8 mod-256 wrap, uint8c clamp,
 * int8 two-is-complement, float16 lossy precision, bigInt64 sign+magnitude,
 * etc). Per-method prompts plug that flavor in so every entry reads
 * distinctly even though the method name is shared.
 *
 * Flavors are deliberately rooted in real device / protocol / GPU /
 * embedded engineering pain - the kind of thing the team wishes the next
 * person inherits with documentation but never does.
 */

interface Flavor {
  /** Group name (e.g. `int8Array`). */
  group: string;
  /** Display label used in prompts (e.g. `Int8Array`). */
  label: string;
  /** Element width in bytes (or 8 for the BigInt variants). */
  width: number;
  /** One-line domain description plugged into many prompts. */
  domain: string;
  /** Short paradoxical anchor reused across method prompts. */
  paradox: string;
  /** Element type name in code examples (e.g. `0`, `0n`, `1.5`). */
  exampleValue: string;
}

const FLAVORS: Flavor[] = [
  {
    group: 'int8Array',
    label: 'Int8Array',
    width: 1,
    domain: 'two-is-complement signed 8-bit integers in [-128, 127]',
    paradox:
      'wrap silently when the audio sample clipped, scream loudly when the chart axis disagreed',
    exampleValue: '0',
  },
  {
    group: 'uint8Array',
    label: 'Uint8Array',
    width: 1,
    domain: 'unsigned 8-bit bytes in [0, 255]',
    paradox:
      'wrap mod-256 the way the protocol counts on, and treat -1 as 255 because the spec quietly insists',
    exampleValue: '0',
  },
  {
    group: 'uint8ClampedArray',
    label: 'Uint8ClampedArray',
    width: 1,
    domain: 'unsigned 8-bit bytes clamped to [0, 255] with no wrap',
    paradox:
      'clamp to 0 or 255 instead of wrapping, the canvas-pixel safety net the rest of the typed-array family refuses to learn from',
    exampleValue: '0',
  },
  {
    group: 'int16Array',
    label: 'Int16Array',
    width: 2,
    domain: 'two-is-complement signed 16-bit integers in [-32768, 32767]',
    paradox:
      'wrap to the negative side when the loudness counter overflowed, exactly the way the embedded firmware is C peer expects',
    exampleValue: '0',
  },
  {
    group: 'uint16Array',
    label: 'Uint16Array',
    width: 2,
    domain: 'unsigned 16-bit integers in [0, 65535]',
    paradox:
      'mod-65536 wrap that the protocol designers thought "would be enough" before the ID space ran out twice',
    exampleValue: '0',
  },
  {
    group: 'int32Array',
    label: 'Int32Array',
    width: 4,
    domain: 'two-is-complement signed 32-bit integers in [-2147483648, 2147483647]',
    paradox:
      'silent wrap at INT_MAX with the same enthusiasm C and Java did decades ago, plus the JS-specific weirdness that ToInt32 will perform on you',
    exampleValue: '0',
  },
  {
    group: 'uint32Array',
    label: 'Uint32Array',
    width: 4,
    domain: 'unsigned 32-bit integers in [0, 4294967295]',
    paradox:
      'mod 2^32 wrap, plus the historical anxiety of a counter that "could not possibly overflow in our lifetime"',
    exampleValue: '0',
  },
  {
    group: 'float32Array',
    label: 'Float32Array',
    width: 4,
    domain: 'IEEE-754 single-precision floats',
    paradox:
      'precision loss the GPU shader pretended did not exist, made obvious only when the unit test hits a non-power-of-two value',
    exampleValue: '0',
  },
  {
    group: 'float64Array',
    label: 'Float64Array',
    width: 8,
    domain: 'IEEE-754 double-precision floats matching the JS Number type',
    paradox:
      'numerical agreement with JS Number, deceptive cross-host equality, and the false promise that two doubles always compare the same way twice',
    exampleValue: '0',
  },
  {
    group: 'bigInt64Array',
    label: 'BigInt64Array',
    width: 8,
    domain: 'two-is-complement signed 64-bit integers in [-(2^63), 2^63 - 1]',
    paradox:
      'BigInt-everywhere semantics that finally let us count atomic operations past 2^53 without lying about precision',
    exampleValue: '0n',
  },
  {
    group: 'bigUint64Array',
    label: 'BigUint64Array',
    width: 8,
    domain: 'unsigned 64-bit integers in [0, 2^64 - 1]',
    paradox:
      'BigInt-everywhere semantics, mod 2^64 wrap, and the freshly drained anxiety of running out of integer headroom',
    exampleValue: '0n',
  },
];

/**
 * Method-name template. Receives the flavor and emits {prompt, comment, example}.
 * Each template references the flavor.label, flavor.domain, and flavor.paradox
 * so different typed arrays produce visibly distinct prose.
 */
type Template = (f: Flavor, group: string, method: string) => CuratedPrompt;

function ex(f: Flavor, method: string, body: string, prompt: string): string {
  return `await neuro.${f.group}.${method}({ ${body}, prompt: '${prompt.replace(/'/g, "\\'")}' })`;
}

const TEMPLATES: Record<string, Template> = {
  at: (f, _g, m) => ({
    prompt: `read the ${f.label} element at index, negative counts from the tail, and the value comes back as a JS Number even when the storage is ${f.domain} and the precision is already gone`,
    comment: `Indexed read on ${f.label}; negative index wraps, precision lost in storage is not restored on read.`,
    example: ex(
      f,
      m,
      `${f.group}: view, index: 0`,
      `read the ${f.domain} value at index, treating negative index as offset-from-the-end, and remember the read returns a Number for ${f.label} no matter how many bits we lost on the way out`,
    ),
  }),
  copyWithin: (f, _g, m) => ({
    prompt: `overwrite the slice at target with the slice from start..end inside the ${f.label}, mutating in place, and ${f.paradox}`,
    comment: `In-place memmove on ${f.label}; the underlying ArrayBuffer notices, every other view notices later.`,
    example: ex(
      f,
      m,
      `${f.group}: view, target: 0, start: 4, end: 8`,
      `overwrite the slice at target with the slice from start..end inside the ${f.label}, mutating in place, and ${f.paradox}`,
    ),
  }),
  entries: (f, _g, m) => ({
    prompt: `yield [index, value] pairs from the ${f.label} in storage order, where the value is already a JS Number even if the bytes were ${f.domain} -- the coercion that bites when you write the value back`,
    comment: `${f.label} entries; values come out as Numbers, putting them back re-coerces.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `yield [index, value] pairs from the ${f.label} in storage order, where the value is already a JS Number even if the bytes were ${f.domain} -- the coercion that bites when you write the value back`,
    ),
  }),
  every: (f, _g, m) => ({
    prompt: `return true only when every element in the ${f.label} satisfies the predicate, short-circuiting on the first lie because the SIMD path cannot keep us honest here`,
    comment: `${f.label} every; short-circuits, no SIMD shortcut.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n >= 0`,
      `return true only when every element in the ${f.label} satisfies the predicate, short-circuiting on the first lie because the SIMD path cannot keep us honest here`,
    ),
  }),
  fill: (f, _g, m) => ({
    prompt: `fill indices [start, end) of the ${f.label} with value, where value is coerced into ${f.domain} before writing -- so filling with -1 or 1.9 produces the ${f.label}-flavoured surprise, not the number you passed`,
    comment: `${f.label} fill; coercion into ${f.domain} happens first, the input value does not survive intact.`,
    example: ex(
      f,
      m,
      `${f.group}: view, value: ${f.exampleValue}, start: 0, end: 0`,
      `fill indices [start, end) of the ${f.label} with value, applying the ${f.label} coercion (${f.domain}) to value first the way the spec quietly insists`,
    ),
  }),
  filter: (f, _g, m) => ({
    prompt: `return a new ${f.label} of only the elements that pass the predicate, with a fresh buffer sized to the result -- the allocation the hot-path profiler will eventually find`,
    comment: `${f.label} filter; fresh allocation sized to result, the one the profiler flags in week three.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n !== ${f.exampleValue}`,
      `return a new ${f.label} keeping only elements that satisfy the predicate, allocating a fresh buffer because filter cannot in-place narrow without lying about length`,
    ),
  }),
  find: (f, _g, m) => ({
    prompt: `return the first ${f.label} element matching the predicate, or undefined -- and the value the predicate receives is already a JS Number, so a ${f.label} storing 255 gives the predicate 255 not a raw byte`,
    comment: `${f.label} find; predicate gets JS Numbers, not raw ${f.domain} bytes.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n > 0`,
      `return the first ${f.label} element matching the predicate or undefined, while remembering the values are Number-domain even though the underlying bytes are ${f.domain}`,
    ),
  }),
  findIndex: (f, _g, m) => ({
    prompt: `return the index of the first ${f.label} element matching the predicate, or -1, with -1 here meaning the same negative-as-sentinel that has already cost us at least one perf review`,
    comment: `${f.label} findIndex; -1 sentinel survives.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n > 0`,
      `return the index of the first ${f.label} element matching the predicate, or -1, with -1 here meaning the same negative-as-sentinel that has already cost us at least one perf review`,
    ),
  }),
  findLast: (f, _g, m) => ({
    prompt: `walk the ${f.label} backwards and return the last matching element, the call that costs exactly as much as findIndex but is never the one you benchmark`,
    comment: `${f.label} findLast; same cost as forward scan, opposite direction, rarely profiled.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n > 0`,
      `walk the ${f.label} backwards and return the last matching element, the call that costs exactly as much as findIndex but is never the one you benchmark`,
    ),
  }),
  findLastIndex: (f, _g, m) => ({
    prompt: `return the highest index in the ${f.label} whose element passes the predicate, or -1, the call you reach for when the last bad sample matters more than the first`,
    comment: `${f.label} findLastIndex; scans tail-first, -1 when nothing matches.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n > 0`,
      `return the highest index of the ${f.label} whose value matches the predicate, or -1, the right-hand twin of findIndex with the same sentinel angst`,
    ),
  }),
  forEach: (f, _g, m) => ({
    prompt: `call callbackfn for every ${f.label} element in storage order, discarding the return value, and resist the urge to push into an outer array because that is what map is for`,
    comment: `${f.label} forEach; return value is gone, every side effect is on you.`,
    example: ex(
      f,
      m,
      `${f.group}: view, callbackfn: (n, i) => log(i, n)`,
      `call callbackfn for every ${f.label} element in storage order, discarding the return value, and resist the urge to push into an outer array because that is what map is for`,
    ),
  }),
  from: (f, _g, m) => ({
    prompt: `materialise an iterable into a fresh ${f.label}, optionally mapping each element with mapfn, and ${f.paradox}`,
    comment: `${f.label} from; coerces every produced value into ${f.domain}.`,
    example: ex(
      f,
      m,
      `arrayLike: source`,
      `materialise an iterable into a fresh ${f.label}, optionally mapping each element with mapfn, and ${f.paradox}`,
    ),
  }),
  fromAsync: (f, _g, m) => ({
    prompt: `collect from an async iterable into a fresh ${f.label}, awaiting each value in arrival order, so the first dropped chunk is also the first missing index`,
    comment: `${f.label} fromAsync; arrival order is index order, gaps are silent.`,
    example: ex(
      f,
      m,
      `iterableOrArrayLike: stream`,
      `collect from an async iterable into a fresh ${f.label}, awaiting each value in arrival order, so the first dropped chunk is also the first missing index`,
    ),
  }),
  fromBase64: (f, _g, m) => ({
    prompt: `decode the base64 string into a fresh ${f.label}, with options.alphabet picking standard or url-safe, the entry that finally lands without a polyfill`,
    comment: `${f.label} fromBase64; first-class base64 decode at last.`,
    example: ex(
      f,
      m,
      `string: 'aGVsbG8'`,
      `decode the base64 string into a fresh ${f.label}, with options.alphabet picking standard or url-safe, the entry that finally lands without a polyfill`,
    ),
  }),
  fromHex: (f, _g, m) => ({
    prompt: `decode the lowercase-hex string into a fresh ${f.label}, the missing companion to toHex that we used to write a five-line loop for`,
    comment: `${f.label} fromHex; finally an official hex decode.`,
    example: ex(
      f,
      m,
      `string: '68656c6c6f'`,
      `decode the lowercase-hex string into a fresh ${f.label}, the missing companion to toHex that we used to write a five-line loop for`,
    ),
  }),
  includes: (f, _g, m) => ({
    prompt: `return true if searchElement is in the ${f.label}, comparing under SameValueZero so NaN finds itself in float arrays and -0/+0 stay friends`,
    comment: `${f.label} includes; SameValueZero, not strict equality.`,
    example: ex(
      f,
      m,
      `${f.group}: view, searchElement: ${f.exampleValue}, fromIndex: 0`,
      `return true if searchElement is in the ${f.label}, comparing under SameValueZero so NaN finds itself in float arrays and -0/+0 stay friends`,
    ),
  }),
  indexOf: (f, _g, m) => ({
    prompt: `return the lowest index where searchElement strict-equals an element of the ${f.label}, or -1, with the strict-equality NaN trap that includes mercifully avoids`,
    comment: `${f.label} indexOf; strict equality, NaN never finds itself.`,
    example: ex(
      f,
      m,
      `${f.group}: view, searchElement: ${f.exampleValue}, fromIndex: 0`,
      `return the lowest index where searchElement strict-equals an element of the ${f.label}, or -1, with the strict-equality NaN trap that includes mercifully avoids`,
    ),
  }),
  join: (f, _g, m) => ({
    prompt: `join every ${f.label} element as a decimal string with separator between them, where NaN and Infinity print verbatim -- so the receiving CSV gets "NaN" and chokes on it`,
    comment: `${f.label} join; NaN and Infinity print verbatim.`,
    example: ex(
      f,
      m,
      `${f.group}: view, separator: ','`,
      `concatenate every ${f.label} element to its decimal string form joined by separator, treating NaN and Infinity as their printed forms even when the receiving CSV cannot parse them back`,
    ),
  }),
  keys: (f, _g, m) => ({
    prompt: `yield numeric indices 0..length-1 of the ${f.label}, the iterator that exists so Map.groupBy and destructuring idioms work the same way they do on plain Array`,
    comment: `${f.label} keys; always dense 0..n-1, here for API symmetry not for surprise.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `yield numeric indices 0..length-1 of the ${f.label}, the iterator that exists so Map.groupBy and destructuring idioms work the same way they do on plain Array`,
    ),
  }),
  lastIndexOf: (f, _g, m) => ({
    prompt: `return the highest index where searchElement strictly equals an element of the ${f.label}, or -1 -- NaN strict-equals nothing, so searching for a corrupt float sample always comes back empty`,
    comment: `${f.label} lastIndexOf; strict equality, NaN in the buffer is invisible to this scan.`,
    example: ex(
      f,
      m,
      `${f.group}: view, searchElement: ${f.exampleValue}, fromIndex: view.length - 1`,
      `return the highest index where searchElement strict-equals an element of the ${f.label}, or -1, with the same NaN-never-found surprise as indexOf`,
    ),
  }),
  map: (f, _g, m) => ({
    prompt: `map every ${f.label} element through callbackfn into a new ${f.label} of the same length, where every result is silently coerced into ${f.domain} on the way back in`,
    comment: `${f.label} map; outputs get re-coerced into the storage domain.`,
    example: ex(
      f,
      m,
      `${f.group}: view, callbackfn: (n) => n`,
      `map every ${f.label} element through callbackfn into a new ${f.label} of the same length, where every result is silently coerced into ${f.domain} on the way back in`,
    ),
  }),
  of: (f, _g, m) => ({
    prompt: `pack items into a fresh ${f.label} exactly as supplied, with each item coerced into ${f.domain}, the variadic constructor that does not have ${f.label}.of(n) "make me a length" trap`,
    comment: `${f.label} of; the safe variadic constructor, immune to the new-Array(n) length confusion.`,
    example: ex(
      f,
      m,
      `items: [${f.exampleValue}, ${f.exampleValue}]`,
      `pack items into a fresh ${f.label} exactly as supplied, with each item coerced into ${f.domain}, the variadic constructor that does not have ${f.label}.of(n) "make me a length" trap`,
    ),
  }),
  reduce: (f, _g, m) => ({
    prompt: `fold the ${f.label} left starting from initialValue, applying callbackfn to each element, with the same initialValue-as-type-seed dance every TypeScript reducer fights`,
    comment: `${f.label} reduce; left fold, the type seed is the initial value.`,
    example: ex(
      f,
      m,
      `${f.group}: view, callbackfn: (a, b) => a + b, initialValue: 0`,
      `fold the ${f.label} left starting from initialValue, applying callbackfn to each element, with the same initialValue-as-type-seed dance every TypeScript reducer fights`,
    ),
  }),
  reduceRight: (f, _g, m) => ({
    prompt: `fold the ${f.label} right starting from initialValue, applying callbackfn from tail to head, the symmetry partner of reduce that finally pays its rent in DSP code`,
    comment: `${f.label} reduceRight; useful for IIR-filter-shaped folds.`,
    example: ex(
      f,
      m,
      `${f.group}: view, callbackfn: (a, b) => a + b, initialValue: 0`,
      `fold the ${f.label} right starting from initialValue, applying callbackfn from tail to head, the symmetry partner of reduce that finally pays its rent in DSP code`,
    ),
  }),
  reverse: (f, _g, m) => ({
    prompt: `reverse the ${f.label} in place, returning the same view, with the same SharedArrayBuffer hazard every other in-place mutator inherits`,
    comment: `${f.label} reverse; in-place, mutates underlying buffer.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `reverse the ${f.label} in place, returning the same view, with the same SharedArrayBuffer hazard every other in-place mutator inherits`,
    ),
  }),
  set: (f, _g, m) => ({
    prompt: `write elements from array or another typed array into the ${f.label} starting at offset, coercing each source value into ${f.domain} on the way in -- the silent narrowing that corrupts the DMA buffer nobody checks`,
    comment: `${f.label} set; bulk write with coercion, the narrowing that corrupts the buffer silently.`,
    example: ex(
      f,
      m,
      `${f.group}: view, array: source, offset: 0`,
      `copy elements from array (or another typed array) into the ${f.label} starting at offset, coercing each value into ${f.domain} the way the spec quietly insists`,
    ),
  }),
  setFromBase64: (f, _g, m) => ({
    prompt: `decode the base64 string straight into the ${f.label}, returning {read, written}, the buffered decode that finally lets streaming parsers stop allocating per chunk`,
    comment: `${f.label} setFromBase64; in-place decode for streaming.`,
    example: ex(
      f,
      m,
      `${f.group}: view, string: 'aGVsbG8'`,
      `decode the base64 string straight into the ${f.label}, returning {read, written}, the buffered decode that finally lets streaming parsers stop allocating per chunk`,
    ),
  }),
  setFromHex: (f, _g, m) => ({
    prompt: `decode the hex string straight into the ${f.label}, returning {read, written}, the in-place hex decode for hot paths that cannot afford a fresh allocation per frame`,
    comment: `${f.label} setFromHex; allocation-free hex decode.`,
    example: ex(
      f,
      m,
      `${f.group}: view, string: '68656c6c6f'`,
      `decode the hex string straight into the ${f.label}, returning {read, written}, the in-place hex decode for hot paths that cannot afford a fresh allocation per frame`,
    ),
  }),
  slice: (f, _g, m) => ({
    prompt: `return a fresh ${f.label} with bytes copied from start..end, independent of the original buffer, perfect for snapshotting before another worker mutates the source`,
    comment: `${f.label} slice; allocates a fresh buffer.`,
    example: ex(
      f,
      m,
      `${f.group}: view, start: 0, end: 8`,
      `return a fresh ${f.label} with bytes copied from start..end, independent of the original buffer, perfect for snapshotting before another worker mutates the source`,
    ),
  }),
  some: (f, _g, m) => ({
    prompt: `return true if any ${f.label} element passes the predicate, with empty-array meaning false the way the spec wants and the bug ticket disagrees with`,
    comment: `${f.label} some; empty array is false, predictably surprising.`,
    example: ex(
      f,
      m,
      `${f.group}: view, predicate: (n) => n > 0`,
      `return true if any ${f.label} element passes the predicate, with empty-array meaning false the way the spec wants and the bug ticket disagrees with`,
    ),
  }),
  sort: (f, _g, m) => ({
    prompt: `sort the ${f.label} in place ascending, with compareFn defaulting to numeric comparison instead of the lexicographic surprise plain Array uses`,
    comment: `${f.label} sort; numeric compareFn by default, unlike Array which sorts lexicographically.`,
    example: ex(
      f,
      m,
      `${f.group}: view, compareFn: (a, b) => a - b`,
      `sort the ${f.label} in place ascending, with compareFn defaulting to numeric comparison instead of the lexicographic surprise plain Array uses`,
    ),
  }),
  subarray: (f, _g, m) => ({
    prompt: `return a new ${f.label} that VIEWS the same buffer over [begin, end), sharing storage with the original so writes through one side appear through the other`,
    comment: `${f.label} subarray; aliased view, mutations are visible both sides.`,
    example: ex(
      f,
      m,
      `${f.group}: view, begin: 0, end: 8`,
      `return a new ${f.label} that VIEWS the same buffer over [begin, end), sharing storage with the original so writes through one side appear through the other`,
    ),
  }),
  toBase64: (f, _g, m) => ({
    prompt: `encode the ${f.label} as a base64 string, with options.alphabet for url-safe output, so the JWT middleware stops choking on the + and / that standard base64 ships with`,
    comment: `${f.label} toBase64; url-safe alphabet fixes the + and / that breaks every JWT middleware.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `encode the ${f.label} as a base64 string, with options.alphabet for url-safe output, so the JWT middleware stops choking on the + and / that standard base64 ships with`,
    ),
  }),
  toHex: (f, _g, m) => ({
    prompt: `encode the ${f.label} as a lowercase hex string, the canonical representation every ETag and HMAC printout reaches for`,
    comment: `${f.label} toHex; lowercase canonical hex.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `encode the ${f.label} as a lowercase hex string, the canonical representation every ETag and HMAC printout reaches for`,
    ),
  }),
  toReversed: (f, _g, m) => ({
    prompt: `return a new ${f.label} reversed, leaving the original intact, and unlike reverse() it will not surprise the other view sharing the same ArrayBuffer`,
    comment: `${f.label} toReversed; fresh buffer, the shared-ArrayBuffer sibling stays untouched.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `return a new ${f.label} reversed, leaving the original intact, and unlike reverse() it will not surprise the other view sharing the same ArrayBuffer`,
    ),
  }),
  toSorted: (f, _g, m) => ({
    prompt: `return a new ${f.label} sorted by compareFn (or numeric ascending) without mutating the original, the immutable sort the audit trail finally demands`,
    comment: `${f.label} toSorted; non-mutating sort.`,
    example: ex(
      f,
      m,
      `${f.group}: view, compareFn: (a, b) => a - b`,
      `return a new ${f.label} sorted by compareFn (or numeric ascending) without mutating the original, the immutable sort the audit trail finally demands`,
    ),
  }),
  values: (f, _g, m) => ({
    prompt: `yield each ${f.label} element in storage order as a JS Number, the iterator for-of calls implicitly and the one that surprises you when a ${f.domain} element comes out looking larger than expected`,
    comment: `${f.label} values; implicit for-of target, elements arrive as JS Numbers not raw bytes.`,
    example: ex(
      f,
      m,
      `${f.group}: view`,
      `yield each ${f.label} element in storage order, already coerced into the JS Number domain (${f.domain}), the iterator the for-of loop quietly relies on`,
    ),
  }),
  with: (f, _g, m) => ({
    prompt: `return a new ${f.label} with index replaced by value, leaving the original untouched, with the same coercion rule (${f.domain}) the storage layer always applies`,
    comment: `${f.label} with; non-mutating index-set, value coerced into the domain.`,
    example: ex(
      f,
      m,
      `${f.group}: view, index: 0, value: ${f.exampleValue}`,
      `return a new ${f.label} with index replaced by value, leaving the original untouched, with the same coercion rule (${f.domain}) the storage layer always applies`,
    ),
  }),
};

/**
 * Methods present on every TypedArray. Anything outside this set is
 * gated by `EXTRA_METHODS_PER_GROUP` below.
 */
const COMMON_METHODS = new Set([
  'at',
  'copyWithin',
  'entries',
  'every',
  'fill',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'forEach',
  'from',
  'includes',
  'indexOf',
  'join',
  'keys',
  'lastIndexOf',
  'map',
  'of',
  'reduce',
  'reduceRight',
  'reverse',
  'set',
  'slice',
  'some',
  'sort',
  'subarray',
  'toReversed',
  'toSorted',
  'values',
  'with',
]);

/**
 * Per-group method whitelist for entries OUTSIDE the common set.
 * `Uint8Array` got the base64 / hex helpers in 2025; the others didn't.
 */
const EXTRA_METHODS_PER_GROUP: Record<string, string[]> = {
  uint8Array: ['fromBase64', 'fromHex', 'setFromBase64', 'setFromHex', 'toBase64', 'toHex'],
};

export function typedArrayPrompts(): Map<string, CuratedPrompt> {
  const out = new Map<string, CuratedPrompt>();
  for (const flavor of FLAVORS) {
    const methods = new Set<string>(COMMON_METHODS);
    const extras = EXTRA_METHODS_PER_GROUP[flavor.group] ?? [];
    for (const m of extras) methods.add(m);
    for (const method of methods) {
      const tpl = TEMPLATES[method];
      if (!tpl) continue;
      out.set(`neuro.${flavor.group}.${method}`, tpl(flavor, flavor.group, method));
    }
  }
  return out;
}
