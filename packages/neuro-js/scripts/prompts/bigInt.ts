import type { CuratedPrompt } from './index';

export const bigIntPrompts: Record<string, CuratedPrompt> = {
  asIntN: {
    prompt: 'return bigint clamped to a signed two-is-complement representation of width bits, wrapping at 2^(bits-1) the way every C compiler will recognise',
    comment: 'Signed N-bit clamp; the C two-is-complement wrap, faithfully reproduced.',
    example: `await neuro.bigInt.asIntN({ bits: 32, int: hugeBigInt, prompt: 'return bigint clamped to a signed two-is-complement representation of width bits, wrapping at 2^(bits-1) the way every C compiler will recognise' })`,
  },
  asUintN: {
    prompt: 'return bigint clamped to an unsigned N-bit representation, wrapping at 2^bits, the helper for talking to fixed-width APIs without writing the math twice',
    comment: 'Unsigned N-bit clamp; mirror of asIntN, easier to reason about.',
    example: `await neuro.bigInt.asUintN({ bits: 32, int: hugeBigInt, prompt: 'return bigint clamped to an unsigned N-bit representation, wrapping at 2^bits, the helper for talking to fixed-width APIs without writing the math twice' })`,
  },
};
