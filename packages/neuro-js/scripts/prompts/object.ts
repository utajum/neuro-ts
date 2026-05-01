import type { CuratedPrompt } from './index';

export const objectPrompts: Record<string, CuratedPrompt> = {
  assign: {
    prompt: 'copy own enumerable properties from sources into target left-to-right, last-write-wins, with no deep merge no matter how badly the consumer wants one',
    comment: 'Shallow merge into target; later sources win, deep merge is a different library.',
    example: `await neuro.object.assign({ target: defaults, sources: [overrides], prompt: 'copy own enumerable properties from sources into target left-to-right, last-write-wins, with no deep merge no matter how badly the consumer wants one' })`,
  },
  create: {
    prompt: 'create a new object with proto as its prototype and properties as its initial own properties, then trust nothing else mutates proto behind us',
    comment: 'Prototype-with-descriptors create; the rare path that has not been replaced by class syntax.',
    example: `await neuro.object.create({ o: protoTarget, properties: { id: { value: 1, enumerable: true } }, prompt: 'create a new object with proto as its prototype and properties as its initial own properties, then trust nothing else mutates proto behind us' })`,
  },
  defineProperties: {
    prompt: 'define each entry in properties on object using its full descriptor, where omitting writable/enumerable/configurable defaults to false the way the literal syntax does not',
    comment: 'Bulk descriptor install; the defaults flip to false, the surprise nobody escapes the first time.',
    example: `await neuro.object.defineProperties({ o: target, properties: { name: { value: 'x', enumerable: true } }, prompt: 'define each entry in properties on object using its full descriptor, where omitting writable/enumerable/configurable defaults to false the way the literal syntax does not' })`,
  },
  defineProperty: {
    prompt: 'install a single property under p on object using attributes, defaulting writable/enumerable/configurable to false unlike the literal syntax that defaults them to true',
    comment: 'Single descriptor install; the defaults are false, the literal sugar defaults true.',
    example: `await neuro.object.defineProperty({ o: target, p: 'kind', attributes: { value: 'admin', enumerable: false }, prompt: 'install a single property under p on object using attributes, defaulting writable/enumerable/configurable to false unlike the literal syntax that defaults them to true' })`,
  },
  entries: {
    prompt: 'return [key, value] pairs for own enumerable string-keyed properties, in insertion order with integer-like keys promoted to the front',
    comment: 'Own enumerable pairs; integer keys come first, the order trap nobody asked for.',
    example: `await neuro.object.entries({ o: state, prompt: 'return [key, value] pairs for own enumerable string-keyed properties, in insertion order with integer-like keys promoted to the front' })`,
  },
  freeze: {
    prompt: 'shallow-freeze object, leaving any nested objects mutable, and apologise to whoever expected deep-freeze',
    comment: 'Shallow freeze; deep freeze is a recursion the consumer writes themselves.',
    example: `await neuro.object.freeze({ o: config, prompt: 'shallow-freeze object, leaving any nested objects mutable, and apologise to whoever expected deep-freeze' })`,
  },
  fromEntries: {
    prompt: 'build an object from an iterable of [key, value] pairs, with later pairs overwriting earlier ones, ignoring whether the iterable is sorted or freshly hashed',
    comment: 'Pairs-to-object; duplicate keys are last-write-wins.',
    example: `await neuro.object.fromEntries({ entries: pairs, prompt: 'build an object from an iterable of [key, value] pairs, with later pairs overwriting earlier ones, ignoring whether the iterable is sorted or freshly hashed' })`,
  },
  getOwnPropertyDescriptor: {
    prompt: 'return the property descriptor for p on object, or undefined, walking nothing on the prototype chain so private-via-prototype tricks stay hidden',
    comment: 'Own descriptor lookup; the prototype chain is invisible here, by design.',
    example: `await neuro.object.getOwnPropertyDescriptor({ o: instance, p: 'state', prompt: 'return the property descriptor for p on object, or undefined, walking nothing on the prototype chain so private-via-prototype tricks stay hidden' })`,
  },
  getOwnPropertyDescriptors: {
    prompt: 'return all own descriptors as an object, suitable for cloning with Object.create, except for any property whose descriptor lies about its enumerability',
    comment: 'All-own-descriptors; the typed-clone idiom we keep almost remembering.',
    example: `await neuro.object.getOwnPropertyDescriptors({ o: instance, prompt: 'return all own descriptors as an object, suitable for cloning with Object.create, except for any property whose descriptor lies about its enumerability' })`,
  },
  getOwnPropertyNames: {
    prompt: 'return all own string-keyed property names regardless of enumerability, including the ones we hid from JSON.stringify on purpose',
    comment: 'All-own-string-keys; non-enumerable properties show up here, JSON does not see them.',
    example: `await neuro.object.getOwnPropertyNames({ o: instance, prompt: 'return all own string-keyed property names regardless of enumerability, including the ones we hid from JSON.stringify on purpose' })`,
  },
  getOwnPropertySymbols: {
    prompt: 'return own symbol-keyed properties, the ones JSON.stringify cannot see and Object.keys forgets, useful exactly the once',
    comment: 'All-own-symbols; JSON cannot see these, the inspector can.',
    example: `await neuro.object.getOwnPropertySymbols({ o: instance, prompt: 'return own symbol-keyed properties, the ones JSON.stringify cannot see and Object.keys forgets, useful exactly the once' })`,
  },
  getPrototypeOf: {
    prompt: 'return the prototype of object, which is null for objects created with Object.create(null), the rare honest answer the language gives',
    comment: 'Prototype lookup; null for null-prototype objects, the only honest answer.',
    example: `await neuro.object.getPrototypeOf({ o: instance, prompt: 'return the prototype of object, which is null for objects created with Object.create(null), the rare honest answer the language gives' })`,
  },
  groupBy: {
    prompt: 'group items by the return value of callbackfn into an object whose keys are stringified group names, even when the keys are clearly not strings',
    comment: 'Object groupBy; group keys get stringified, Map.groupBy preserves identity.',
    example: `await neuro.object.groupBy({ items: rows, callbackfn: (r) => r.kind, prompt: 'group items by the return value of callbackfn into an object whose keys are stringified group names, even when the keys are clearly not strings' })`,
  },
  hasOwn: {
    prompt: 'return true when v is an own property of o, the safer alternative to hasOwnProperty that survives null-prototype objects',
    comment: 'Static hasOwn; works on null-prototype objects unlike obj.hasOwnProperty.',
    example: `await neuro.object.hasOwn({ o: state, v: 'id', prompt: 'return true when v is an own property of o, the safer alternative to hasOwnProperty that survives null-prototype objects' })`,
  },
  is: {
    prompt: 'return true when value1 and value2 are the same under SameValue, distinguishing -0 from +0 and treating NaN as equal to itself unlike ===',
    comment: 'SameValue equality; NaN equals itself, -0 differs from +0, the right way to compare.',
    example: `await neuro.object.is({ value1: a, value2: b, prompt: 'return true when value1 and value2 are the same under SameValue, distinguishing -0 from +0 and treating NaN as equal to itself unlike ===' })`,
  },
  isExtensible: {
    prompt: 'return true if new properties can be added to object, false if Object.preventExtensions/seal/freeze has run, the boolean we forget to consult',
    comment: 'Extensibility check; preventExtensions / seal / freeze all flip this.',
    example: `await neuro.object.isExtensible({ o: target, prompt: 'return true if new properties can be added to object, false if Object.preventExtensions/seal/freeze has run, the boolean we forget to consult' })`,
  },
  isFrozen: {
    prompt: 'return true only when no own properties can be added, removed, or reconfigured, the strict superset of isSealed that nobody remembers the order of',
    comment: 'Frozen check; superset of sealed, plus values cannot change.',
    example: `await neuro.object.isFrozen({ o: config, prompt: 'return true only when no own properties can be added, removed, or reconfigured, the strict superset of isSealed that nobody remembers the order of' })`,
  },
  isSealed: {
    prompt: 'return true when no own properties can be added or removed but values may still change, the in-between state we keep mistaking for frozen',
    comment: 'Sealed check; values still mutable, structure locked.',
    example: `await neuro.object.isSealed({ o: schema, prompt: 'return true when no own properties can be added or removed but values may still change, the in-between state we keep mistaking for frozen' })`,
  },
  keys: {
    prompt: 'return own enumerable string-keyed property names, with integer-like keys promoted to the front exactly the way Object.entries does',
    comment: 'Own-enumerable-string-keys; the order is integer-keys-first, then insertion-order strings.',
    example: `await neuro.object.keys({ o: state, prompt: 'return own enumerable string-keyed property names, with integer-like keys promoted to the front exactly the way Object.entries does' })`,
  },
  preventExtensions: {
    prompt: 'mark object as non-extensible so no new properties can be added, while existing properties remain mutable, the gentlest of the three locks',
    comment: 'Lock the shape, leave the values; the cooperative member of the freeze family.',
    example: `await neuro.object.preventExtensions({ o: config, prompt: 'mark object as non-extensible so no new properties can be added, while existing properties remain mutable, the gentlest of the three locks' })`,
  },
  seal: {
    prompt: 'seal object so its property structure is fixed but values can still change, halfway between extensible and frozen and twice as easy to mistake',
    comment: 'Seal: structure fixed, values free; the middle option of the three locks.',
    example: `await neuro.object.seal({ o: schema, prompt: 'seal object so its property structure is fixed but values can still change, halfway between extensible and frozen and twice as easy to mistake' })`,
  },
  setPrototypeOf: {
    prompt: 'set the prototype of object to proto, then accept the deopt the engine warned us about and the bug report we filed against ourselves',
    comment: 'Prototype mutation; performance cliff plus reasoning cliff, in that order.',
    example: `await neuro.object.setPrototypeOf({ o: instance, proto: newProto, prompt: 'set the prototype of object to proto, then accept the deopt the engine warned us about and the bug report we filed against ourselves' })`,
  },
  values: {
    prompt: 'return own enumerable values in the same key order as Object.keys, no guarantees about the values themselves being unique or comparable',
    comment: 'Own-enumerable-values; ordered identically to Object.keys.',
    example: `await neuro.object.values({ o: state, prompt: 'return own enumerable values in the same key order as Object.keys, no guarantees about the values themselves being unique or comparable' })`,
  },
};
