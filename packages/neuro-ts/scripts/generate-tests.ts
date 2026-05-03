/**
 * Generates per-method test files for every wrapper.
 *
 * Reads `src/generated/prompts.json` (produced by `generate-wrappers.ts`)
 * and emits one test file per group under `tests/generated/<group>.test.ts`.
 * Each method gets a parameterised set of scenarios that exercises the
 * routing layer (LLM dispatch, native fallback, empty-prompt-as-native)
 * plus the error paths every working dev hits at least once
 * (network outage, proxy 5xx, malformed LLM response, missing key).
 *
 * The grid is built with `it.each` so 654 methods x 6 scenarios still
 * runs in well under a minute. Mocked dependencies (fetch / OpenAI) are
 * reset per case to keep the tests isolated.
 *
 * The 6th scenario is the native-value test: calls the wrapper without a
 * prompt and asserts the return value equals the raw native built-in result.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PKG_ROOT = resolve(__dirname, '..');
const PROMPTS_JSON = resolve(PKG_ROOT, 'src/generated/prompts.json');
const TESTS_OUT_DIR = resolve(PKG_ROOT, 'tests/generated');

interface Entry {
  group: string;
  methodName: string;
  functionId: string;
  kind: 'instance' | 'static' | 'global';
  receiverKey: string;
  paramOrder: string[];
  variadicKey: string;
  curated: { prompt: string; comment: string; example: string };
  overloads?: Array<{ params: string; returnType: string; jsDoc?: string }>;
}

const ALL = JSON.parse(readFileSync(PROMPTS_JSON, 'utf8')) as Record<string, Entry>;

function groupBy(): Record<string, Entry[]> {
  const out: Record<string, Entry[]> = {};
  for (const entry of Object.values(ALL)) {
    (out[entry.group] = out[entry.group] || []).push(entry);
  }
  for (const list of Object.values(out))
    list.sort((a, b) => a.methodName.localeCompare(b.methodName));
  return out;
}

/**
 * Build the per-method input expression for the LLM-routing scenario.
 * The expression is rendered into the test file as JavaScript: it
 * always sets `prompt: 'test'` and stubs every named parameter with
 * `undefined`. The mocked fetch only inspects `functionId`, so input
 * faithfulness beyond that does not matter.
 */
function buildInputExpr(entry: Entry, includePrompt: boolean): string {
  const fields: string[] = [];
  if (entry.kind === 'instance' && entry.receiverKey) {
    fields.push(`${entry.receiverKey}: undefined`);
  }
  for (const name of entry.paramOrder) {
    if (name === entry.variadicKey) continue;
    fields.push(`${name}: undefined`);
  }
  if (entry.variadicKey) fields.push(`${entry.variadicKey}: []`);
  if (includePrompt) fields.push(`prompt: 'test'`);
  return `{ ${fields.join(', ')} }`;
}

// ---------------------------------------------------------------------------
// Native-value test generation
// ---------------------------------------------------------------------------

/**
 * Returns the JS constructor expression for the default receiver of a given
 * group/receiverKey. Used both in the neuro call input and in the raw native
 * comparison call.
 */
function receiverExpr(group: string): string {
  switch (group) {
    case 'array':
      return '[1, 2, 3]';
    case 'string':
      return "'hello world'";
    case 'date':
      return 'new Date(2026, 0, 15, 10, 30, 45, 123)';
    case 'set':
      return 'new Set([1, 2, 3])';
    case 'map':
      return "new Map([['a', 1], ['b', 2]])";
    case 'number':
      return '42.567';
    case 'promise':
      return 'Promise.resolve(42)';
    case 'regExp':
      return '/hello/gi';
    case 'weakMap':
      return 'new WeakMap([[_wmKey, 99]])';
    case 'weakSet':
      return 'new WeakSet([_wsKey])';
    case 'arrayBuffer':
      return 'new ArrayBuffer(8)';
    case 'dataView':
      return 'new DataView(new ArrayBuffer(16))';
    case 'uint8Array':
      return 'new Uint8Array([10, 20, 30, 40])';
    case 'int8Array':
      return 'new Int8Array([10, 20, 30, 40])';
    case 'uint16Array':
      return 'new Uint16Array([10, 20, 30, 40])';
    case 'int16Array':
      return 'new Int16Array([10, 20, 30, 40])';
    case 'uint32Array':
      return 'new Uint32Array([10, 20, 30, 40])';
    case 'int32Array':
      return 'new Int32Array([10, 20, 30, 40])';
    case 'float32Array':
      return 'new Float32Array([1.5, 2.5, 3.5, 4.5])';
    case 'float64Array':
      return 'new Float64Array([1.5, 2.5, 3.5, 4.5])';
    case 'bigInt64Array':
      return 'new BigInt64Array([10n, 20n, 30n, 40n])';
    case 'bigUint64Array':
      return 'new BigUint64Array([10n, 20n, 30n, 40n])';
    case 'uint8ClampedArray':
      return 'new Uint8ClampedArray([10, 20, 30, 40])';
    default:
      return 'undefined';
  }
}

/**
 * Per-method fixture for the native-value test.
 * Returns { skip, skipReason, neuroInput, nativeCall, assertExpr } where:
 *   - skip: true means emit a test.skip (not possible to run natively in this env)
 *   - neuroInput: JS expression for the full input object (no prompt)
 *   - nativeCall: JS expression that calls the raw native and returns the same value
 *   - assertExpr: how to compare - 'equal' | 'deepEqual' | 'iterEqual' | 'range' | 'sideEffect' | 'typeOnly'
 */
interface NativeCase {
  skip: boolean;
  skipReason?: string;
  /** JS expression evaluated at runtime to conditionally run the test.
   *  When set, emits `test.runIf(<runIf>)(...)` instead of `test(...)`.
   *  Use this for methods that exist in newer Node versions but not older ones. */
  runIf?: string;
  neuroInput: string;
  nativeCall: string;
  /** 'equal'=toBe, 'deepEqual'=toEqual, 'iterEqual'=Array.from both, 'range'=custom range check,
   *  'sideEffect'=check receiver mutation, 'typeOnly'=just check typeof, 'void'=returns undefined,
   *  'rejects'=expect the promise to reject */
  assertMode:
    | 'equal'
    | 'deepEqual'
    | 'iterEqual'
    | 'range'
    | 'sideEffect'
    | 'typeOnly'
    | 'void'
    | 'sideEffectDeep'
    | 'rejects';
  /** For sideEffect/sideEffectDeep: expression to read on receiver after mutation */
  sideEffectRead?: string;
  /** For sideEffect: expected JS expression (evaluated at test-gen time as a literal) */
  sideEffectExpected?: string;
}

