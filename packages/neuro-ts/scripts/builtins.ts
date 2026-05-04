/**
 * Whitelist of JS built-in interfaces we generate `neuro.*` wrappers for.
 *
 * - `interface`: TS interface name as it appears in lib.*.d.ts.
 * - `group`: lowercase namespace key for the `neuro` umbrella export
 *           (e.g. `math` -> `neuro.math.random`).
 * - `kind`: 'instance' = methods invoked on a value; 'static' = methods invoked
 *           on the constructor / static object (e.g. `Math.random`).
 * - `instanceType`: TypeScript type of the receiver (only for 'instance' kind).
 * - `functionIdPrefix`: how the method is referenced for the LLM prompt and for
 *           native lookup (e.g. `Array.prototype`).
 * - `nativeRoot`: dotted path that resolves to the native implementation at
 *           runtime (e.g. `Array.prototype` -> `Array.prototype.map`).
 */
export interface BuiltinSpec {
  interface: string;
  group: string;
  kind: 'instance' | 'static';
  instanceType?: string;
  functionIdPrefix: string;
  nativeRoot: string;
  /**
   * The named-key the runtime uses for the receiver in the new
   * object-literal API. Only meaningful for `kind: 'instance'`. The
   * generator emits this as the first key of the input object literal,
   * e.g. `neuro.array.map({ array, callbackfn })`.
   */
  receiverKey?: string;
}

