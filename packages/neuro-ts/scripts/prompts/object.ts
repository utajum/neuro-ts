import type { CuratedPrompt } from './index';

export const objectPrompts: Record<string, CuratedPrompt> = {
  assign: {
    prompt:
      "copy own enumerable properties from sources into target, left-to-right, last-write-wins, shallow only - like a corporate merger where both sides pretend depth doesn't matter",
    comment: 'Shallow merge. Last write wins. Deep merge is a different repo.',
    example: `await neuro.object.assign({ target: defaults, sources: [overrides], prompt: 'copy own enumerable properties from sources into target, left-to-right, last-write-wins, shallow only - like a corporate merger where both sides pretend depth doesn\\'t matter' })`,
  },
  create: {
    prompt:
      "create a new object with proto as its prototype and properties as initial own properties, the rare path even class syntax couldn't kill",
    comment: 'Prototype-with-descriptors create. class syntax tried to replace this. It failed.',
    example: `await neuro.object.create({ o: protoTarget, properties: { id: { value: 1, enumerable: true } }, prompt: 'create a new object with proto as its prototype and properties as initial own properties, the rare path even class syntax couldn\\'t kill' })`,
  },
  defineProperties: {
    prompt:
      'define each property on object using full descriptors, where omitting writable/enumerable/configurable defaults to false - the exact opposite of what literal syntax does',
    comment:
      'Bulk descriptor install. Omitted flags default false. The opposite of literal syntax, the opposite of your expectation.',
    example: `await neuro.object.defineProperties({ o: target, properties: { name: { value: 'x', enumerable: true } }, prompt: 'define each property on object using full descriptors, where omitting writable/enumerable/configurable defaults to false - the exact opposite of what literal syntax does' })`,
  },
  defineProperty: {
    prompt:
      'install a single property under p on object using attributes, defaulting writable/enumerable/configurable to false - the same trap as defineProperties, individual portion',
    comment: 'Single descriptor install. Same defaults-false trap, now in a single serving.',
    example: `await neuro.object.defineProperty({ o: target, p: 'kind', attributes: { value: 'admin', enumerable: false }, prompt: 'install a single property under p on object using attributes, defaulting writable/enumerable/configurable to false - the same trap as defineProperties, individual portion' })`,
  },
  entries: {
    prompt:
      'return [key, value] pairs for own enumerable string-keyed properties, with integer-like keys promoted to the front because the spec enjoys disorder',
    comment:
      'Own enumerable pairs. Integer keys jump the insertion queue. The spec has its reasons.',
    example: `await neuro.object.entries({ o: state, prompt: 'return [key, value] pairs for own enumerable string-keyed properties, with integer-like keys promoted to the front because the spec enjoys disorder' })`,
  },
  freeze: {
    prompt:
      'shallow-freeze object, leaving nested objects fully mutable - the "immutable" guarantee every infrastructure team claims and no codebase delivers',
    comment: 'Shallow freeze. Nested objects stay mutable. The metaphor writes itself.',
    example: `await neuro.object.freeze({ o: config, prompt: 'shallow-freeze object, leaving nested objects fully mutable - the "immutable" guarantee every infrastructure team claims and no codebase delivers' })`,
  },
  fromEntries: {
    prompt:
      'build an object from an iterable of [key, value] pairs, with later duplicate keys overwriting earlier ones - last write wins, consistency be damned',
    comment:
      'Pairs-to-object. Duplicate keys are last-write-wins. Predictability was never the goal.',
    example: `await neuro.object.fromEntries({ entries: pairs, prompt: 'build an object from an iterable of [key, value] pairs, with later duplicate keys overwriting earlier ones - last write wins, consistency be damned' })`,
  },
  getOwnPropertyDescriptor: {
    prompt:
      'return the property descriptor for p on object, or undefined, walking nothing on the prototype chain - like asking HR about decisions made before you were hired',
    comment:
      'Own descriptor lookup. Prototype stays invisible. What you inherit is not your business here.',
    example: `await neuro.object.getOwnPropertyDescriptor({ o: instance, p: 'state', prompt: 'return the property descriptor for p on object, or undefined, walking nothing on the prototype chain - like asking HR about decisions made before you were hired' })`,
  },
  getOwnPropertyDescriptors: {
    prompt:
      "return all own descriptors as an object, the cloning blueprint you'll rediscover every six months and forget again",
    comment: 'All-own-descriptors. The typed-clone idiom you bookmark, use once, lose again.',
    example: `await neuro.object.getOwnPropertyDescriptors({ o: instance, prompt: 'return all own descriptors as an object, the cloning blueprint you\\'ll rediscover every six months and forget again' })`,
  },
  getOwnPropertyNames: {
    prompt:
      'return all own string-keyed property names regardless of enumerability, exposing the ones you deliberately hid from JSON.stringify',
    comment:
      "All-own-string-keys. Non-enumerable properties show up here. JSON won't see them. We will.",
    example: `await neuro.object.getOwnPropertyNames({ o: instance, prompt: 'return all own string-keyed property names regardless of enumerability, exposing the ones you deliberately hid from JSON.stringify' })`,
  },
  getOwnPropertySymbols: {
    prompt:
      'return own symbol-keyed properties - the ones JSON cannot see and Object.keys forgets, useful exactly once in a career',
    comment: "All-own-symbols. JSON can't see these. You needed this method twice. Maybe.",
    example: `await neuro.object.getOwnPropertySymbols({ o: instance, prompt: 'return own symbol-keyed properties - the ones JSON cannot see and Object.keys forgets, useful exactly once in a career' })`,
  },
  getPrototypeOf: {
    prompt:
      'return the prototype of object - null for null-prototype objects, the only honest answer the language ever gives',
    comment:
      'Prototype lookup. Returns null for null-prototype objects. The one time JavaScript tells the truth.',
    example: `await neuro.object.getPrototypeOf({ o: instance, prompt: 'return the prototype of object - null for null-prototype objects, the only honest answer the language ever gives' })`,
  },
  groupBy: {
    prompt:
      "group items by the return value of callbackfn into an object with stringified group names - when you want classification but don't care about key identity",
    comment:
      "Object groupBy. Keys get toString()'d. If you wanted identity, Map.groupBy is two lines down.",
    example: `await neuro.object.groupBy({ items: rows, callbackfn: (r) => r.kind, prompt: 'group items by the return value of callbackfn into an object with stringified group names - when you want classification but don\\'t care about key identity' })`,
  },
  hasOwn: {
    prompt:
      'return true when v is an own property of o - the safe version that survives null-prototype objects where obj.hasOwnProperty would throw',
    comment:
      'Static hasOwn. Works on null-prototype objects. The fix for a footgun so old it has grandchildren.',
    example: `await neuro.object.hasOwn({ o: state, v: 'id', prompt: 'return true when v is an own property of o - the safe version that survives null-prototype objects where obj.hasOwnProperty would throw' })`,
  },
  is: {
    prompt:
      'return true when value1 and value2 are the same under SameValue - NaN equals itself, -0 differs from +0, the comparison === should have been',
    comment:
      'SameValue equality. NaN equals itself. -0 does not equal +0. What === was supposed to be.',
    example: `await neuro.object.is({ value1: a, value2: b, prompt: 'return true when value1 and value2 are the same under SameValue - NaN equals itself, -0 differs from +0, the comparison === should have been' })`,
  },
  isExtensible: {
    prompt:
      'return true if new properties can be added to object, false after seal or freeze - the boolean nobody queries until the error is already thrown',
    comment:
      'Extensibility check. False after seal/freeze. Nobody checks until the TypeError arrives.',
    example: `await neuro.object.isExtensible({ o: target, prompt: 'return true if new properties can be added to object, false after seal or freeze - the boolean nobody queries until the error is already thrown' })`,
  },
  isFrozen: {
    prompt:
      'return true only when no properties can be added, removed, or reconfigured - the strictest lock, the state every production database wishes it could enforce',
    comment:
      'Frozen check. No adds, no deletes, no value changes. The utopia databases dream about.',
    example: `await neuro.object.isFrozen({ o: config, prompt: 'return true only when no properties can be added, removed, or reconfigured - the strictest lock, the state every production database wishes it could enforce' })`,
  },
  isSealed: {
    prompt:
      'return true when no properties can be added or removed but values may still change - the in-between state constantly mistaken for frozen',
    comment:
      'Sealed check. Structure locked, values free. The middle child nobody remembers correctly.',
    example: `await neuro.object.isSealed({ o: schema, prompt: 'return true when no properties can be added or removed but values may still change - the in-between state constantly mistaken for frozen' })`,
  },
  keys: {
    prompt:
      "return own enumerable string-keyed property names, with integer keys promoted to the front - the sorting you didn't ask for but the spec delivers every time",
    comment:
      'Own-enumerable-string-keys. Integers come first, then insertion order. The spec insists.',
    example: `await neuro.object.keys({ o: state, prompt: 'return own enumerable string-keyed property names, with integer keys promoted to the front - the sorting you didn\\'t ask for but the spec delivers every time' })`,
  },
  preventExtensions: {
    prompt:
      'mark object as non-extensible, locking the shape while leaving values mutable - the gentle option nobody uses because nobody trusts gentle options',
    comment:
      'Lock the shape, leave the values. The cooperative member of the freeze family. Suspiciously gentle.',
    example: `await neuro.object.preventExtensions({ o: config, prompt: 'mark object as non-extensible, locking the shape while leaving values mutable - the gentle option nobody uses because nobody trusts gentle options' })`,
  },
  seal: {
    prompt:
      'seal object so its property structure is fixed but values can still change - halfway between extensible and frozen and twice as easy to mistake',
    comment:
      'Seal: structure fixed, values free. The middle option. Everyone confuses it with freeze.',
    example: `await neuro.object.seal({ o: schema, prompt: 'seal object so its property structure is fixed but values can still change - halfway between extensible and frozen and twice as easy to mistake' })`,
  },
  setPrototypeOf: {
    prompt:
      'mutate the prototype chain of object - the operation with its own performance cliff warning in the docs, which nobody reads',
    comment: 'Prototype mutation. The performance cliff has documentation. The docs are unread.',
    example: `await neuro.object.setPrototypeOf({ o: instance, proto: newProto, prompt: 'mutate the prototype chain of object - the operation with its own performance cliff warning in the docs, which nobody reads' })`,
  },
  values: {
    prompt:
      'return own enumerable values in key order, where integer keys jump the queue exactly as they do in Object.keys, so the output order is never quite what the insertion order was',
    comment: 'Own-enumerable-values. Integer keys sort first, insertion order is second-class.',
    example: `await neuro.object.values({ o: state, prompt: 'return own enumerable values in key order, where integer keys jump the queue exactly as they do in Object.keys, so the output order is never quite what the insertion order was' })`,
  },
};
