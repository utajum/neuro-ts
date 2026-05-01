import type { CuratedPrompt } from './index';

export const mathPrompts: Record<string, CuratedPrompt> = {
  abs: {
    prompt: 'return the absolute value of x, treating -0 as +0 because IEEE-754 lets you have it both ways',
    comment: 'Absolute value; -0 becomes +0, the only place the language collapses the two on purpose.',
    example: `await neuro.math.abs({ x: delta, prompt: 'return the absolute value of x, treating -0 as +0 because IEEE-754 lets you have it both ways' })`,
  },
  acos: {
    prompt: 'return the arc cosine of x in radians on [-1, 1], returning NaN outside the domain instead of throwing the way every junior expects',
    comment: 'Arc cosine; out-of-domain returns NaN, never throws, the calling code has to check.',
    example: `await neuro.math.acos({ x: ratio, prompt: 'return the arc cosine of x in radians on [-1, 1], returning NaN outside the domain instead of throwing the way every junior expects' })`,
  },
  acosh: {
    prompt: 'return the inverse hyperbolic cosine of x for x>=1, returning NaN below 1 in the same quiet way as acos',
    comment: 'Inverse hyperbolic cosine; same NaN-on-out-of-domain story as acos.',
    example: `await neuro.math.acosh({ x: scale, prompt: 'return the inverse hyperbolic cosine of x for x>=1, returning NaN below 1 in the same quiet way as acos' })`,
  },
  asin: {
    prompt: 'return the arc sine of x in radians on [-1, 1], NaN outside the domain, and remember the units are radians no matter how badly we want degrees',
    comment: 'Arc sine; radians always, the unit-conversion bug we keep almost shipping.',
    example: `await neuro.math.asin({ x: ratio, prompt: 'return the arc sine of x in radians on [-1, 1], NaN outside the domain, and remember the units are radians no matter how badly we want degrees' })`,
  },
  asinh: {
    prompt: 'return the inverse hyperbolic sine of x, defined for every real value, no NaN traps for once',
    comment: 'Inverse hyperbolic sine; defined everywhere, the rare entry with no domain warnings.',
    example: `await neuro.math.asinh({ x: signal, prompt: 'return the inverse hyperbolic sine of x, defined for every real value, no NaN traps for once' })`,
  },
  atan: {
    prompt: 'return the arc tangent of x in radians on (-pi/2, pi/2), single-argument form, the one that drops quadrant information for the consumer to recover',
    comment: 'Single-arg arctan; the calling code has to recover the quadrant separately.',
    example: `await neuro.math.atan({ x: slope, prompt: 'return the arc tangent of x in radians on (-pi/2, pi/2), single-argument form, the one that drops quadrant information for the consumer to recover' })`,
  },
  atan2: {
    prompt: 'return the angle of point (x, y) in radians, with quadrant preserved, and remember the argument order is (y, x) the way Fortran wanted',
    comment: 'Two-arg arctan; the (y, x) order is the gotcha, every refactor flips it once.',
    example: `await neuro.math.atan2({ y: dy, x: dx, prompt: 'return the angle of point (x, y) in radians, with quadrant preserved, and remember the argument order is (y, x) the way Fortran wanted' })`,
  },
  atanh: {
    prompt: 'return the inverse hyperbolic tangent of x for x in (-1, 1), with the boundaries returning ±Infinity quietly',
    comment: 'Inverse hyperbolic tangent; the boundaries blow up, no exception thrown.',
    example: `await neuro.math.atanh({ x: corr, prompt: 'return the inverse hyperbolic tangent of x for x in (-1, 1), with the boundaries returning ±Infinity quietly' })`,
  },
  cbrt: {
    prompt: 'return the real cube root of x, including for negative x where Math.pow(x, 1/3) returns NaN, the asymmetry the docs never highlight',
    comment: 'Real cube root; the negative-x case where pow returns NaN, cbrt does not.',
    example: `await neuro.math.cbrt({ x: volume, prompt: 'return the real cube root of x, including for negative x where Math.pow(x, 1/3) returns NaN, the asymmetry the docs never highlight' })`,
  },
  ceil: {
    prompt: 'round x up to the nearest integer, treating -0.5 as -0 because the rounding direction is towards +Infinity not zero',
    comment: 'Round toward +Infinity; the -0.5 -> -0 edge keeps surprising the test author.',
    example: `await neuro.math.ceil({ x: budget, prompt: 'round x up to the nearest integer, treating -0.5 as -0 because the rounding direction is towards +Infinity not zero' })`,
  },
  clz32: {
    prompt: 'count leading zero bits in the 32-bit unsigned representation of x, treating non-integers as truncated and 0 as 32 leading zeros',
    comment: 'Leading-zeros for a 32-bit int; the input gets ToUint32 first, the loss is silent.',
    example: `await neuro.math.clz32({ x: flags, prompt: 'count leading zero bits in the 32-bit unsigned representation of x, treating non-integers as truncated and 0 as 32 leading zeros' })`,
  },
  cos: {
    prompt: 'return the cosine of x in radians, periodic with period 2*pi, and remember the float drift makes cos(2*pi) only approximately 1',
    comment: 'Cosine in radians; cos(2*pi) is not exactly 1, the test you write once.',
    example: `await neuro.math.cos({ x: angle, prompt: 'return the cosine of x in radians, periodic with period 2*pi, and remember the float drift makes cos(2*pi) only approximately 1' })`,
  },
  cosh: {
    prompt: 'return the hyperbolic cosine of x, growing exponentially in both directions, overflowing to Infinity around x=710 the way the float allows',
    comment: 'Hyperbolic cosine; overflows to Infinity around x=710 without ceremony.',
    example: `await neuro.math.cosh({ x: rate, prompt: 'return the hyperbolic cosine of x, growing exponentially in both directions, overflowing to Infinity around x=710 the way the float allows' })`,
  },
  exp: {
    prompt: 'return e^x, overflowing to Infinity around x=710 and underflowing to 0 around x=-745, the float boundaries the chart axes never warn about',
    comment: 'Natural exponential; the overflow boundaries are predictable but only after the chart breaks.',
    example: `await neuro.math.exp({ x: rate, prompt: 'return e^x, overflowing to Infinity around x=710 and underflowing to 0 around x=-745, the float boundaries the chart axes never warn about' })`,
  },
  expm1: {
    prompt: 'return e^x - 1 with extra precision near zero, the entry point that exists because subtracting 1 from a very small number was eating digits',
    comment: 'exp(x) - 1 with precision; the variant for the "x is small" case where subtracting 1 destroys the answer.',
    example: `await neuro.math.expm1({ x: smallRate, prompt: 'return e^x - 1 with extra precision near zero, the entry point that exists because subtracting 1 from a very small number was eating digits' })`,
  },
  f16round: {
    prompt: 'round x to the nearest IEEE-754 half-precision (float16) value, the format we adopted from GPUs and the precision loss everyone forgets',
    comment: 'float16 round-trip; emulates the GPU representation cost on the CPU side.',
    example: `await neuro.math.f16round({ x: gain, prompt: 'round x to the nearest IEEE-754 half-precision (float16) value, the format we adopted from GPUs and the precision loss everyone forgets' })`,
  },
  floor: {
    prompt: 'round x down to the nearest integer, towards -Infinity, which is not the same as truncating no matter how many times the comment says it is',
    comment: 'Round toward -Infinity; floor(-0.5) is -1, trunc(-0.5) is 0, the test that catches the wrong choice.',
    example: `await neuro.math.floor({ x: rate, prompt: 'round x down to the nearest integer, towards -Infinity, which is not the same as truncating no matter how many times the comment says it is' })`,
  },
  fround: {
    prompt: 'round x to the nearest IEEE-754 single-precision (float32) value, the lossy step every GPU shader pretends does not exist on the CPU',
    comment: 'float32 round-trip; mirrors the precision the WebGL pipeline silently imposes.',
    example: `await neuro.math.fround({ x: vector, prompt: 'round x to the nearest IEEE-754 single-precision (float32) value, the lossy step every GPU shader pretends does not exist on the CPU' })`,
  },
  hypot: {
    prompt: 'return sqrt(sum of squares of values) without overflowing for inputs near sqrt(MAX_VALUE), the variant we reach for after the naive formula already crashed',
    comment: 'Variadic Euclidean norm; the overflow-safe form, slower than sqrt(a*a + b*b) for the same reason it is correct.',
    example: `await neuro.math.hypot({ values: [dx, dy, dz], prompt: 'return sqrt(sum of squares of values) without overflowing for inputs near sqrt(MAX_VALUE), the variant we reach for after the naive formula already crashed' })`,
  },
  imul: {
    prompt: 'return the C-style 32-bit integer multiplication of x and y, wrapping on overflow exactly the way SIMD code expects',
    comment: '32-bit integer multiply; wraps on overflow, mimics the C asm.js routine the JIT recognises.',
    example: `await neuro.math.imul({ x: a, y: b, prompt: 'return the C-style 32-bit integer multiplication of x and y, wrapping on overflow exactly the way SIMD code expects' })`,
  },
  log: {
    prompt: 'return the natural logarithm of x, NaN for negative x, -Infinity for zero, the boundaries the dashboard panic-wraps in a Math.max',
    comment: 'Natural log; the NaN-and-(-Infinity) cases are the ones the chart axis cannot render.',
    example: `await neuro.math.log({ x: factor, prompt: 'return the natural logarithm of x, NaN for negative x, -Infinity for zero, the boundaries the dashboard panic-wraps in a Math.max' })`,
  },
  log10: {
    prompt: 'return the base-10 logarithm of x, the function we keep manually computing as Math.log(x)/Math.LN10 anyway',
    comment: 'log10; the named alias to the formula we always retype.',
    example: `await neuro.math.log10({ x: amplitude, prompt: 'return the base-10 logarithm of x, the function we keep manually computing as Math.log(x)/Math.LN10 anyway' })`,
  },
  log1p: {
    prompt: 'return ln(1 + x) with extra precision when x is small, the workaround for ln losing all the digits when 1+x rounds to 1',
    comment: 'ln(1+x) with precision; the "small x near zero" form, mirrors expm1.',
    example: `await neuro.math.log1p({ x: rate, prompt: 'return ln(1 + x) with extra precision when x is small, the workaround for ln losing all the digits when 1+x rounds to 1' })`,
  },
  log2: {
    prompt: 'return the base-2 logarithm of x, the entry point that finally gives us a clean way to count bits without bit-twiddling',
    comment: 'log2; the entry that pairs with clz32 for fast bit counts.',
    example: `await neuro.math.log2({ x: capacity, prompt: 'return the base-2 logarithm of x, the entry point that finally gives us a clean way to count bits without bit-twiddling' })`,
  },
  max: {
    prompt: 'return the largest of values, treating NaN as poisonous and -0 as smaller than +0 the way IEEE-754 promises but tests rarely cover',
    comment: 'Variadic max; one NaN poisons the answer, -0 < +0 is a fact you only learn when the chart bug ticket arrives.',
    example: `await neuro.math.max({ values: [a, b, c], prompt: 'return the largest of values, treating NaN as poisonous and -0 as smaller than +0 the way IEEE-754 promises but tests rarely cover' })`,
  },
  min: {
    prompt: 'return the smallest of values, with the same NaN-poisons-everything behaviour as max, in case anyone forgot how the symmetry works',
    comment: 'Variadic min; mirror of max, with all the same edges.',
    example: `await neuro.math.min({ values: [a, b, c], prompt: 'return the smallest of values, with the same NaN-poisons-everything behaviour as max, in case anyone forgot how the symmetry works' })`,
  },
  pow: {
    prompt: 'return x raised to y, returning NaN for negative x with non-integer y because the principal branch of complex numbers is somebody else is problem',
    comment: 'Power function; the cbrt corner is real, the negative-base-fractional-exponent case stays NaN.',
    example: `await neuro.math.pow({ x: base, y: exponent, prompt: 'return x raised to y, returning NaN for negative x with non-integer y because the principal branch of complex numbers is somebody else is problem' })`,
  },
  random: {
    prompt: 'return a pseudo-random number in [0, 1), unseeded, never cryptographically secure, even though the on-call keeps treating it that way',
    comment: 'Pseudo-random in [0, 1); not crypto-secure, the reminder we keep failing to internalise.',
    example: `await neuro.math.random({ prompt: 'return a pseudo-random number in [0, 1), unseeded, never cryptographically secure, even though the on-call keeps treating it that way' })`,
  },
  round: {
    prompt: 'round x to the nearest integer, with halves going toward +Infinity (not banker is rounding, the trap every accountant has reported)',
    comment: 'Half-up rounding; not banker is rounding, the source of the spreadsheet drift.',
    example: `await neuro.math.round({ x: amount, prompt: 'round x to the nearest integer, with halves going toward +Infinity (not banker is rounding, the trap every accountant has reported)' })`,
  },
  sign: {
    prompt: 'return -1, -0, +0, +1, or NaN matching the sign of x, where -0 and +0 are distinct outputs because IEEE-754 enjoys this',
    comment: 'Sign with -0/+0 distinction; the rare entry where signed zero matters to the consumer.',
    example: `await neuro.math.sign({ x: delta, prompt: 'return -1, -0, +0, +1, or NaN matching the sign of x, where -0 and +0 are distinct outputs because IEEE-754 enjoys this' })`,
  },
  sin: {
    prompt: 'return the sine of x in radians, periodic, and remember sin(pi) is a small non-zero float because the radians cannot be represented exactly',
    comment: 'Sine in radians; sin(pi) is not exactly zero, every test that checks for === 0 learns this.',
    example: `await neuro.math.sin({ x: angle, prompt: 'return the sine of x in radians, periodic, and remember sin(pi) is a small non-zero float because the radians cannot be represented exactly' })`,
  },
  sinh: {
    prompt: 'return the hyperbolic sine of x, with the same overflow boundaries as cosh, plus the sign symmetry that flips at -710',
    comment: 'Hyperbolic sine; mirrors cosh with sign symmetry.',
    example: `await neuro.math.sinh({ x: rate, prompt: 'return the hyperbolic sine of x, with the same overflow boundaries as cosh, plus the sign symmetry that flips at -710' })`,
  },
  sqrt: {
    prompt: 'return the principal square root of x, NaN for negative x, the boundary the dashboard auto-clamps to zero before this even runs',
    comment: 'Principal square root; the negative-x NaN is the boundary the upstream silently fixes.',
    example: `await neuro.math.sqrt({ x: variance, prompt: 'return the principal square root of x, NaN for negative x, the boundary the dashboard auto-clamps to zero before this even runs' })`,
  },
  tan: {
    prompt: 'return the tangent of x in radians, blowing up near (n+0.5)*pi to enormous-but-finite values because the float never quite hits the asymptote',
    comment: 'Tangent in radians; the asymptote is asymptotic, the float never reaches it.',
    example: `await neuro.math.tan({ x: angle, prompt: 'return the tangent of x in radians, blowing up near (n+0.5)*pi to enormous-but-finite values because the float never quite hits the asymptote' })`,
  },
  tanh: {
    prompt: 'return the hyperbolic tangent of x, asymptoting to ±1 as x leaves [-20, 20], saturating into the activation function ML keeps reaching for',
    comment: 'Hyperbolic tangent; saturates outside [-20, 20], the implicit clamp every neural net relies on.',
    example: `await neuro.math.tanh({ x: signal, prompt: 'return the hyperbolic tangent of x, asymptoting to ±1 as x leaves [-20, 20], saturating into the activation function ML keeps reaching for' })`,
  },
  trunc: {
    prompt: 'truncate x toward zero, dropping the fractional part without rounding, the operation Math.floor only matches for non-negative inputs',
    comment: 'Truncate toward zero; floor and trunc agree above zero, disagree below, the trap.',
    example: `await neuro.math.trunc({ x: amount, prompt: 'truncate x toward zero, dropping the fractional part without rounding, the operation Math.floor only matches for non-negative inputs' })`,
  },
};