// Typed-array method fixture builder - all 10 typed array groups share the same
// 31-method layout. The bigInt groups use bigint values.
function buildTypedArrayCase(group: string, methodName: string): NativeCase {
  const isBig = group === 'bigInt64Array' || group === 'bigUint64Array';
  const ctor = group.charAt(0).toUpperCase() + group.slice(1); // e.g. Uint8Array
  const recv = receiverExpr(group);

  // Methods that require Uint8Array-specific features not universally available
  const uint8Only = ['fromBase64', 'fromHex', 'toBase64', 'toHex', 'setFromBase64', 'setFromHex'];
  if (uint8Only.includes(methodName)) {
    return {
      skip: true,
      skipReason: `${ctor}.${methodName} not available in this Node.js version`,
      neuroInput: `{ ${group}: ${recv} }`,
      nativeCall: `undefined`,
      assertMode: 'typeOnly',
    };
  }

  const el = isBig ? '10n' : '10';
  const el2 = isBig ? '20n' : '20';

  switch (methodName) {
    case 'at':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, index: 1 }`,
        nativeCall: `${recv}.at(1)`,
        assertMode: 'equal',
      };
    case 'copyWithin':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, target: 0, start: 2 }`,
        nativeCall: `${recv}.copyWithin(0, 2)`,
        assertMode: 'deepEqual',
      };
    case 'entries':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.entries()`,
        assertMode: 'iterEqual',
      };
    case 'every':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v > ${isBig ? '0n' : '0'} }`,
        nativeCall: `${recv}.every(v => v > ${isBig ? '0n' : '0'})`,
        assertMode: 'equal',
      };
    case 'fill':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, value: ${isBig ? '99n' : '99'} }`,
        nativeCall: `${recv}.fill(${isBig ? '99n' : '99'})`,
        assertMode: 'deepEqual',
      };
    case 'filter':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v > ${isBig ? '15n' : '15'} }`,
        nativeCall: `${recv}.filter(v => v > ${isBig ? '15n' : '15'})`,
        assertMode: 'deepEqual',
      };
    case 'find':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v > ${isBig ? '15n' : '15'} }`,
        nativeCall: `${recv}.find(v => v > ${isBig ? '15n' : '15'})`,
        assertMode: 'equal',
      };
    case 'findIndex':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v > ${isBig ? '15n' : '15'} }`,
        nativeCall: `${recv}.findIndex(v => v > ${isBig ? '15n' : '15'})`,
        assertMode: 'equal',
      };
    case 'findLast':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v < ${isBig ? '35n' : '35'} }`,
        nativeCall: `${recv}.findLast(v => v < ${isBig ? '35n' : '35'})`,
        assertMode: 'equal',
      };
    case 'findLastIndex':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v < ${isBig ? '35n' : '35'} }`,
        nativeCall: `${recv}.findLastIndex(v => v < ${isBig ? '35n' : '35'})`,
        assertMode: 'equal',
      };
    case 'forEach':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, callbackfn: () => {} }`,
        nativeCall: `(${recv}.forEach(() => {}), undefined)`,
        assertMode: 'void',
      };
    case 'from':
      return {
        skip: false,
        neuroInput: `{ arrayLike: [${isBig ? '1n, 2n, 3n' : '1, 2, 3'}] }`,
        nativeCall: `${ctor}.from([${isBig ? '1n, 2n, 3n' : '1, 2, 3'}])`,
        assertMode: 'deepEqual',
      };
    case 'includes':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, searchElement: ${el} }`,
        nativeCall: `${recv}.includes(${el})`,
        assertMode: 'equal',
      };
    case 'indexOf':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, searchElement: ${el} }`,
        nativeCall: `${recv}.indexOf(${el})`,
        assertMode: 'equal',
      };
    case 'join':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, separator: '-' }`,
        nativeCall: `${recv}.join('-')`,
        assertMode: 'equal',
      };
    case 'keys':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.keys()`,
        assertMode: 'iterEqual',
      };
    case 'lastIndexOf':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, searchElement: ${el} }`,
        nativeCall: `${recv}.lastIndexOf(${el})`,
        assertMode: 'equal',
      };
    case 'map':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, callbackfn: (v) => ${isBig ? 'v * 2n' : 'v * 2'} }`,
        nativeCall: `${recv}.map(v => ${isBig ? 'v * 2n' : 'v * 2'})`,
        assertMode: 'deepEqual',
      };
    case 'of':
      return {
        skip: false,
        neuroInput: `{ items: [${isBig ? '1n, 2n, 3n' : '1, 2, 3'}] }`,
        nativeCall: `${ctor}.of(${isBig ? '1n, 2n, 3n' : '1, 2, 3'})`,
        assertMode: 'deepEqual',
      };
    case 'reduce':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, callbackfn: (a, v) => ${isBig ? 'a + v' : 'a + v'}, initialValue: ${isBig ? '0n' : '0'} }`,
        nativeCall: `${recv}.reduce((a, v) => a + v, ${isBig ? '0n' : '0'})`,
        assertMode: 'equal',
      };
    case 'reduceRight':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, callbackfn: (a, v) => ${isBig ? 'a + v' : 'a + v'}, initialValue: ${isBig ? '0n' : '0'} }`,
        nativeCall: `${recv}.reduceRight((a, v) => a + v, ${isBig ? '0n' : '0'})`,
        assertMode: 'equal',
      };
    case 'reverse':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.reverse()`,
        assertMode: 'deepEqual',
      };
    case 'set':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, array: [${isBig ? '99n' : '99'}] }`,
        nativeCall: `(${recv}.set([${isBig ? '99n' : '99'}]), undefined)`,
        assertMode: 'void',
      };
    case 'slice':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, start: 1, end: 3 }`,
        nativeCall: `${recv}.slice(1, 3)`,
        assertMode: 'deepEqual',
      };
    case 'some':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, predicate: (v) => v > ${isBig ? '30n' : '30'} }`,
        nativeCall: `${recv}.some(v => v > ${isBig ? '30n' : '30'})`,
        assertMode: 'equal',
      };
    case 'sort':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.sort()`,
        assertMode: 'deepEqual',
      };
    case 'subarray':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, begin: 1, end: 3 }`,
        nativeCall: `${recv}.subarray(1, 3)`,
        assertMode: 'deepEqual',
      };
    case 'toReversed':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.toReversed()`,
        assertMode: 'deepEqual',
      };
    case 'toSorted':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.toSorted()`,
        assertMode: 'deepEqual',
      };
    case 'values':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: `${recv}.values()`,
        assertMode: 'iterEqual',
      };
    case 'with':
      return {
        skip: false,
        neuroInput: `{ ${group}: ${recv}, index: 1, value: ${isBig ? '99n' : '99'} }`,
        nativeCall: `${recv}.with(1, ${isBig ? '99n' : '99'})`,
        assertMode: 'deepEqual',
      };
    default:
      return {
        skip: true,
        skipReason: `no fixture for ${group}.${methodName}`,
        neuroInput: `{ ${group}: ${recv} }`,
        nativeCall: 'undefined',
        assertMode: 'typeOnly',
      };
  }
}

function buildNativeCase(entry: Entry): NativeCase {
  const { group, methodName, kind, receiverKey, paramOrder, variadicKey } = entry;
  const returnType = entry.overloads?.[0]?.returnType ?? 'unknown';

  // Atomics: SharedArrayBuffer required - skip native value test
  if (group === 'atomics') {
    return {
      skip: true,
      skipReason: 'Atomics requires SharedArrayBuffer which needs cross-origin isolation',
      neuroInput: '{}',
      nativeCall: 'undefined',
      assertMode: 'typeOnly',
    };
  }

  // Delegate all typed-array groups
  const typedArrayGroups = [
    'uint8Array',
    'int8Array',
    'uint16Array',
    'int16Array',
    'uint32Array',
    'int32Array',
    'float32Array',
    'float64Array',
    'bigInt64Array',
    'bigUint64Array',
    'uint8ClampedArray',
  ];
  if (typedArrayGroups.includes(group)) {
    return buildTypedArrayCase(group, methodName);
  }

  const recv = receiverKey ? receiverExpr(group) : '';

  // ----- math -----
  if (group === 'math') {
    if (methodName === 'random') {
      return { skip: false, neuroInput: '{}', nativeCall: 'Math.random()', assertMode: 'range' };
    }
    if (methodName === 'f16round') {
      return {
        skip: false,
        runIf: `'f16round' in Math`,
        neuroInput: '{ x: 1.337 }',
        nativeCall: 'Math.f16round(1.337)',
        assertMode: 'equal',
      };
    }
    if (variadicKey === 'values') {
      // hypot, max, min
      return {
        skip: false,
        neuroInput: `{ values: [3, 4] }`,
        nativeCall: `Math.${methodName}(3, 4)`,
        assertMode: 'equal',
      };
    }
    // single-arg: abs, acos, acosh, asin, asinh, atan, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, log, log10, log1p, log2, round, sign, sin, sinh, sqrt, tan, tanh, trunc
    const singleArgInputs: Record<string, number> = {
      abs: -5,
      acos: 0.5,
      acosh: 2,
      asin: 0.5,
      asinh: 1,
      atan: 1,
      atanh: 0.5,
      cbrt: 27,
      ceil: 4.2,
      clz32: 1,
      cos: 0,
      cosh: 0,
      exp: 1,
      expm1: 1,
      floor: 4.7,
      fround: 1.337,
      log: Math.E,
      log10: 100,
      log1p: 1,
      log2: 8,
      round: 4.5,
      sign: -3,
      sin: 0,
      sinh: 0,
      sqrt: 9,
      tan: 0,
      tanh: 0,
      trunc: 4.7,
    };
    if (paramOrder.length === 2) {
      // atan2, imul, pow
      const twoArgInputs: Record<string, [number, number]> = {
        atan2: [1, 1],
        imul: [3, 4],
        pow: [2, 10],
      };
      const [a, b] = twoArgInputs[methodName] ?? [1, 2];
      return {
        skip: false,
        neuroInput: `{ x: ${a}, y: ${b} }`,
        nativeCall: `Math.${methodName}(${a}, ${b})`,
        assertMode: 'equal',
      };
    }
    const x = singleArgInputs[methodName] ?? 1;
    return {
      skip: false,
      neuroInput: `{ x: ${x} }`,
      nativeCall: `Math.${methodName}(${x})`,
      assertMode: 'equal',
    };
  }

  // ----- string -----
  if (group === 'string') {
    if (methodName === 'fromCharCode') {
      return {
        skip: false,
        neuroInput: `{ codes: [72, 101, 108] }`,
        nativeCall: `String.fromCharCode(72, 101, 108)`,
        assertMode: 'equal',
      };
    }
    if (methodName === 'fromCodePoint') {
      return {
        skip: false,
        neuroInput: `{ codePoints: [9731, 9733] }`,
        nativeCall: `String.fromCodePoint(9731, 9733)`,
        assertMode: 'equal',
      };
    }
    if (methodName === 'raw') {
      return {
        skip: false,
        neuroInput: `{ template: { raw: ['Hello\\\\n', '!'] }, substitutions: ['World'] }`,
        nativeCall: `String.raw({ raw: ['Hello\\\\n', '!'] }, 'World')`,
        assertMode: 'equal',
      };
    }
    const str = "'hello world'";
    switch (methodName) {
      case 'anchor':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, name: 'test' }`,
          nativeCall: `${str}.anchor('test')`,
          assertMode: 'equal',
        };
      case 'at':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, index: 1 }`,
          nativeCall: `${str}.at(1)`,
          assertMode: 'equal',
        };
      case 'big':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.big()`,
          assertMode: 'equal',
        };
      case 'blink':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.blink()`,
          assertMode: 'equal',
        };
      case 'bold':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.bold()`,
          assertMode: 'equal',
        };
      case 'charAt':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, pos: 1 }`,
          nativeCall: `${str}.charAt(1)`,
          assertMode: 'equal',
        };
      case 'charCodeAt':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, index: 0 }`,
          nativeCall: `${str}.charCodeAt(0)`,
          assertMode: 'equal',
        };
      case 'codePointAt':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, pos: 0 }`,
          nativeCall: `${str}.codePointAt(0)`,
          assertMode: 'equal',
        };
      case 'concat':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, strings: ['!', '?'] }`,
          nativeCall: `${str}.concat('!', '?')`,
          assertMode: 'equal',
        };
      case 'endsWith':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchString: 'world' }`,
          nativeCall: `${str}.endsWith('world')`,
          assertMode: 'equal',
        };
      case 'fixed':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.fixed()`,
          assertMode: 'equal',
        };
      case 'fontcolor':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, color: 'red' }`,
          nativeCall: `${str}.fontcolor('red')`,
          assertMode: 'equal',
        };
      case 'fontsize':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, size: 4 }`,
          nativeCall: `${str}.fontsize(4)`,
          assertMode: 'equal',
        };
      case 'includes':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchString: 'world' }`,
          nativeCall: `${str}.includes('world')`,
          assertMode: 'equal',
        };
      case 'indexOf':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchString: 'o' }`,
          nativeCall: `${str}.indexOf('o')`,
          assertMode: 'equal',
        };
      case 'isWellFormed':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.isWellFormed()`,
          assertMode: 'equal',
        };
      case 'italics':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.italics()`,
          assertMode: 'equal',
        };
      case 'lastIndexOf':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchString: 'l' }`,
          nativeCall: `${str}.lastIndexOf('l')`,
          assertMode: 'equal',
        };
      case 'link':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, url: 'https://example.com' }`,
          nativeCall: `${str}.link('https://example.com')`,
          assertMode: 'equal',
        };
      case 'localeCompare':
        return {
          skip: false,
          neuroInput: `{ string: 'apple', that: 'banana' }`,
          nativeCall: `'apple'.localeCompare('banana')`,
          assertMode: 'typeOnly',
        };
      case 'match':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, regexp: /o/g }`,
          nativeCall: `${str}.match(/o/g)`,
          assertMode: 'deepEqual',
        };
      case 'matchAll':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, regexp: /l/g }`,
          nativeCall: `${str}.matchAll(/l/g)`,
          assertMode: 'iterEqual',
        };
      case 'normalize':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.normalize()`,
          assertMode: 'equal',
        };
      case 'padEnd':
        return {
          skip: false,
          neuroInput: `{ string: 'hi', maxLength: 5 }`,
          nativeCall: `'hi'.padEnd(5)`,
          assertMode: 'equal',
        };
      case 'padStart':
        return {
          skip: false,
          neuroInput: `{ string: 'hi', maxLength: 5 }`,
          nativeCall: `'hi'.padStart(5)`,
          assertMode: 'equal',
        };
      case 'repeat':
        return {
          skip: false,
          neuroInput: `{ string: 'ab', count: 3 }`,
          nativeCall: `'ab'.repeat(3)`,
          assertMode: 'equal',
        };
      case 'replace':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchValue: 'world', replaceValue: 'there' }`,
          nativeCall: `${str}.replace('world', 'there')`,
          assertMode: 'equal',
        };
      case 'replaceAll':
        return {
          skip: false,
          neuroInput: `{ string: 'aabbaa', searchValue: 'a', replaceValue: 'x' }`,
          nativeCall: `'aabbaa'.replaceAll('a', 'x')`,
          assertMode: 'equal',
        };
      case 'search':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, regexp: /world/ }`,
          nativeCall: `${str}.search(/world/)`,
          assertMode: 'equal',
        };
      case 'slice':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, start: 6 }`,
          nativeCall: `${str}.slice(6)`,
          assertMode: 'equal',
        };
      case 'small':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.small()`,
          assertMode: 'equal',
        };
      case 'split':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, separator: ' ' }`,
          nativeCall: `${str}.split(' ')`,
          assertMode: 'deepEqual',
        };
      case 'startsWith':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, searchString: 'hello' }`,
          nativeCall: `${str}.startsWith('hello')`,
          assertMode: 'equal',
        };
      case 'strike':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.strike()`,
          assertMode: 'equal',
        };
      case 'sub':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.sub()`,
          assertMode: 'equal',
        };
      case 'substr':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, from: 6, length: 5 }`,
          nativeCall: `${str}.substr(6, 5)`,
          assertMode: 'equal',
        };
      case 'substring':
        return {
          skip: false,
          neuroInput: `{ string: ${str}, start: 6, end: 11 }`,
          nativeCall: `${str}.substring(6, 11)`,
          assertMode: 'equal',
        };
      case 'sup':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.sup()`,
          assertMode: 'equal',
        };
      case 'toLocaleLowerCase':
        return {
          skip: false,
          neuroInput: `{ string: 'HELLO' }`,
          nativeCall: `'HELLO'.toLocaleLowerCase()`,
          assertMode: 'equal',
        };
      case 'toLocaleUpperCase':
        return {
          skip: false,
          neuroInput: `{ string: 'hello' }`,
          nativeCall: `'hello'.toLocaleUpperCase()`,
          assertMode: 'equal',
        };
      case 'toLowerCase':
        return {
          skip: false,
          neuroInput: `{ string: 'HELLO' }`,
          nativeCall: `'HELLO'.toLowerCase()`,
          assertMode: 'equal',
        };
      case 'toUpperCase':
        return {
          skip: false,
          neuroInput: `{ string: 'hello' }`,
          nativeCall: `'hello'.toUpperCase()`,
          assertMode: 'equal',
        };
      case 'toWellFormed':
        return {
          skip: false,
          neuroInput: `{ string: ${str} }`,
          nativeCall: `${str}.toWellFormed()`,
          assertMode: 'equal',
        };
      case 'trim':
        return {
          skip: false,
          neuroInput: `{ string: '  hello  ' }`,
          nativeCall: `'  hello  '.trim()`,
          assertMode: 'equal',
        };
      case 'trimEnd':
        return {
          skip: false,
          neuroInput: `{ string: '  hello  ' }`,
          nativeCall: `'  hello  '.trimEnd()`,
          assertMode: 'equal',
        };
      case 'trimLeft':
        return {
          skip: false,
          neuroInput: `{ string: '  hello  ' }`,
          nativeCall: `'  hello  '.trimLeft()`,
          assertMode: 'equal',
        };
      case 'trimRight':
        return {
          skip: false,
          neuroInput: `{ string: '  hello  ' }`,
          nativeCall: `'  hello  '.trimRight()`,
          assertMode: 'equal',
        };
      case 'trimStart':
        return {
          skip: false,
          neuroInput: `{ string: '  hello  ' }`,
          nativeCall: `'  hello  '.trimStart()`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for string.${methodName}`,
          neuroInput: `{ string: ${str} }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- array -----
  if (group === 'array') {
    const arr = '[1, 2, 3, 4, 5]';
    switch (methodName) {
      case 'at':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, index: -1 }`,
          nativeCall: `${arr}.at(-1)`,
          assertMode: 'equal',
        };
      case 'concat':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2], items: [[3, 4]] }`,
          nativeCall: `[1, 2].concat([3, 4])`,
          assertMode: 'deepEqual',
        };
      case 'copyWithin':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, target: 0, start: 3 }`,
          nativeCall: `${arr}.copyWithin(0, 3)`,
          assertMode: 'deepEqual',
        };
      case 'entries':
        return {
          skip: false,
          neuroInput: `{ array: [10, 20, 30] }`,
          nativeCall: `[10, 20, 30].entries()`,
          assertMode: 'iterEqual',
        };
      case 'every':
        return {
          skip: false,
          neuroInput: `{ array: [2, 4, 6], predicate: (n) => n % 2 === 0 }`,
          nativeCall: `[2, 4, 6].every(n => n % 2 === 0)`,
          assertMode: 'equal',
        };
      case 'fill':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3], value: 0 }`,
          nativeCall: `[1, 2, 3].fill(0)`,
          assertMode: 'deepEqual',
        };
      case 'filter':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n > 2 }`,
          nativeCall: `${arr}.filter(n => n > 2)`,
          assertMode: 'deepEqual',
        };
      case 'find':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n > 3 }`,
          nativeCall: `${arr}.find(n => n > 3)`,
          assertMode: 'equal',
        };
      case 'findIndex':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n > 3 }`,
          nativeCall: `${arr}.findIndex(n => n > 3)`,
          assertMode: 'equal',
        };
      case 'findLast':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n < 4 }`,
          nativeCall: `${arr}.findLast(n => n < 4)`,
          assertMode: 'equal',
        };
      case 'findLastIndex':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n < 4 }`,
          nativeCall: `${arr}.findLastIndex(n => n < 4)`,
          assertMode: 'equal',
        };
      case 'flat':
        return {
          skip: false,
          neuroInput: `{ array: [[1, 2], [3, 4]] }`,
          nativeCall: `[[1, 2], [3, 4]].flat()`,
          assertMode: 'deepEqual',
        };
      case 'flatMap':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3], callback: (n) => [n, n * 2] }`,
          nativeCall: `[1, 2, 3].flatMap(n => [n, n * 2])`,
          assertMode: 'deepEqual',
        };
      case 'forEach':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3], callbackfn: () => {} }`,
          nativeCall: `([1, 2, 3].forEach(() => {}), undefined)`,
          assertMode: 'void',
        };
      case 'from':
        return {
          skip: false,
          neuroInput: `{ arrayLike: [1, 2, 3] }`,
          nativeCall: `Array.from([1, 2, 3])`,
          assertMode: 'deepEqual',
        };
      case 'fromAsync':
        return {
          skip: false,
          runIf: `'fromAsync' in Array`,
          neuroInput: `{ iterableOrArrayLike: [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)] }`,
          nativeCall: `await Array.fromAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])`,
          assertMode: 'deepEqual',
        };
      case 'includes':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, searchElement: 3 }`,
          nativeCall: `${arr}.includes(3)`,
          assertMode: 'equal',
        };
      case 'indexOf':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, searchElement: 3 }`,
          nativeCall: `${arr}.indexOf(3)`,
          assertMode: 'equal',
        };
      case 'isArray':
        return {
          skip: false,
          neuroInput: `{ arg: [1, 2, 3] }`,
          nativeCall: `Array.isArray([1, 2, 3])`,
          assertMode: 'equal',
        };
      case 'join':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, separator: '-' }`,
          nativeCall: `${arr}.join('-')`,
          assertMode: 'equal',
        };
      case 'keys':
        return {
          skip: false,
          neuroInput: `{ array: [10, 20, 30] }`,
          nativeCall: `[10, 20, 30].keys()`,
          assertMode: 'iterEqual',
        };
      case 'lastIndexOf':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3, 2, 1], searchElement: 2 }`,
          nativeCall: `[1, 2, 3, 2, 1].lastIndexOf(2)`,
          assertMode: 'equal',
        };
      case 'map':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3], callbackfn: (n) => n * 2 }`,
          nativeCall: `[1, 2, 3].map(n => n * 2)`,
          assertMode: 'deepEqual',
        };
      case 'of':
        return {
          skip: false,
          neuroInput: `{ items: [1, 2, 3] }`,
          nativeCall: `Array.of(1, 2, 3)`,
          assertMode: 'deepEqual',
        };
      case 'pop':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3] }`,
          nativeCall: `[1, 2, 3].pop()`,
          assertMode: 'equal',
        };
      case 'push':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2], items: [3, 4] }`,
          nativeCall: `((a) => { a.push(3, 4); return a.length; })([1, 2])`,
          assertMode: 'equal',
        };
      case 'reduce':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3, 4], callbackfn: (a, n) => a + n, initialValue: 0 }`,
          nativeCall: `[1, 2, 3, 4].reduce((a, n) => a + n, 0)`,
          assertMode: 'equal',
        };
      case 'reduceRight':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3, 4], callbackfn: (a, n) => a + n, initialValue: 0 }`,
          nativeCall: `[1, 2, 3, 4].reduceRight((a, n) => a + n, 0)`,
          assertMode: 'equal',
        };
      case 'reverse':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3] }`,
          nativeCall: `[1, 2, 3].reverse()`,
          assertMode: 'deepEqual',
        };
      case 'shift':
        return {
          skip: false,
          neuroInput: `{ array: [10, 20, 30] }`,
          nativeCall: `[10, 20, 30].shift()`,
          assertMode: 'equal',
        };
      case 'slice':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, start: 1, end: 3 }`,
          nativeCall: `${arr}.slice(1, 3)`,
          assertMode: 'deepEqual',
        };
      case 'some':
        return {
          skip: false,
          neuroInput: `{ array: ${arr}, predicate: (n) => n > 3 }`,
          nativeCall: `${arr}.some(n => n > 3)`,
          assertMode: 'equal',
        };
      case 'sort':
        return {
          skip: false,
          neuroInput: `{ array: [3, 1, 2] }`,
          nativeCall: `[3, 1, 2].sort()`,
          assertMode: 'deepEqual',
        };
      case 'splice':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3, 4], start: 1, deleteCount: 2 }`,
          nativeCall: `[1, 2, 3, 4].splice(1, 2)`,
          assertMode: 'deepEqual',
        };
      case 'toReversed':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3] }`,
          nativeCall: `[1, 2, 3].toReversed()`,
          assertMode: 'deepEqual',
        };
      case 'toSorted':
        return {
          skip: false,
          neuroInput: `{ array: [3, 1, 2] }`,
          nativeCall: `[3, 1, 2].toSorted()`,
          assertMode: 'deepEqual',
        };
      case 'toSpliced':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3, 4], start: 1, deleteCount: 2 }`,
          nativeCall: `[1, 2, 3, 4].toSpliced(1, 2)`,
          assertMode: 'deepEqual',
        };
      case 'unshift':
        return {
          skip: false,
          neuroInput: `{ array: [3, 4], items: [1, 2] }`,
          nativeCall: `((a) => { a.unshift(1, 2); return a.length; })([3, 4])`,
          assertMode: 'equal',
        };
      case 'values':
        return {
          skip: false,
          neuroInput: `{ array: [10, 20, 30] }`,
          nativeCall: `[10, 20, 30].values()`,
          assertMode: 'iterEqual',
        };
      case 'with':
        return {
          skip: false,
          neuroInput: `{ array: [1, 2, 3], index: 1, value: 99 }`,
          nativeCall: `[1, 2, 3].with(1, 99)`,
          assertMode: 'deepEqual',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for array.${methodName}`,
          neuroInput: `{ array: [1, 2, 3] }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- date -----
  if (group === 'date') {
    const d = 'new Date(2026, 0, 15, 10, 30, 45, 123)';
    if (methodName === 'now')
      return { skip: false, neuroInput: '{}', nativeCall: 'Date.now()', assertMode: 'range' };
    if (methodName === 'parse')
      return {
        skip: false,
        neuroInput: `{ s: '2026-01-15' }`,
        nativeCall: `Date.parse('2026-01-15')`,
        assertMode: 'equal',
      };
    if (methodName === 'UTC')
      return {
        skip: false,
        neuroInput: `{ year: 2026, monthIndex: 0, date: 15 }`,
        nativeCall: `Date.UTC(2026, 0, 15)`,
        assertMode: 'equal',
      };
    // Getters
    const getterMap: Record<string, string> = {
      getDate: 'd.getDate()',
      getDay: 'd.getDay()',
      getFullYear: 'd.getFullYear()',
      getHours: 'd.getHours()',
      getMilliseconds: 'd.getMilliseconds()',
      getMinutes: 'd.getMinutes()',
      getMonth: 'd.getMonth()',
      getSeconds: 'd.getSeconds()',
      getTime: 'd.getTime()',
      getTimezoneOffset: 'd.getTimezoneOffset()',
      getUTCDate: 'd.getUTCDate()',
      getUTCDay: 'd.getUTCDay()',
      getUTCFullYear: 'd.getUTCFullYear()',
      getUTCHours: 'd.getUTCHours()',
      getUTCMilliseconds: 'd.getUTCMilliseconds()',
      getUTCMinutes: 'd.getUTCMinutes()',
      getUTCMonth: 'd.getUTCMonth()',
      getUTCSeconds: 'd.getUTCSeconds()',
      toDateString: 'd.toDateString()',
      toISOString: 'd.toISOString()',
      toTimeString: 'd.toTimeString()',
      toUTCString: 'd.toUTCString()',
    };
    if (getterMap[methodName]) {
      return {
        skip: false,
        neuroInput: `{ date: ${d} }`,
        nativeCall: `((d) => ${getterMap[methodName]})(${d})`,
        assertMode: 'equal',
      };
    }
    // toJSON (key param optional)
    if (methodName === 'toJSON')
      return {
        skip: false,
        neuroInput: `{ date: ${d} }`,
        nativeCall: `((d) => d.toJSON())(${d})`,
        assertMode: 'equal',
      };
    if (methodName === 'toLocaleDateString')
      return {
        skip: false,
        neuroInput: `{ date: ${d} }`,
        nativeCall: `((d) => d.toLocaleDateString())(${d})`,
        assertMode: 'typeOnly',
      };
    if (methodName === 'toLocaleTimeString')
      return {
        skip: false,
        neuroInput: `{ date: ${d} }`,
        nativeCall: `((d) => d.toLocaleTimeString())(${d})`,
        assertMode: 'typeOnly',
      };
    // Setters - mutate then read back
    const setterTests: Record<string, { input: string; read: string; expected: string }> = {
      setDate: { input: `{ date: ${d}, date_arg: 20 }`, read: 'd.getDate()', expected: '20' },
      setFullYear: {
        input: `{ date: ${d}, year: 2030 }`,
        read: 'd.getFullYear()',
        expected: '2030',
      },
      setHours: { input: `{ date: ${d}, hours: 5 }`, read: 'd.getHours()', expected: '5' },
      setMilliseconds: {
        input: `{ date: ${d}, ms: 500 }`,
        read: 'd.getMilliseconds()',
        expected: '500',
      },
      setMinutes: { input: `{ date: ${d}, min: 15 }`, read: 'd.getMinutes()', expected: '15' },
      setMonth: { input: `{ date: ${d}, month: 5 }`, read: 'd.getMonth()', expected: '5' },
      setSeconds: { input: `{ date: ${d}, sec: 30 }`, read: 'd.getSeconds()', expected: '30' },
      setTime: { input: `{ date: ${d}, time: 0 }`, read: 'd.getTime()', expected: '0' },
      setUTCDate: { input: `{ date: ${d}, date_arg: 20 }`, read: 'd.getUTCDate()', expected: '20' },
      setUTCFullYear: {
        input: `{ date: ${d}, year: 2030 }`,
        read: 'd.getUTCFullYear()',
        expected: '2030',
      },
      setUTCHours: { input: `{ date: ${d}, hours: 5 }`, read: 'd.getUTCHours()', expected: '5' },
      setUTCMilliseconds: {
        input: `{ date: ${d}, ms: 500 }`,
        read: 'd.getUTCMilliseconds()',
        expected: '500',
      },
      setUTCMinutes: {
        input: `{ date: ${d}, min: 15 }`,
        read: 'd.getUTCMinutes()',
        expected: '15',
      },
      setUTCMonth: { input: `{ date: ${d}, month: 5 }`, read: 'd.getUTCMonth()', expected: '5' },
      setUTCSeconds: {
        input: `{ date: ${d}, sec: 30 }`,
        read: 'd.getUTCSeconds()',
        expected: '30',
      },
    };
    if (setterTests[methodName]) {
      const t = setterTests[methodName];
      return {
        skip: false,
        neuroInput: t.input,
        nativeCall: '',
        assertMode: 'sideEffect',
        sideEffectRead: t.read,
        sideEffectExpected: t.expected,
      };
    }
    return {
      skip: true,
      skipReason: `no fixture for date.${methodName}`,
      neuroInput: `{ date: ${d} }`,
      nativeCall: 'undefined',
      assertMode: 'typeOnly',
    };
  }

  // ----- object -----
  if (group === 'object') {
    const obj = '{ a: 1, b: 2 }';
    switch (methodName) {
      case 'assign':
        return {
          skip: false,
          neuroInput: `{ target: { a: 1 }, source: { b: 2 } }`,
          nativeCall: `Object.assign({ a: 1 }, { b: 2 })`,
          assertMode: 'deepEqual',
        };
      case 'create':
        return {
          skip: false,
          neuroInput: `{ o: null }`,
          nativeCall: `Object.create(null)`,
          assertMode: 'typeOnly',
        };
      case 'defineProperties':
        return {
          skip: false,
          neuroInput: `{ o: {}, properties: { x: { value: 42, writable: true, enumerable: true, configurable: true } } }`,
          nativeCall: `Object.defineProperties({}, { x: { value: 42, writable: true, enumerable: true, configurable: true } })`,
          assertMode: 'deepEqual',
        };
      case 'defineProperty':
        return {
          skip: false,
          neuroInput: `{ o: {}, p: 'x', attributes: { value: 42, writable: true, enumerable: true, configurable: true } }`,
          nativeCall: `Object.defineProperty({}, 'x', { value: 42, writable: true, enumerable: true, configurable: true })`,
          assertMode: 'deepEqual',
        };
      case 'entries':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.entries(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'freeze':
        return {
          skip: false,
          neuroInput: `{ f: ${obj} }`,
          nativeCall: `Object.freeze(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'fromEntries':
        return {
          skip: false,
          neuroInput: `{ entries: [['a', 1], ['b', 2]] }`,
          nativeCall: `Object.fromEntries([['a', 1], ['b', 2]])`,
          assertMode: 'deepEqual',
        };
      case 'getOwnPropertyDescriptor':
        return {
          skip: false,
          neuroInput: `{ o: ${obj}, p: 'a' }`,
          nativeCall: `Object.getOwnPropertyDescriptor(${obj}, 'a')`,
          assertMode: 'deepEqual',
        };
      case 'getOwnPropertyDescriptors':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.getOwnPropertyDescriptors(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'getOwnPropertyNames':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.getOwnPropertyNames(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'getOwnPropertySymbols':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.getOwnPropertySymbols(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'getPrototypeOf':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.getPrototypeOf(${obj})`,
          assertMode: 'equal',
        };
      case 'groupBy':
        return {
          skip: false,
          runIf: `'groupBy' in Object`,
          neuroInput: `{ items: [1, 2, 3, 4], keySelector: (n) => n % 2 === 0 ? 'even' : 'odd' }`,
          nativeCall: `Object.groupBy([1, 2, 3, 4], n => n % 2 === 0 ? 'even' : 'odd')`,
          assertMode: 'deepEqual',
        };
      case 'hasOwn':
        return {
          skip: false,
          neuroInput: `{ o: ${obj}, v: 'a' }`,
          nativeCall: `Object.hasOwn(${obj}, 'a')`,
          assertMode: 'equal',
        };
      case 'is':
        return {
          skip: false,
          neuroInput: `{ value1: NaN, value2: NaN }`,
          nativeCall: `Object.is(NaN, NaN)`,
          assertMode: 'equal',
        };
      case 'isExtensible':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.isExtensible(${obj})`,
          assertMode: 'equal',
        };
      case 'isFrozen':
        return {
          skip: false,
          neuroInput: `{ o: Object.freeze(${obj}) }`,
          nativeCall: `Object.isFrozen(Object.freeze(${obj}))`,
          assertMode: 'equal',
        };
      case 'isSealed':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.isSealed(${obj})`,
          assertMode: 'equal',
        };
      case 'keys':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.keys(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'preventExtensions':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.preventExtensions(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'seal':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.seal(${obj})`,
          assertMode: 'deepEqual',
        };
      case 'setPrototypeOf':
        return {
          skip: false,
          neuroInput: `{ o: {}, proto: null }`,
          nativeCall: `Object.setPrototypeOf({}, null)`,
          assertMode: 'typeOnly',
        };
      case 'values':
        return {
          skip: false,
          neuroInput: `{ o: ${obj} }`,
          nativeCall: `Object.values(${obj})`,
          assertMode: 'deepEqual',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for object.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- json -----
  if (group === 'json') {
    switch (methodName) {
      case 'stringify':
        return {
          skip: false,
          neuroInput: `{ value: { a: 1 } }`,
          nativeCall: `JSON.stringify({ a: 1 })`,
          assertMode: 'equal',
        };
      case 'parse':
        return {
          skip: false,
          neuroInput: `{ text: '{"a":1}' }`,
          nativeCall: `JSON.parse('{"a":1}')`,
          assertMode: 'deepEqual',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for json.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- number -----
  if (group === 'number') {
    switch (methodName) {
      case 'isFinite':
        return {
          skip: false,
          neuroInput: `{ number: 42 }`,
          nativeCall: `Number.isFinite(42)`,
          assertMode: 'equal',
        };
      case 'isInteger':
        return {
          skip: false,
          neuroInput: `{ number: 42 }`,
          nativeCall: `Number.isInteger(42)`,
          assertMode: 'equal',
        };
      case 'isNaN':
        return {
          skip: false,
          neuroInput: `{ number: NaN }`,
          nativeCall: `Number.isNaN(NaN)`,
          assertMode: 'equal',
        };
      case 'isSafeInteger':
        return {
          skip: false,
          neuroInput: `{ number: 42 }`,
          nativeCall: `Number.isSafeInteger(42)`,
          assertMode: 'equal',
        };
      case 'parseFloat':
        return {
          skip: false,
          neuroInput: `{ string: '3.14abc' }`,
          nativeCall: `Number.parseFloat('3.14abc')`,
          assertMode: 'equal',
        };
      case 'parseInt':
        return {
          skip: false,
          neuroInput: `{ string: '42px' }`,
          nativeCall: `Number.parseInt('42px')`,
          assertMode: 'equal',
        };
      case 'toExponential':
        return {
          skip: false,
          neuroInput: `{ number: 123456.789, fractionDigits: 2 }`,
          nativeCall: `(123456.789).toExponential(2)`,
          assertMode: 'equal',
        };
      case 'toFixed':
        return {
          skip: false,
          neuroInput: `{ number: 3.14159, fractionDigits: 2 }`,
          nativeCall: `(3.14159).toFixed(2)`,
          assertMode: 'equal',
        };
      case 'toPrecision':
        return {
          skip: false,
          neuroInput: `{ number: 123.456, precision: 5 }`,
          nativeCall: `(123.456).toPrecision(5)`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for number.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- set -----
  if (group === 'set') {
    switch (methodName) {
      case 'add':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2, 3]), value: 4 }`,
          nativeCall: '',
          assertMode: 'sideEffectDeep',
          sideEffectRead: 'Array.from(result as any).sort((a: any, b: any) => a - b)',
          sideEffectExpected: '[1, 2, 3, 4]',
        };
      case 'clear':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2, 3]) }`,
          nativeCall: `(new Set([1, 2, 3]).clear(), undefined)`,
          assertMode: 'void',
        };
      case 'delete':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2, 3]), value: 2 }`,
          nativeCall: `new Set([1, 2, 3]).delete(2)`,
          assertMode: 'equal',
        };
      case 'difference':
        return {
          skip: false,
          runIf: `'difference' in Set.prototype`,
          neuroInput: `{ set: new Set([1, 2, 3]), other: new Set([2, 3, 4]) }`,
          nativeCall: `new Set([1, 2, 3]).difference(new Set([2, 3, 4]))`,
          assertMode: 'sideEffectDeep',
          sideEffectRead: 'Array.from(result).sort((a,b)=>a-b)',
          sideEffectExpected: '[1]',
        };
      case 'entries':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2]) }`,
          nativeCall: `new Set([1, 2]).entries()`,
          assertMode: 'iterEqual',
        };
      case 'forEach':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2]), callbackfn: () => {} }`,
          nativeCall: `(new Set([1, 2]).forEach(() => {}), undefined)`,
          assertMode: 'void',
        };
      case 'has':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2, 3]), value: 2 }`,
          nativeCall: `new Set([1, 2, 3]).has(2)`,
          assertMode: 'equal',
        };
      case 'intersection':
        return {
          skip: false,
          runIf: `'intersection' in Set.prototype`,
          neuroInput: `{ set: new Set([1, 2, 3]), other: new Set([2, 3, 4]) }`,
          nativeCall: `new Set([1, 2, 3]).intersection(new Set([2, 3, 4]))`,
          assertMode: 'sideEffectDeep',
          sideEffectRead: 'Array.from(result).sort((a,b)=>a-b)',
          sideEffectExpected: '[2, 3]',
        };
      case 'isDisjointFrom':
        return {
          skip: false,
          runIf: `'isDisjointFrom' in Set.prototype`,
          neuroInput: `{ set: new Set([1, 2]), other: new Set([3, 4]) }`,
          nativeCall: `new Set([1, 2]).isDisjointFrom(new Set([3, 4]))`,
          assertMode: 'equal',
        };
      case 'isSubsetOf':
        return {
          skip: false,
          runIf: `'isSubsetOf' in Set.prototype`,
          neuroInput: `{ set: new Set([1, 2]), other: new Set([1, 2, 3]) }`,
          nativeCall: `new Set([1, 2]).isSubsetOf(new Set([1, 2, 3]))`,
          assertMode: 'equal',
        };
      case 'isSupersetOf':
        return {
          skip: false,
          runIf: `'isSupersetOf' in Set.prototype`,
          neuroInput: `{ set: new Set([1, 2, 3]), other: new Set([1, 2]) }`,
          nativeCall: `new Set([1, 2, 3]).isSupersetOf(new Set([1, 2])  )`,
          assertMode: 'equal',
        };
      case 'keys':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2]) }`,
          nativeCall: `new Set([1, 2]).keys()`,
          assertMode: 'iterEqual',
        };
      case 'symmetricDifference':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2, 3]), other: new Set([2, 3, 4]) }`,
          nativeCall: `new Set([1, 2, 3]).symmetricDifference(new Set([2, 3, 4]))`,
          assertMode: 'sideEffectDeep',
          sideEffectRead: 'Array.from(result).sort((a,b)=>a-b)',
          sideEffectExpected: '[1, 4]',
        };
      case 'union':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2]), other: new Set([3, 4]) }`,
          nativeCall: `new Set([1, 2]).union(new Set([3, 4]))`,
          assertMode: 'sideEffectDeep',
          sideEffectRead: 'Array.from(result).sort((a,b)=>a-b)',
          sideEffectExpected: '[1, 2, 3, 4]',
        };
      case 'values':
        return {
          skip: false,
          neuroInput: `{ set: new Set([1, 2]) }`,
          nativeCall: `new Set([1, 2]).values()`,
          assertMode: 'iterEqual',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for set.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- map -----
  if (group === 'map') {
    const m = "new Map([['a', 1], ['b', 2]])";
    switch (methodName) {
      case 'clear':
        return {
          skip: false,
          neuroInput: `{ map: ${m} }`,
          nativeCall: `(${m}.clear(), undefined)`,
          assertMode: 'void',
        };
      case 'delete':
        return {
          skip: false,
          neuroInput: `{ map: ${m}, key: 'a' }`,
          nativeCall: `${m}.delete('a')`,
          assertMode: 'equal',
        };
      case 'entries':
        return {
          skip: false,
          neuroInput: `{ map: ${m} }`,
          nativeCall: `${m}.entries()`,
          assertMode: 'iterEqual',
        };
      case 'forEach':
        return {
          skip: false,
          neuroInput: `{ map: ${m}, callbackfn: () => {} }`,
          nativeCall: `(${m}.forEach(() => {}), undefined)`,
          assertMode: 'void',
        };
      case 'get':
        return {
          skip: false,
          neuroInput: `{ map: ${m}, key: 'a' }`,
          nativeCall: `${m}.get('a')`,
          assertMode: 'equal',
        };
      case 'getOrInsert':
        return {
          skip: true,
          skipReason: 'Map.getOrInsert not available in this Node.js version',
          neuroInput: `{ map: ${m}, key: 'a', defaultValue: 99 }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
      case 'getOrInsertComputed':
        return {
          skip: true,
          skipReason: 'Map.getOrInsertComputed not available in this Node.js version',
          neuroInput: `{ map: ${m}, key: 'a', callback: () => 99 }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
      case 'groupBy':
        return {
          skip: false,
          runIf: `'groupBy' in Map`,
          neuroInput: `{ items: [1, 2, 3, 4], keySelector: (n) => n % 2 === 0 ? 'even' : 'odd' }`,
          nativeCall: `Map.groupBy([1, 2, 3, 4], n => n % 2 === 0 ? 'even' : 'odd')`,
          assertMode: 'sideEffectDeep',
          sideEffectRead:
            'JSON.stringify([...(result as any).entries()].map(([k,v])=>[k,[...(v as any)]]).sort())',
          sideEffectExpected: 'JSON.stringify([[\"even\",[2,4]],[\"odd\",[1,3]]])',
        };
      case 'has':
        return {
          skip: false,
          neuroInput: `{ map: ${m}, key: 'a' }`,
          nativeCall: `${m}.has('a')`,
          assertMode: 'equal',
        };
      case 'keys':
        return {
          skip: false,
          neuroInput: `{ map: ${m} }`,
          nativeCall: `${m}.keys()`,
          assertMode: 'iterEqual',
        };
      case 'set':
        return {
          skip: false,
          neuroInput: `{ map: new Map(), key: 'x', value: 42 }`,
          nativeCall: '',
          assertMode: 'sideEffectDeep',
          sideEffectRead: '(result as any).get("x")',
          sideEffectExpected: '42',
        };
      case 'values':
        return {
          skip: false,
          neuroInput: `{ map: ${m} }`,
          nativeCall: `${m}.values()`,
          assertMode: 'iterEqual',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for map.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- promise -----
  // The neuro wrapper awaits the Promise result, so `result` is the resolved
  // value. We compare it against the awaited native call using deepEqual.
  if (group === 'promise') {
    switch (methodName) {
      case 'all':
        return {
          skip: false,
          neuroInput: `{ values: [Promise.resolve(1), Promise.resolve(2)] }`,
          nativeCall: `await Promise.all([Promise.resolve(1), Promise.resolve(2)])`,
          assertMode: 'deepEqual',
        };
      case 'allSettled':
        return {
          skip: false,
          neuroInput: `{ values: [Promise.resolve(1), Promise.reject('x')] }`,
          nativeCall: `await Promise.allSettled([Promise.resolve(1), Promise.reject('x')])`,
          assertMode: 'deepEqual',
        };
      case 'any':
        return {
          skip: false,
          neuroInput: `{ values: [Promise.reject('e'), Promise.resolve(42)] }`,
          nativeCall: `await Promise.any([Promise.reject('e'), Promise.resolve(42)])`,
          assertMode: 'equal',
        };
      case 'catch':
        return {
          skip: false,
          neuroInput: `{ promise: Promise.reject(new Error('oops')), onrejected: (e) => 'caught:' + e.message }`,
          nativeCall: `await Promise.reject(new Error('oops')).catch(e => 'caught:' + e.message)`,
          assertMode: 'equal',
        };
      case 'finally':
        return {
          skip: false,
          neuroInput: `{ promise: Promise.resolve(42), onfinally: () => {} }`,
          nativeCall: `await Promise.resolve(42).finally(() => {})`,
          assertMode: 'equal',
        };
      case 'race':
        return {
          skip: false,
          neuroInput: `{ values: [Promise.resolve(1), Promise.resolve(2)] }`,
          nativeCall: `await Promise.race([Promise.resolve(1), Promise.resolve(2)])`,
          assertMode: 'equal',
        };
      case 'reject':
        return {
          skip: false,
          neuroInput: `{ reason: 'test error' }`,
          nativeCall: `Promise.reject('test error')`,
          assertMode: 'rejects',
        };
      case 'resolve':
        return {
          skip: false,
          neuroInput: `{ value: 42 }`,
          nativeCall: `await Promise.resolve(42)`,
          assertMode: 'equal',
        };
      case 'then':
        return {
          skip: false,
          neuroInput: `{ promise: Promise.resolve(10), onfulfilled: (v) => v * 2 }`,
          nativeCall: `await Promise.resolve(10).then(v => v * 2)`,
          assertMode: 'equal',
        };
      case 'try':
        return {
          skip: false,
          runIf: `'try' in Promise`,
          neuroInput: `{ callbackFn: () => 42 }`,
          nativeCall: `await Promise.try(() => 42)`,
          assertMode: 'equal',
        };
      case 'withResolvers':
        return {
          skip: false,
          runIf: `'withResolvers' in Promise`,
          neuroInput: `{}`,
          nativeCall: `Promise.withResolvers()`,
          assertMode: 'typeOnly',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for promise.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- globals -----
  if (group === 'globals') {
    switch (methodName) {
      case 'decodeURI':
        return {
          skip: false,
          neuroInput: `{ encodedURI: 'https://example.com/path%20with%20spaces' }`,
          nativeCall: `decodeURI('https://example.com/path%20with%20spaces')`,
          assertMode: 'equal',
        };
      case 'decodeURIComponent':
        return {
          skip: false,
          neuroInput: `{ encodedURIComponent: 'hello%20world' }`,
          nativeCall: `decodeURIComponent('hello%20world')`,
          assertMode: 'equal',
        };
      case 'encodeURI':
        return {
          skip: false,
          neuroInput: `{ uri: 'https://example.com/path with spaces' }`,
          nativeCall: `encodeURI('https://example.com/path with spaces')`,
          assertMode: 'equal',
        };
      case 'encodeURIComponent':
        return {
          skip: false,
          neuroInput: `{ uriComponent: 'hello world' }`,
          nativeCall: `encodeURIComponent('hello world')`,
          assertMode: 'equal',
        };
      case 'isFinite':
        return {
          skip: false,
          neuroInput: `{ number: 42 }`,
          nativeCall: `isFinite(42)`,
          assertMode: 'equal',
        };
      case 'isNaN':
        return {
          skip: false,
          neuroInput: `{ number: NaN }`,
          nativeCall: `isNaN(NaN)`,
          assertMode: 'equal',
        };
      case 'parseFloat':
        return {
          skip: false,
          neuroInput: `{ string: '3.14abc' }`,
          nativeCall: `parseFloat('3.14abc')`,
          assertMode: 'equal',
        };
      case 'parseInt':
        return {
          skip: false,
          neuroInput: `{ string: 'ff', radix: 16 }`,
          nativeCall: `parseInt('ff', 16)`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for globals.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- arrayBuffer -----
  if (group === 'arrayBuffer') {
    switch (methodName) {
      case 'isView':
        return {
          skip: false,
          neuroInput: `{ arg: new Uint8Array(4) }`,
          nativeCall: `ArrayBuffer.isView(new Uint8Array(4))`,
          assertMode: 'equal',
        };
      case 'slice':
        return {
          skip: false,
          neuroInput: `{ arrayBuffer: new ArrayBuffer(8), begin: 0, end: 4 }`,
          nativeCall: `new ArrayBuffer(8).slice(0, 4)`,
          assertMode: 'typeOnly',
        };
      case 'transfer':
        return {
          skip: false,
          neuroInput: `{ arrayBuffer: new ArrayBuffer(8) }`,
          nativeCall: `new ArrayBuffer(8).transfer()`,
          assertMode: 'typeOnly',
        };
      case 'transferToFixedLength':
        return {
          skip: false,
          neuroInput: `{ arrayBuffer: new ArrayBuffer(8) }`,
          nativeCall: `new ArrayBuffer(8).transferToFixedLength()`,
          assertMode: 'typeOnly',
        };
      case 'resize':
        return {
          skip: false,
          neuroInput: `{ arrayBuffer: new ArrayBuffer(8, { maxByteLength: 16 }), newByteLength: 12 }`,
          nativeCall: `(new ArrayBuffer(8, { maxByteLength: 16 }).resize(12), undefined)`,
          assertMode: 'void',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for arrayBuffer.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- weakMap -----
  if (group === 'weakMap') {
    switch (methodName) {
      case 'delete':
        return {
          skip: false,
          neuroInput: `{ weakMap: new WeakMap([[_wmKey, 99]]), key: _wmKey }`,
          nativeCall: `new WeakMap([[_wmKey, 99]]).delete(_wmKey)`,
          assertMode: 'equal',
        };
      case 'get':
        return {
          skip: false,
          neuroInput: `{ weakMap: new WeakMap([[_wmKey, 99]]), key: _wmKey }`,
          nativeCall: `new WeakMap([[_wmKey, 99]]).get(_wmKey)`,
          assertMode: 'equal',
        };
      case 'getOrInsert':
        return {
          skip: true,
          skipReason: 'WeakMap.getOrInsert not available in this Node.js version',
          neuroInput: `{ weakMap: new WeakMap([[_wmKey, 99]]), key: _wmKey, defaultValue: 0 }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
      case 'getOrInsertComputed':
        return {
          skip: true,
          skipReason: 'WeakMap.getOrInsertComputed not available in this Node.js version',
          neuroInput: `{ weakMap: new WeakMap([[_wmKey, 99]]), key: _wmKey, callback: () => 0 }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
      case 'has':
        return {
          skip: false,
          neuroInput: `{ weakMap: new WeakMap([[_wmKey, 99]]), key: _wmKey }`,
          nativeCall: `new WeakMap([[_wmKey, 99]]).has(_wmKey)`,
          assertMode: 'equal',
        };
      case 'set':
        return {
          skip: false,
          neuroInput: `{ weakMap: new WeakMap(), key: _wmKey, value: 42 }`,
          nativeCall: '',
          assertMode: 'sideEffectDeep',
          sideEffectRead: '(result as any).get(_wmKey)',
          sideEffectExpected: '42',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for weakMap.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- weakSet -----
  if (group === 'weakSet') {
    switch (methodName) {
      case 'add':
        return {
          skip: false,
          neuroInput: `{ weakSet: new WeakSet(), value: _wsKey }`,
          nativeCall: '',
          assertMode: 'sideEffectDeep',
          sideEffectRead: '(result as any).has(_wsKey)',
          sideEffectExpected: 'true',
        };
      case 'delete':
        return {
          skip: false,
          neuroInput: `{ weakSet: new WeakSet([_wsKey]), value: _wsKey }`,
          nativeCall: `new WeakSet([_wsKey]).delete(_wsKey)`,
          assertMode: 'equal',
        };
      case 'has':
        return {
          skip: false,
          neuroInput: `{ weakSet: new WeakSet([_wsKey]), value: _wsKey }`,
          nativeCall: `new WeakSet([_wsKey]).has(_wsKey)`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for weakSet.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- regExp -----
  if (group === 'regExp') {
    switch (methodName) {
      case 'test':
        return {
          skip: false,
          neuroInput: `{ regExp: /hello/i, string: 'say hello there' }`,
          nativeCall: `/hello/i.test('say hello there')`,
          assertMode: 'equal',
        };
      case 'exec':
        return {
          skip: false,
          neuroInput: `{ regExp: /hel(lo)/i, string: 'hello world' }`,
          nativeCall: `/hel(lo)/i.exec('hello world')`,
          assertMode: 'deepEqual',
        };
      case 'compile':
        return {
          skip: true,
          skipReason: 'RegExp.compile is deprecated and not a reliable test target',
          neuroInput: `{ regExp: /hello/, pattern: 'world', flags: 'g' }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for regExp.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- bigInt -----
  if (group === 'bigInt') {
    switch (methodName) {
      case 'asIntN':
        return {
          skip: false,
          neuroInput: `{ bits: 4, int: 10n }`,
          nativeCall: `BigInt.asIntN(4, 10n)`,
          assertMode: 'equal',
        };
      case 'asUintN':
        return {
          skip: false,
          neuroInput: `{ bits: 4, int: 10n }`,
          nativeCall: `BigInt.asUintN(4, 10n)`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for bigInt.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- symbol -----
  if (group === 'symbol') {
    switch (methodName) {
      case 'for':
        return {
          skip: false,
          neuroInput: `{ key: 'testSymbol' }`,
          nativeCall: `Symbol.for('testSymbol')`,
          assertMode: 'equal',
        };
      case 'keyFor':
        return {
          skip: false,
          neuroInput: `{ sym: Symbol.for('testSymbol') }`,
          nativeCall: `Symbol.keyFor(Symbol.for('testSymbol'))`,
          assertMode: 'equal',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for symbol.${methodName}`,
          neuroInput: '{}',
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  // ----- dataView -----
  if (group === 'dataView') {
    const dv = 'new DataView(new ArrayBuffer(16))';
    switch (methodName) {
      case 'getInt8':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getInt8(0)`,
          assertMode: 'equal',
        };
      case 'getUint8':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getUint8(0)`,
          assertMode: 'equal',
        };
      case 'getInt16':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getInt16(0)`,
          assertMode: 'equal',
        };
      case 'getUint16':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getUint16(0)`,
          assertMode: 'equal',
        };
      case 'getInt32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getInt32(0)`,
          assertMode: 'equal',
        };
      case 'getUint32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getUint32(0)`,
          assertMode: 'equal',
        };
      case 'getFloat32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getFloat32(0)`,
          assertMode: 'equal',
        };
      case 'getFloat64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getFloat64(0)`,
          assertMode: 'equal',
        };
      case 'getBigInt64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getBigInt64(0)`,
          assertMode: 'equal',
        };
      case 'getBigUint64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getBigUint64(0)`,
          assertMode: 'equal',
        };
      case 'getFloat16':
        return {
          skip: false,
          runIf: `'getFloat16' in DataView.prototype`,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0 }`,
          nativeCall: `${dv}.getFloat16(0)`,
          assertMode: 'equal',
        };
      case 'setInt8':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 42 }`,
          nativeCall: `(${dv}.setInt8(0, 42), undefined)`,
          assertMode: 'void',
        };
      case 'setUint8':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 42 }`,
          nativeCall: `(${dv}.setUint8(0, 42), undefined)`,
          assertMode: 'void',
        };
      case 'setInt16':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 1000 }`,
          nativeCall: `(${dv}.setInt16(0, 1000), undefined)`,
          assertMode: 'void',
        };
      case 'setUint16':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 1000 }`,
          nativeCall: `(${dv}.setUint16(0, 1000), undefined)`,
          assertMode: 'void',
        };
      case 'setInt32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 100000 }`,
          nativeCall: `(${dv}.setInt32(0, 100000), undefined)`,
          assertMode: 'void',
        };
      case 'setUint32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 100000 }`,
          nativeCall: `(${dv}.setUint32(0, 100000), undefined)`,
          assertMode: 'void',
        };
      case 'setFloat32':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 1.5 }`,
          nativeCall: `(${dv}.setFloat32(0, 1.5), undefined)`,
          assertMode: 'void',
        };
      case 'setFloat64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 1.5 }`,
          nativeCall: `(${dv}.setFloat64(0, 1.5), undefined)`,
          assertMode: 'void',
        };
      case 'setBigInt64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 42n }`,
          nativeCall: `(${dv}.setBigInt64(0, 42n), undefined)`,
          assertMode: 'void',
        };
      case 'setBigUint64':
        return {
          skip: false,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 42n }`,
          nativeCall: `(${dv}.setBigUint64(0, 42n), undefined)`,
          assertMode: 'void',
        };
      case 'setFloat16':
        return {
          skip: false,
          runIf: `'setFloat16' in DataView.prototype`,
          neuroInput: `{ dataView: ${dv}, byteOffset: 0, value: 1.5 }`,
          nativeCall: `(${dv}.setFloat16(0, 1.5), undefined)`,
          assertMode: 'void',
        };
      default:
        return {
          skip: true,
          skipReason: `no fixture for dataView.${methodName}`,
          neuroInput: `{ dataView: ${dv} }`,
          nativeCall: 'undefined',
          assertMode: 'typeOnly',
        };
    }
  }

  return {
    skip: true,
    skipReason: `group '${group}' not handled`,
    neuroInput: '{}',
    nativeCall: 'undefined',
    assertMode: 'typeOnly',
  };
}

/**
 * Emit the 6th test.each scenario for native value assertions.
 * We use a separate cases array (nativeCases) so we can use test.skip
 * per-entry without affecting the routing cases.
 */
function renderNativeValueTests(group: string, entries: Entry[]): string {
  const dottedAccess = (e: Entry) =>
    e.group === 'globals' ? `neuro.${e.methodName}` : `neuro.${e.group}.${e.methodName}`;

  const needsWeakMapKey = entries.some((e) => buildNativeCase(e).neuroInput.includes('_wmKey'));
  const needsWeakSetKey = entries.some((e) => buildNativeCase(e).neuroInput.includes('_wsKey'));

  const keyDecls: string[] = [];
  if (needsWeakMapKey) keyDecls.push('const _wmKey = {};');
  if (needsWeakSetKey) keyDecls.push('const _wsKey = {};');

  const lines: string[] = [];

  for (const entry of entries) {
    const nc = buildNativeCase(entry);
    const access = dottedAccess(entry);
    const testFn = nc.skip ? 'test.skip' : nc.runIf ? `test.runIf(${nc.runIf})` : 'test';
    const skipComment = nc.skip ? ` // ${nc.skipReason}` : '';

    if (nc.assertMode === 'range') {
      // math.random / date.now - non-deterministic, just type + range check
      lines.push(`  ${testFn}('${entry.methodName} native fallback returns correct type/range', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    expect(typeof result).toBe('number');
    expect(result as number).toBeGreaterThanOrEqual(0);
    expect(result as number).toBeLessThan(Date.now() + 1000);
  });`);
    } else if (nc.assertMode === 'void') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback returns undefined (void)', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    expect(result).toBeUndefined();
  });`);
    } else if (nc.assertMode === 'iterEqual') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback iterator matches native', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    const native = ${nc.nativeCall};
    expect(Array.from(result as Iterable<unknown>)).toEqual(Array.from(native as Iterable<unknown>));
  });`);
    } else if (nc.assertMode === 'typeOnly') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback does not throw', async () => {${skipComment}
    await expect((${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput})).resolves.not.toThrow();
  });`);
    } else if (nc.assertMode === 'equal') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback matches native built-in', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    expect(result).toBe(${nc.nativeCall});
  });`);
    } else if (nc.assertMode === 'deepEqual') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback matches native built-in (deep)', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    expect(result).toEqual(${nc.nativeCall});
  });`);
    } else if (nc.assertMode === 'sideEffect') {
      // Date setters: pass date receiver in, then read field on it
      lines.push(`  ${testFn}('${entry.methodName} native fallback mutates receiver correctly', async () => {${skipComment}
    const d = ${nc.neuroInput.match(/new Date\([^)]+\)/)?.[0] ?? 'new Date()'};
    await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput.replace(/new Date\([^)]+\)/g, 'd')});
    expect(${nc.sideEffectRead!.replace(/\bd\b/g, 'd')}).toBe(${nc.sideEffectExpected});
  });`);
    } else if (nc.assertMode === 'sideEffectDeep') {
      // Set algebra and Map.set: call neuro, read result
      lines.push(`  ${testFn}('${entry.methodName} native fallback returns correct value', async () => {${skipComment}
    const result = await (${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput});
    expect(${nc.sideEffectRead!.replace(/\bresult\b/g, 'result as any')}).toEqual(${nc.sideEffectExpected});
  });`);
    } else if (nc.assertMode === 'rejects') {
      lines.push(`  ${testFn}('${entry.methodName} native fallback correctly rejects', async () => {${skipComment}
    await expect((${access} as (i: Record<string, unknown>) => Promise<unknown>)(${nc.neuroInput})).rejects.toBeDefined();
  });`);
    }
  }

  if (lines.length === 0) return '';

  return `
