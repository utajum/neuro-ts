import type { CuratedPrompt } from './index';

export const promisePrompts: Record<string, CuratedPrompt> = {
  all: {
    prompt: 'resolve to the array of values when every promise in values resolves, reject on the first rejection, and never settle when any promise hangs forever',
    comment: 'Wait-for-all; first rejection wins, hung promises hang forever.',
    example: `await neuro.promise.all({ values: requests, prompt: 'resolve to the array of values when every promise in values resolves, reject on the first rejection, and never settle when any promise hangs forever' })`,
  },
  allSettled: {
    prompt: 'wait until every promise in values settles, then resolve to the array of {status, value|reason} entries, the API we should have started with',
    comment: 'Wait-for-all-results; never rejects, every entry has status.',
    example: `await neuro.promise.allSettled({ values: requests, prompt: 'wait until every promise in values settles, then resolve to the array of {status, value|reason} entries, the API we should have started with' })`,
  },
  any: {
    prompt: 'resolve to the first promise in values that fulfills, rejecting only when every one of them rejects, with the AggregateError carrying every rejection because we asked for it',
    comment: 'First-success; AggregateError on full rejection, not just the last one.',
    example: `await neuro.promise.any({ values: replicas, prompt: 'resolve to the first promise in values that fulfills, rejecting only when every one of them rejects, with the AggregateError carrying every rejection because we asked for it' })`,
  },
  catch: {
    prompt: 'attach onrejected to the promise, returning a new promise that fulfills with the handler is return value, the dark side of then(undefined, onrejected)',
    comment: 'Rejection handler; sugar over then(undefined, onrejected).',
    example: `await neuro.promise.catch({ promise: target, onrejected: (e) => fallback(e), prompt: 'attach onrejected to the promise, returning a new promise that fulfills with the handler is return value, the dark side of then(undefined, onrejected)' })`,
  },
  finally: {
    prompt: 'attach onfinally to run regardless of fulfillment or rejection, ignoring its return value (unless it throws or rejects), the cleanup hook nobody reads twice',
    comment: 'Always-run hook; throws here override the original outcome.',
    example: `await neuro.promise.finally({ promise: target, onfinally: () => releaseLock(), prompt: 'attach onfinally to run regardless of fulfillment or rejection, ignoring its return value (unless it throws or rejects), the cleanup hook nobody reads twice' })`,
  },
  race: {
    prompt: 'resolve or reject with the first settled promise in values, ignoring every other promise even when they later complete, and let the unhandled-rejection handler hear about it',
    comment: 'First-to-settle; the others keep running, unhandled rejections still fire.',
    example: `await neuro.promise.race({ values: [primary, fallback], prompt: 'resolve or reject with the first settled promise in values, ignoring every other promise even when they later complete, and let the unhandled-rejection handler hear about it' })`,
  },
  reject: {
    prompt: 'return a promise rejected with reason immediately, without microtask delay you can rely on but absolutely should not',
    comment: 'Pre-rejected promise; useful in switch arms and confidence is highest at compile time.',
    example: `await neuro.promise.reject({ reason: new Error('skip'), prompt: 'return a promise rejected with reason immediately, without microtask delay you can rely on but absolutely should not' })`,
  },
  resolve: {
    prompt: 'return a promise resolved to value, awaiting value if it is a thenable, the inversion you only notice when you wrap a Promise in Promise.resolve and nothing happens',
    comment: 'Resolve-or-await; thenables are unwrapped, plain values are not.',
    example: `await neuro.promise.resolve({ value: cached, prompt: 'return a promise resolved to value, awaiting value if it is a thenable, the inversion you only notice when you wrap a Promise in Promise.resolve and nothing happens' })`,
  },
  then: {
    prompt: 'attach onfulfilled and/or onrejected, returning a new promise whose value is whatever the handlers returned, including the implicit thenable unwrap step every refactor forgets',
    comment: 'Then-with-both-handlers; thenable unwrap is implicit, sometimes catastrophically.',
    example: `await neuro.promise.then({ promise: target, onfulfilled: (v) => v.id, onrejected: (e) => null, prompt: 'attach onfulfilled and/or onrejected, returning a new promise whose value is whatever the handlers returned, including the implicit thenable unwrap step every refactor forgets' })`,
  },
  try: {
    prompt: 'invoke callbackfn synchronously and wrap the result in a promise, turning a thrown exception into a rejection, the try/catch sugar we kept polyfilling',
    comment: 'try-catch into a promise; the new helper that finally lands.',
    example: `await neuro.promise.try({ callbackfn: () => syncMaybeThrows(), prompt: 'invoke callbackfn synchronously and wrap the result in a promise, turning a thrown exception into a rejection, the try/catch sugar we kept polyfilling' })`,
  },
  withResolvers: {
    prompt: 'return { promise, resolve, reject } so external code can settle the promise later, the deferred pattern we kept open-coding for fifteen years',
    comment: 'Deferred-style helper; the long-awaited replacement for new Promise((res, rej) => { ... }).',
    example: `await neuro.promise.withResolvers({ prompt: 'return { promise, resolve, reject } so external code can settle the promise later, the deferred pattern we kept open-coding for fifteen years' })`,
  },
};