export const BUILTINS: BuiltinSpec[] = [
  // Array
  {
    interface: 'Array',
    group: 'array',
    kind: 'instance',
    instanceType: 'T[]',
    functionIdPrefix: 'Array.prototype',
    nativeRoot: 'Array.prototype',
    receiverKey: 'array',
  },
  {
    interface: 'ArrayConstructor',
    group: 'array',
    kind: 'static',
    functionIdPrefix: 'Array',
    nativeRoot: 'Array',
  },

  // String
  {
    interface: 'String',
    group: 'string',
    kind: 'instance',
    instanceType: 'string',
    functionIdPrefix: 'String.prototype',
    nativeRoot: 'String.prototype',
    receiverKey: 'string',
  },
  {
    interface: 'StringConstructor',
    group: 'string',
    kind: 'static',
    functionIdPrefix: 'String',
    nativeRoot: 'String',
  },

  // Math (all static)
  {
    interface: 'Math',
    group: 'math',
    kind: 'static',
    functionIdPrefix: 'Math',
    nativeRoot: 'Math',
  },

  // Object
  {
    interface: 'Object',
    group: 'object',
    kind: 'instance',
    instanceType: 'object',
    functionIdPrefix: 'Object.prototype',
    nativeRoot: 'Object.prototype',
    receiverKey: 'object',
  },
  {
    interface: 'ObjectConstructor',
    group: 'object',
    kind: 'static',
    functionIdPrefix: 'Object',
    nativeRoot: 'Object',
  },

  // Number
  {
    interface: 'Number',
    group: 'number',
    kind: 'instance',
    instanceType: 'number',
    functionIdPrefix: 'Number.prototype',
    nativeRoot: 'Number.prototype',
    receiverKey: 'number',
  },
  {
    interface: 'NumberConstructor',
    group: 'number',
    kind: 'static',
    functionIdPrefix: 'Number',
    nativeRoot: 'Number',
  },

  // Date
  {
    interface: 'Date',
    group: 'date',
    kind: 'instance',
    instanceType: 'Date',
    functionIdPrefix: 'Date.prototype',
    nativeRoot: 'Date.prototype',
    receiverKey: 'date',
  },
  {
    interface: 'DateConstructor',
    group: 'date',
    kind: 'static',
    functionIdPrefix: 'Date',
    nativeRoot: 'Date',
  },

  // JSON
  {
    interface: 'JSON',
    group: 'json',
    kind: 'static',
    functionIdPrefix: 'JSON',
    nativeRoot: 'JSON',
  },

  // Map / WeakMap
  {
    interface: 'Map',
    group: 'map',
    kind: 'instance',
    instanceType: 'Map<K, V>',
    functionIdPrefix: 'Map.prototype',
    nativeRoot: 'Map.prototype',
    receiverKey: 'map',
  },
  {
    interface: 'MapConstructor',
    group: 'map',
    kind: 'static',
    functionIdPrefix: 'Map',
    nativeRoot: 'Map',
  },
  {
    interface: 'WeakMap',
    group: 'weakMap',
    kind: 'instance',
    instanceType: 'WeakMap<K, V>',
    functionIdPrefix: 'WeakMap.prototype',
    nativeRoot: 'WeakMap.prototype',
    receiverKey: 'weakMap',
  },

  // Set / WeakSet
  {
    interface: 'Set',
    group: 'set',
    kind: 'instance',
    instanceType: 'Set<T>',
    functionIdPrefix: 'Set.prototype',
    nativeRoot: 'Set.prototype',
    receiverKey: 'set',
  },
  {
    interface: 'SetConstructor',
    group: 'set',
    kind: 'static',
    functionIdPrefix: 'Set',
    nativeRoot: 'Set',
  },
  {
    interface: 'WeakSet',
    group: 'weakSet',
    kind: 'instance',
    instanceType: 'WeakSet<T>',
    functionIdPrefix: 'WeakSet.prototype',
    nativeRoot: 'WeakSet.prototype',
    receiverKey: 'weakSet',
  },

  // Promise
  {
    interface: 'Promise',
    group: 'promise',
    kind: 'instance',
    instanceType: 'Promise<T>',
    functionIdPrefix: 'Promise.prototype',
    nativeRoot: 'Promise.prototype',
    receiverKey: 'promise',
  },
  {
    interface: 'PromiseConstructor',
    group: 'promise',
    kind: 'static',
    functionIdPrefix: 'Promise',
    nativeRoot: 'Promise',
  },

  // RegExp
  {
    interface: 'RegExp',
    group: 'regExp',
    kind: 'instance',
    instanceType: 'RegExp',
    functionIdPrefix: 'RegExp.prototype',
    nativeRoot: 'RegExp.prototype',
    receiverKey: 'regExp',
  },

  // BigInt
  {
    interface: 'BigInt',
    group: 'bigInt',
    kind: 'instance',
    instanceType: 'bigint',
    functionIdPrefix: 'BigInt.prototype',
    nativeRoot: 'BigInt.prototype',
    receiverKey: 'bigInt',
  },
  {
    interface: 'BigIntConstructor',
    group: 'bigInt',
    kind: 'static',
    functionIdPrefix: 'BigInt',
    nativeRoot: 'BigInt',
  },

  // Symbol
  {
    interface: 'SymbolConstructor',
    group: 'symbol',
    kind: 'static',
    functionIdPrefix: 'Symbol',
    nativeRoot: 'Symbol',
  },

  // Atomics
  {
    interface: 'Atomics',
    group: 'atomics',
    kind: 'static',
    functionIdPrefix: 'Atomics',
    nativeRoot: 'Atomics',
  },

  // ArrayBuffer / DataView
  {
    interface: 'ArrayBuffer',
    group: 'arrayBuffer',
    kind: 'instance',
    instanceType: 'ArrayBuffer',
    functionIdPrefix: 'ArrayBuffer.prototype',
    nativeRoot: 'ArrayBuffer.prototype',
    receiverKey: 'arrayBuffer',
  },
  {
    interface: 'ArrayBufferConstructor',
    group: 'arrayBuffer',
    kind: 'static',
    functionIdPrefix: 'ArrayBuffer',
    nativeRoot: 'ArrayBuffer',
  },
  {
    interface: 'DataView',
    group: 'dataView',
    kind: 'instance',
    instanceType: 'DataView',
    functionIdPrefix: 'DataView.prototype',
    nativeRoot: 'DataView.prototype',
    receiverKey: 'dataView',
  },

  // Iterator helpers (ES2025: map, filter, take, drop, toArray, forEach,
  // reduce, flatMap, every, some, find, plus Iterator.from). Native
  // fallback auto-skips on older Node where the global is missing.
  // The instance methods live on `IteratorObject<T>` (which `Iterator<T>`
  // extends in lib.es2025.iterator.d.ts); we target `IteratorObject`
  // directly so the generator picks up the helpers, not just next/return/throw.
  {
    interface: 'IteratorObject',
    group: 'iterator',
    kind: 'instance',
    instanceType: 'IteratorObject<T, TReturn, TNext>',
    functionIdPrefix: 'Iterator.prototype',
    nativeRoot: 'Iterator.prototype',
    receiverKey: 'iterator',
  },
  {
    interface: 'IteratorConstructor',
    group: 'iterator',
    kind: 'static',
    functionIdPrefix: 'Iterator',
    nativeRoot: 'Iterator',
  },

  // Error.isError (ES2025 static). Instance methods on Error are noise
  // (toString/name/message/stack) so we wrap only the constructor surface.
  {
    interface: 'ErrorConstructor',
    group: 'error',
    kind: 'static',
    functionIdPrefix: 'Error',
    nativeRoot: 'Error',
  },

  // Typed arrays
  ...[
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array',
  ].flatMap((name) => {
    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    return [
      {
        interface: name,
        group: lower,
        kind: 'instance' as const,
        instanceType: name,
        functionIdPrefix: `${name}.prototype`,
        nativeRoot: `${name}.prototype`,
        receiverKey: lower,
      },
      {
        interface: `${name}Constructor`,
        group: lower,
        kind: 'static' as const,
        functionIdPrefix: name,
        nativeRoot: name,
      },
    ];
  }),
];

/** Globals like parseInt / parseFloat / isNaN / encodeURI ... live at neuro.<name>. */
export const GLOBAL_FUNCTIONS = [
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'structuredClone',
  'atob',
  'btoa',
  // 'eval' deliberately excluded - never a good idea to wrap.
];