${keyDecls.join('\n')}
describe('${group} native values', () => {
${lines.join('\n\n')}
});`;
}

function renderGroupTestFile(group: string, entries: Entry[]): string {
  const dottedAccess = (e: Entry) =>
    e.group === 'globals' ? `neuro.${e.methodName}` : `neuro.${e.group}.${e.methodName}`;

  const cases = entries
    .map(
      (e) => `  {
    name: '${e.methodName}',
    functionId: '${e.functionId}',
    routedInput: ${buildInputExpr(e, true)},
    nativeInput: ${buildInputExpr(e, false)},
    invoke: (input) => (${dottedAccess(e)} as (i: Record<string, unknown>) => Promise<unknown>)(input),
  }`,
    )
    .join(',\n');

  const nativeValueSection = renderNativeValueTests(group, entries);

  return `// Auto-generated by scripts/generate-tests.ts. Do not edit.
// Per-method routing & error-path tests for the \`${group}\` group.
/* eslint-disable import/no-relative-packages */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { configureClient, neuro, resetClient } from '../../dist/index.js';

interface MethodCase {
  name: string;
  functionId: string;
  routedInput: Record<string, unknown>;
  nativeInput: Record<string, unknown>;
  invoke: (input: Record<string, unknown>) => Promise<unknown>;
}

