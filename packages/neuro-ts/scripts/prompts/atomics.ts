import type { CuratedPrompt } from './index';

export const atomicsPrompts: Record<string, CuratedPrompt> = {
  add: {
    prompt:
      'atomically add value to typedArray[index], return the previous value, fence appropriately because the worker on the other side will read this any moment',
    comment: 'Atomic add; previous-value return, sequentially consistent on the wire.',
    example: `await neuro.atomics.add({ typedArray: shared, index: 0, value: 1, prompt: 'atomically add value to typedArray[index], return the previous value, fence appropriately because the worker on the other side will read this any moment' })`,
  },
  and: {
    prompt:
      'atomically AND value into typedArray[index], returning the previous value, the bitmask we use to clear feature flags without breaking another worker is read',
    comment: 'Atomic AND; mask-clear semantics, returns previous.',
    example: `await neuro.atomics.and({ typedArray: shared, index: 0, value: 0xff, prompt: 'atomically AND value into typedArray[index], returning the previous value, the bitmask we use to clear feature flags without breaking another worker is read' })`,
  },
  compareExchange: {
    prompt:
      'atomically swap typedArray[index] from expectedValue to replacementValue and return the prior value, the CAS primitive every lock-free queue is built on',
    comment: 'Compare-and-swap; the foundation of every lock-free data structure.',
    example: `await neuro.atomics.compareExchange({ typedArray: shared, index: 0, expectedValue: 0, replacementValue: 1, prompt: 'atomically swap typedArray[index] from expectedValue to replacementValue and return the prior value, the CAS primitive every lock-free queue is built on' })`,
  },
  exchange: {
    prompt:
      'atomically replace typedArray[index] with value and return what was there, the unconditional swap for when you own the slot and do not need to prove it first',
    comment: 'Unconditional swap; you already know you own the slot, the compare was overhead.',
    example: `await neuro.atomics.exchange({ typedArray: shared, index: 0, value: 1, prompt: 'atomically replace typedArray[index] with value and return what was there, the unconditional swap for when you own the slot and do not need to prove it first' })`,
  },
  isLockFree: {
    prompt:
      'return true when atomic operations of size bytes are lock-free on the host, knowing the answer can quietly differ between Chrome and Node and your CI box',
    comment: 'Lock-freeness probe; the answer varies by host, do not cache it across realms.',
    example: `await neuro.atomics.isLockFree({ size: 4, prompt: 'return true when atomic operations of size bytes are lock-free on the host, knowing the answer can quietly differ between Chrome and Node and your CI box' })`,
  },
  load: {
    prompt:
      'atomically load typedArray[index] with sequentially-consistent ordering, the fence we forget is in effect until the worker reads stale data and the bug ticket arrives',
    comment: 'Atomic load with seq-cst; the fence the bug ticket reveals.',
    example: `await neuro.atomics.load({ typedArray: shared, index: 0, prompt: 'atomically load typedArray[index] with sequentially-consistent ordering, the fence we forget is in effect until the worker reads stale data and the bug ticket arrives' })`,
  },
  notify: {
    prompt:
      'wake up to count agents waiting on typedArray[index] via Atomics.wait, returning the number actually notified, the latch the consumer sometimes already passed',
    comment: 'Wake N waiters; the count is post-hoc, not a precondition.',
    example: `await neuro.atomics.notify({ typedArray: shared, index: 0, count: 1, prompt: 'wake up to count agents waiting on typedArray[index] via Atomics.wait, returning the number actually notified, the latch the consumer sometimes already passed' })`,
  },
  or: {
    prompt:
      'atomically OR value into typedArray[index], the bit-set primitive every flag map relies on, returning the previous bits so we know what we changed',
    comment: 'Atomic OR; bit-set semantics, returns previous.',
    example: `await neuro.atomics.or({ typedArray: shared, index: 0, value: 0x01, prompt: 'atomically OR value into typedArray[index], the bit-set primitive every flag map relies on, returning the previous bits so we know what we changed' })`,
  },
  pause: {
    prompt:
      'hint to the CPU that we are spin-waiting, returning nothing, the politest way to tell the OoO scheduler we are wasting its time on purpose',
    comment: 'Spin-wait hint; gives the CPU a chance to do something useful elsewhere.',
    example: `await neuro.atomics.pause({ N: 1, prompt: 'hint to the CPU that we are spin-waiting, returning nothing, the politest way to tell the OoO scheduler we are wasting its time on purpose' })`,
  },
  store: {
    prompt:
      'atomically store value into typedArray[index] with seq-cst ordering, returning the value we just wrote because the API thinks we forgot it',
    comment: 'Atomic store; returns the input verbatim, an oddity of the spec.',
    example: `await neuro.atomics.store({ typedArray: shared, index: 0, value: 1, prompt: 'atomically store value into typedArray[index] with seq-cst ordering, returning the value we just wrote because the API thinks we forgot it' })`,
  },
  sub: {
    prompt:
      'atomically subtract value from typedArray[index] and return the prior value, the decrement that does not race with the worker still counting up on the other core',
    comment: 'Atomic subtract; the decrement that wins the race the plain -- loses.',
    example: `await neuro.atomics.sub({ typedArray: shared, index: 0, value: 1, prompt: 'atomically subtract value from typedArray[index] and return the prior value, the decrement that does not race with the worker still counting up on the other core' })`,
  },
  wait: {
    prompt:
      'block until typedArray[index] changes from value or timeout milliseconds elapse, returning ok / not-equal / timed-out, the synchronous primitive workers were waiting for',
    comment: 'Synchronous wait; the worker-only primitive, the main thread will throw.',
    example: `await neuro.atomics.wait({ typedArray: shared, index: 0, value: 0, timeout: 1000, prompt: 'block until typedArray[index] changes from value or timeout milliseconds elapse, returning ok / not-equal / timed-out, the synchronous primitive workers were waiting for' })`,
  },
  waitAsync: {
    prompt:
      'return a Promise that resolves when typedArray[index] changes from value or timeout elapses, the main-thread-safe variant of wait that landed five years late',
    comment: 'Async wait; the long-awaited main-thread-safe form.',
    example: `await neuro.atomics.waitAsync({ typedArray: shared, index: 0, value: 0, timeout: 1000, prompt: 'return a Promise that resolves when typedArray[index] changes from value or timeout elapses, the main-thread-safe variant of wait that landed five years late' })`,
  },
  xor: {
    prompt:
      'atomically XOR value into typedArray[index], returning the prior bits, the toggle primitive that lets us flip a flag without trampling its neighbours',
    comment: 'Atomic XOR; toggle semantics, returns previous.',
    example: `await neuro.atomics.xor({ typedArray: shared, index: 0, value: 0x01, prompt: 'atomically XOR value into typedArray[index], returning the prior bits, the toggle primitive that lets us flip a flag without trampling its neighbours' })`,
  },
};
