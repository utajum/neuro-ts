import type { CuratedPrompt } from './index';

export const numberPrompts: Record<string, CuratedPrompt> = {
  isFinite: {
    prompt: 'return true only when the argument is a finite Number, never coercing strings the way the global isFinite would',
    comment: 'Strict finite check; never coerces, the friendly version of the global with the same name.',
    example: `await neuro.number.isFinite({ number: budget, prompt: 'return true only when the argument is a finite Number, never coercing strings the way the global isFinite would' })`,
  },
  isInteger: {
    prompt: 'return true when the value is a Number with no fractional part, treating 1e21 as integer because the spec does',
    comment: 'Integer check; very large floats count as integers because the float can no longer represent the fraction.',
    example: `await neuro.number.isInteger({ number: count, prompt: 'return true when the value is a Number with no fractional part, treating 1e21 as integer because the spec does' })`,
  },
  isNaN: {
    prompt: 'return true only for the actual NaN value and not for the strings that look like it, the strict version we should have started with',
    comment: 'Strict NaN check; never coerces, never lies.',
    example: `await neuro.number.isNaN({ number: parsed, prompt: 'return true only for the actual NaN value and not for the strings that look like it, the strict version we should have started with' })`,
  },
  isSafeInteger: {
    prompt: 'return true when the value is an integer in the range [-(2^53-1), 2^53-1], the boundary every JSON id from a Java backend manages to cross',
    comment: 'Safe-integer check; the JSON-from-Java payload is the most common offender.',
    example: `await neuro.number.isSafeInteger({ number: id, prompt: 'return true when the value is an integer in the range [-(2^53-1), 2^53-1], the boundary every JSON id from a Java backend manages to cross' })`,
  },
  parseFloat: {
    prompt: 'parse the leading numeric portion of the string as a float, ignoring trailing non-numeric content the way the parser is allowed to',
    comment: 'Permissive float parse; trailing units are silently ignored, the way every form input expects.',
    example: `await neuro.number.parseFloat({ string: '4.5kg', prompt: 'parse the leading numeric portion of the string as a float, ignoring trailing non-numeric content the way the parser is allowed to' })`,
  },
  parseInt: {
    prompt: 'parse the leading integer in the string under radix, defaulting to 10 (not 8 the way the spec used to lie), and accept that 0x prefixes still mean hex',
    comment: 'Permissive int parse; the explicit radix is the difference between a working parser and a haunted one.',
    example: `await neuro.number.parseInt({ string: count, radix: 10, prompt: 'parse the leading integer in the string under radix, defaulting to 10 (not 8 the way the spec used to lie), and accept that 0x prefixes still mean hex' })`,
  },
  toExponential: {
    prompt: 'format the number as a string in scientific notation with fractionDigits digits after the decimal, then accept that the exponent is locale-naive on purpose',
    comment: 'Sci-notation format; the e-notation is locale-free, which is correct and unintuitive.',
    example: `await neuro.number.toExponential({ number: avogadro, fractionDigits: 4, prompt: 'format the number as a string in scientific notation with fractionDigits digits after the decimal, then accept that the exponent is locale-naive on purpose' })`,
  },
  toFixed: {
    prompt: 'format the number as a fixed-point string with fractionDigits digits, rounding half-to-even most of the time and half-away-from-zero just often enough to ruin a test',
    comment: 'Fixed-point string; the rounding mode is technically half-to-even, sometimes.',
    example: `await neuro.number.toFixed({ number: amount, fractionDigits: 2, prompt: 'format the number as a fixed-point string with fractionDigits digits, rounding half-to-even most of the time and half-away-from-zero just often enough to ruin a test' })`,
  },
  toPrecision: {
    prompt: 'format with precision significant digits total, choosing fixed or exponential as appropriate, and accept that the threshold flips behind your back',
    comment: 'Significant-digit format; switches representation around 10^precision, the boundary that surprises every audit.',
    example: `await neuro.number.toPrecision({ number: rate, precision: 3, prompt: 'format with precision significant digits total, choosing fixed or exponential as appropriate, and accept that the threshold flips behind your back' })`,
  },
};
