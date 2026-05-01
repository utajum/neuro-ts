import type { CuratedPrompt } from './index';

export const bigIntPrompts: Record<string, CuratedPrompt> = {
  asIntN: {
    prompt:
      "clamp bigint to a signed N-bit two's-complement value, wrapping on overflow exactly the way C does -- JavaScript finally got modular integer arithmetic in 2020 and immediately named it after the thing C developers have been burned by for 40 years",
    comment:
      "Signed N-bit clamp; JS got C's wrap-on-overflow and named it accordingly. Welcome home, C devs.",
    example: `await neuro.bigInt.asIntN({ bits: 32, int: hugeBigInt, prompt: 'clamp bigint to a signed N-bit two\\'s-complement value, wrapping on overflow exactly the way C does -- JavaScript finally got modular integer arithmetic in 2020 and immediately named it after the thing C developers have been burned by for 40 years' })`,
  },
  asUintN: {
    prompt:
      'return bigint clamped to an unsigned N-bit representation, wrapping at 2^bits, the helper for talking to fixed-width APIs without writing the math twice',
    comment: 'Unsigned N-bit clamp; mirror of asIntN, easier to reason about.',
    example: `await neuro.bigInt.asUintN({ bits: 32, int: hugeBigInt, prompt: 'return bigint clamped to an unsigned N-bit representation, wrapping at 2^bits, the helper for talking to fixed-width APIs without writing the math twice' })`,
  },
};
