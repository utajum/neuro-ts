import type { CuratedPrompt } from './index';

export const promisePrompts: Record<string, CuratedPrompt> = {
  all: {
    prompt:
      'resolve to an array of values when every promise fulfills, reject on first failure, hang forever if anything hangs - like waiting for all departments to sign off',
    comment:
      'Wait-for-all. First rejection wins, hung promises hang forever. Just like cross-team dependencies.',
    example: `await neuro.promise.all({ values: requests, prompt: 'resolve to an array of values when every promise fulfills, reject on first failure, hang forever if anything hangs - like waiting for all departments to sign off' })`,
  },
  allSettled: {
    prompt:
      'wait until every promise settles, then resolve to {status, value|reason} entries, the API we should have started with - like a retrospective',
    comment: 'Wait-for-all-results. Never rejects. The API we should have built first.',
    example: `await neuro.promise.allSettled({ values: requests, prompt: 'wait until every promise settles, then resolve to {status, value|reason} entries, the API we should have started with - like a retrospective' })`,
  },
  any: {
    prompt:
      "resolve to the first promise that fulfills, reject with an AggregateError only when every single one rejects, carrying everyone's excuses",
    comment: 'First-success. AggregateError on total failure carries every rejection. Thoroughly.',
    example: `await neuro.promise.any({ values: replicas, prompt: 'resolve to the first promise that fulfills, reject with an AggregateError only when every single one rejects, carrying everyone\\'s excuses' })`,
  },
  catch: {
    prompt:
      "attach a rejection handler, returning a new promise that fulfills with the handler's return - syntactic comfort wrapped around the dark side of then()",
    comment:
      'Rejection handler. Sugar over then(undefined, onrejected). The dark side, made palatable.',
    example: `await neuro.promise.catch({ promise: target, onrejected: (e) => fallback(e), prompt: 'attach a rejection handler, returning a new promise that fulfills with the handler\\'s return - syntactic comfort wrapped around the dark side of then()' })`,
  },
  finally: {
    prompt:
      'attach a handler that runs on either outcome, ignoring its return unless it throws - the cleanup hook that can betray you',
    comment:
      'Always-run hook. A throw here overrides the original outcome. The cleanup you learn to fear.',
    example: `await neuro.promise.finally({ promise: target, onfinally: () => releaseLock(), prompt: 'attach a handler that runs on either outcome, ignoring its return unless it throws - the cleanup hook that can betray you' })`,
  },
  race: {
    prompt:
      'resolve or reject with the first settled promise, leaving the rest running in the background - like abandoned microservices',
    comment: 'First-to-settle. The losers keep executing. Unhandled rejections still fire.',
    example: `await neuro.promise.race({ values: [primary, fallback], prompt: 'resolve or reject with the first settled promise, leaving the rest running in the background - like abandoned microservices' })`,
  },
  reject: {
    prompt:
      'return a pre-rejected promise immediately, for switch arms and places where hope was never declared as a variable',
    comment: 'Pre-rejected promise. Used where hope was never a variable.',
    example: `await neuro.promise.reject({ reason: new Error('skip'), prompt: 'return a pre-rejected promise immediately, for switch arms and places where hope was never declared as a variable' })`,
  },
  resolve: {
    prompt:
      'resolve or await a value, unwrapping thenables silently - the step the junior discovers during the outage',
    comment:
      'Resolve-or-await. Wrapping a Promise in Promise.resolve does nothing. The discovery hurts.',
    example: `await neuro.promise.resolve({ value: cached, prompt: 'resolve or await a value, unwrapping thenables silently - the step the junior discovers during the outage' })`,
  },
  then: {
    prompt:
      'attach fulfillment and rejection handlers, returning a new promise with implicit thenable unwrap - the step every refactor forgets before the incident',
    comment: 'Dual-handler attach. Implicit thenable unwrap is catastrophically forgettable.',
    example: `await neuro.promise.then({ promise: target, onfulfilled: (v) => v.id, onrejected: (e) => null, prompt: 'attach fulfillment and rejection handlers, returning a new promise with implicit thenable unwrap - the step every refactor forgets before the incident' })`,
  },
  try: {
    prompt:
      'invoke callbackfn synchronously and wrap its return in a promise, turning any throw into a rejection -- the async boundary that async/await needed in 2017 and finally shipped in 2024',
    comment: 'Sync-to-promise bridge. Shipped in 2024. Seven years after everyone needed it.',
    example: `await neuro.promise.try({ callbackfn: () => syncMaybeThrows(), prompt: 'invoke callbackfn synchronously and wrap its return in a promise, turning any throw into a rejection -- the async boundary that async/await needed in 2017 and finally shipped in 2024' })`,
  },
  withResolvers: {
    prompt:
      'return { promise, resolve, reject } so external code can settle the promise later - fifteen years of new Promise((res, rej) => {...}) finally put to rest',
    comment:
      'Deferred pattern without the boilerplate. Rest in peace, new Promise constructor body.',
    example: `await neuro.promise.withResolvers({ prompt: 'return { promise, resolve, reject } so external code can settle the promise later - fifteen years of new Promise((res, rej) => {...}) finally put to rest' })`,
  },
};
