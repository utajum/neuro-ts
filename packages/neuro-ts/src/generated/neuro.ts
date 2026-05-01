// Auto-generated. Do not edit.
import * as array from './groups/array';
import * as arrayBuffer from './groups/arrayBuffer';
import * as atomics from './groups/atomics';
import * as bigInt from './groups/bigInt';
import * as bigInt64Array from './groups/bigInt64Array';
import * as bigUint64Array from './groups/bigUint64Array';
import * as dataView from './groups/dataView';
import * as date from './groups/date';
import * as float32Array from './groups/float32Array';
import * as float64Array from './groups/float64Array';
import * as int16Array from './groups/int16Array';
import * as int32Array from './groups/int32Array';
import * as int8Array from './groups/int8Array';
import * as json from './groups/json';
import * as map from './groups/map';
import * as math from './groups/math';
import * as number from './groups/number';
import * as object from './groups/object';
import * as promise from './groups/promise';
import * as regExp from './groups/regExp';
import * as set from './groups/set';
import * as string from './groups/string';
import * as symbol from './groups/symbol';
import * as uint16Array from './groups/uint16Array';
import * as uint32Array from './groups/uint32Array';
import * as uint8Array from './groups/uint8Array';
import * as uint8ClampedArray from './groups/uint8ClampedArray';
import * as weakMap from './groups/weakMap';
import * as weakSet from './groups/weakSet';
import * as globals from './groups/globals';

/**
 * The `neuro` umbrella. Group methods by built-in (`neuro.math.random`,
 * `neuro.array.map`, `neuro.string.split`, ...). Globals such as
 * `parseInt` live at the top level (`neuro.parseInt`).
 *
 * Every method takes a single object literal whose keys mirror the original
 * built-in's parameter names plus an optional `prompt: string`. With a
 * non-empty `prompt`: routed to the configured LLM. Without one (or with
 * an empty string): dispatched to the native built-in.
 */
export const neuro = {
  array,
  arrayBuffer,
  atomics,
  bigInt,
  bigInt64Array,
  bigUint64Array,
  dataView,
  date,
  float32Array,
  float64Array,
  int16Array,
  int32Array,
  int8Array,
  json,
  map,
  math,
  number,
  object,
  promise,
  regExp,
  set,
  string,
  symbol,
  uint16Array,
  uint32Array,
  uint8Array,
  uint8ClampedArray,
  weakMap,
  weakSet,
  ...globals,
};

export type NeuroNamespace = typeof neuro;
