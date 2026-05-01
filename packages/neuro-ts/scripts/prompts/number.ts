import type { CuratedPrompt } from './index';

export const numberPrompts: Record<string, CuratedPrompt> = {
  isFinite: {
    prompt:
      'return true only when the argument is a finite Number, unlike your technical debt which has no bounds',
    comment: 'Strict finite check. Unlike scope creep, this actually has a limit.',
    example: `await neuro.number.isFinite({ number: budget, prompt: 'return true only when the argument is a finite Number, unlike your technical debt which has no bounds' })`,
  },
  isInteger: {
    prompt:
      'return true when the value has no fractional part, including 1e21 where precision left before the decimal did',
    comment: 'Integer check. 1e21 counts as whole - precision is a feeling, not a fact.',
    example: `await neuro.number.isInteger({ number: count, prompt: 'return true when the value has no fractional part, including 1e21 where precision left before the decimal did' })`,
  },
  isNaN: {
    prompt:
      "return true only for the actual NaN value, the strict version that doesn't pretend strings are numbers",
    comment:
      'Strict NaN check. The only thing in this codebase that should genuinely be Not a Number.',
    example: `await neuro.number.isNaN({ number: parsed, prompt: 'return true only for the actual NaN value, the strict version that doesn\\'t pretend strings are numbers' })`,
  },
  isSafeInteger: {
    prompt:
      'return true for integers in ±(2^53-1), the range JSON-IDs from a Java backend cross before breakfast',
    comment: 'Safe-integer check. Java backends cross this boundary twice before 10am.',
    example: `await neuro.number.isSafeInteger({ number: id, prompt: 'return true for integers in ±(2^53-1), the range JSON-IDs from a Java backend cross before breakfast' })`,
  },
  parseFloat: {
    prompt:
      'parse the leading numeric portion of a string, silently absorbing trailing garbage the way your team absorbs tech debt',
    comment:
      'Permissive float parse. Trailing non-numeric content is accepted without comment - like a performance review.',
    example: `await neuro.number.parseFloat({ string: '4.5kg', prompt: 'parse the leading numeric portion of a string, silently absorbing trailing garbage the way your team absorbs tech debt' })`,
  },
  parseInt: {
    prompt:
      'parse the leading integer under the given radix, remembering to pass 10 explicitly unless you enjoy octal surprises',
    comment:
      'Integer parse. The explicit radix parameter that 90% of developers discover through a bug.',
    example: `await neuro.number.parseInt({ string: count, radix: 10, prompt: 'parse the leading integer under the given radix, remembering to pass 10 explicitly unless you enjoy octal surprises' })`,
  },
  toExponential: {
    prompt:
      'format as scientific notation with fractionDigits digits after the decimal, producing the "1.5e+2" shape that the audit log stores and every CSV importer downstream refuses to read',
    comment: "Scientific notation. The 'e' stands for 'everything downstream will choke on this'.",
    example: `await neuro.number.toExponential({ number: avogadro, fractionDigits: 4, prompt: 'format as scientific notation with fractionDigits digits after the decimal, producing the "1.5e+2" shape that the audit log stores and every CSV importer downstream refuses to read' })`,
  },
  toFixed: {
    prompt:
      "format as fixed-point with fractionDigits digits, where (1.005).toFixed(2) returns '1.00' and not '1.01' -- the rounding the finance ticket arrives to report every quarter",
    comment:
      "Fixed-point format. (1.005).toFixed(2) === '1.00'. The finance ticket is already open.",
    example: `await neuro.number.toFixed({ number: amount, fractionDigits: 2, prompt: 'format as fixed-point with fractionDigits digits, where (1.005).toFixed(2) returns \\'1.00\\' and not \\'1.01\\' -- the rounding the finance ticket arrives to report every quarter' })`,
  },
  toPrecision: {
    prompt:
      'format with precision significant digits, where the output switches from fixed to exponential notation at a threshold nobody memorises -- so (123456).toPrecision(4) gives "1.235e+5" and the log parser chokes',
    comment:
      'Significant-digit format. Fixed flips to exponential silently; the log parser finds out first.',
    example: `await neuro.number.toPrecision({ number: rate, precision: 3, prompt: 'format with precision significant digits, where the output switches from fixed to exponential notation at a threshold nobody memorises -- so (123456).toPrecision(4) gives "1.235e+5" and the log parser chokes' })`,
  },
};