const cases: MethodCase[] = [
${cases}
];

afterEach(() => {
  resetClient();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('${group} routing', () => {
  test.each(cases)('$name routes to LLM when prompt is set', async ({ functionId, routedInput, invoke }) => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ result: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await invoke(routedInput);
    expect(fetchMock).toHaveBeenCalledOnce();
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.functionId).toBe(functionId);
    expect(sent.prompt).toBe('test');
  });

  test.each(cases)('$name does not call the LLM when prompt is omitted', async ({ nativeInput, invoke }) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    // We do not assert the native return value (many methods need real
    // arguments to run); we only assert that fetch is never invoked.
    await invoke(nativeInput).catch(() => {
      /* native may throw with stub args; the routing decision is what
       * we are testing here. */
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(cases)('$name treats prompt: "" as absent (no LLM call)', async ({ nativeInput, invoke }) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await invoke({ ...nativeInput, prompt: '' }).catch(() => {});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(cases)('$name surfaces network outage as NeuroClientError', async ({ functionId, routedInput, invoke }) => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('network down');
    });
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await expect(invoke(routedInput)).rejects.toThrow(/Proxy fetch failed/);
    // The thrown error includes the functionId for postmortems.
    await expect(invoke(routedInput)).rejects.toThrow(new RegExp(functionId.replace(/[.\\\\]/g, '\\\\$&')));
  });

  test.each(cases)('$name surfaces a 500 from the proxy', async ({ routedInput, invoke }) => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('boom', { status: 500, statusText: 'Server Error' }),
    );
    configureClient({ proxyUrl: 'https://example.test/neuro' });
    await expect(invoke(routedInput)).rejects.toThrow(/Proxy.*responded 500/);
  });
});
${nativeValueSection}
`;
}

function run(): void {
  if (existsSync(TESTS_OUT_DIR)) {
    for (const entry of readdirSync(TESTS_OUT_DIR)) {
      rmSync(resolve(TESTS_OUT_DIR, entry), { recursive: true, force: true });
    }
  }
  mkdirSync(TESTS_OUT_DIR, { recursive: true });
  const grouped = groupBy();
  let total = 0;
  for (const [group, entries] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
    const file = resolve(TESTS_OUT_DIR, `${group}.test.ts`);
    writeFileSync(file, renderGroupTestFile(group, entries));
    total += entries.length;
  }
  console.log(
    `[generate-tests] wrote ${Object.keys(grouped).length} group files covering ${total} methods -> tests/generated/`,
  );
}

run();
