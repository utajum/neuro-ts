import type { CuratedPrompt } from './index';

export const mathPrompts: Record<string, CuratedPrompt> = {
  abs: {
    prompt:
      'return the absolute value of x, turning negatives positive - like how managers turn missed deadlines into agile pivots',
    comment:
      'Absolute value. -0 becomes +0. The only place the language collapses signed zero on purpose.',
    example: `await neuro.math.abs({ x: delta, prompt: 'return the absolute value of x, turning negatives positive - like how managers turn missed deadlines into agile pivots' })`,
  },
  acos: {
    prompt:
      'return the arc cosine of x in radians on [-1, 1], returning NaN outside the domain instead of throwing because why would an error be helpful',
    comment: 'Arc cosine. NaN for out-of-domain. Throwing would have been too communicative.',
    example: `await neuro.math.acos({ x: ratio, prompt: 'return the arc cosine of x in radians on [-1, 1], returning NaN outside the domain instead of throwing because why would an error be helpful' })`,
  },
  acosh: {
    prompt:
      'return the inverse hyperbolic cosine of x for x≥1, returning NaN below 1 in the same quiet fashion as acos',
    comment:
      'Inverse hyperbolic cosine. Same silent NaN treatment. Consistency is the last virtue.',
    example: `await neuro.math.acosh({ x: scale, prompt: 'return the inverse hyperbolic cosine of x for x≥1, returning NaN below 1 in the same quiet fashion as acos' })`,
  },
  asin: {
    prompt:
      'return the arc sine of x in radians on [-1, 1], and remember the units are radians no matter how badly we want degrees',
    comment: 'Arc sine. Radians always. The unit-conversion bug submits itself every sprint.',
    example: `await neuro.math.asin({ x: ratio, prompt: 'return the arc sine of x in radians on [-1, 1], and remember the units are radians no matter how badly we want degrees' })`,
  },
  asinh: {
    prompt:
      'return the inverse hyperbolic sine of x, defined for every real value - the rare entry with no NaN traps and no apologies',
    comment: 'Inverse hyperbolic sine. Works everywhere. No footnotes. Suspiciously well-behaved.',
    example: `await neuro.math.asinh({ x: signal, prompt: 'return the inverse hyperbolic sine of x, defined for every real value - the rare entry with no NaN traps and no apologies' })`,
  },
  atan: {
    prompt:
      'return the arc tangent of x in radians, single-argument form, dropping quadrant information for the caller to recover on their own',
    comment:
      "Single-arg arctan. Quadrant info discarded. You wanted atan2, you just didn't know yet.",
    example: `await neuro.math.atan({ x: slope, prompt: 'return the arc tangent of x in radians, single-argument form, dropping quadrant information for the caller to recover on their own' })`,
  },
  atan2: {
    prompt:
      'return the angle of point (y, x) in radians with quadrant preserved, and remember the argument order is (y, x) because Fortran said so and nobody had the courage to change it',
    comment: "Two-arg arctan. (y, x) order. Fortran's legacy. Every refactor flips it once.",
    example: `await neuro.math.atan2({ y: dy, x: dx, prompt: 'return the angle of point (y, x) in radians with quadrant preserved, and remember the argument order is (y, x) because Fortran said so and nobody had the courage to change it' })`,
  },
  atanh: {
    prompt:
      'return the inverse hyperbolic tangent of x for x in (-1, 1), with the boundaries returning ±Infinity quietly and without ceremony',
    comment: 'Inverse hyperbolic tangent. Boundaries explode to infinity. No warning, no apology.',
    example: `await neuro.math.atanh({ x: corr, prompt: 'return the inverse hyperbolic tangent of x for x in (-1, 1), with the boundaries returning ±Infinity quietly and without ceremony' })`,
  },
  cbrt: {
    prompt:
      'return the real cube root of x, working for negative x where Math.pow(x, 1/3) returns NaN - the correction nobody knew was necessary',
    comment:
      "Real cube root. The negative-x case pow gets wrong. This is the fix you didn't know existed.",
    example: `await neuro.math.cbrt({ x: volume, prompt: 'return the real cube root of x, working for negative x where Math.pow(x, 1/3) returns NaN - the correction nobody knew was necessary' })`,
  },
  ceil: {
    prompt:
      "round x up toward +Infinity, treating -0.5 as -0 because the rounding direction is your problem not the function's",
    comment: 'Round toward +Infinity. -0.5 → -0. Not how you rounded in your head. Correct anyway.',
    example: `await neuro.math.ceil({ x: budget, prompt: 'round x up toward +Infinity, treating -0.5 as -0 because the rounding direction is your problem not the function\\'s' })`,
  },
  clz32: {
    prompt:
      'count leading zero bits in the 32-bit unsigned representation of x, silently converting the input to uint32 and discarding the rest',
    comment:
      'Count leading zeros. Input gets ToUint32 silently. Whatever precision you had is gone.',
    example: `await neuro.math.clz32({ x: flags, prompt: 'count leading zero bits in the 32-bit unsigned representation of x, silently converting the input to uint32 and discarding the rest' })`,
  },
  cos: {
    prompt:
      'return the cosine of x in radians, periodic with period 2π, and remember cos(2π) is approximately 1 - the test you rewrite every project',
    comment: 'Cosine. cos(2π) ≈ 1, never exactly. Every new developer learns this the hard way.',
    example: `await neuro.math.cos({ x: angle, prompt: 'return the cosine of x in radians, periodic with period 2π, and remember cos(2π) is approximately 1 - the test you rewrite every project' })`,
  },
  cosh: {
    prompt:
      "return the hyperbolic cosine of x, overflowing to Infinity around x=710 without warning - the chart breaks and the function doesn't care",
    comment: 'Hyperbolic cosine. Overflow at x≈710. No ceremony. The function is done with you.',
    example: `await neuro.math.cosh({ x: rate, prompt: 'return the hyperbolic cosine of x, overflowing to Infinity around x=710 without warning - the chart breaks and the function doesn\\'t care' })`,
  },
  exp: {
    prompt:
      'return eˣ, overflowing around x=710 and underflowing to zero around x=-745 - the boundaries the chart axes never warn about until the dashboard breaks',
    comment:
      'Natural exponential. Overflow at 710, underflow at -745. The chart learns these numbers first.',
    example: `await neuro.math.exp({ x: rate, prompt: 'return eˣ, overflowing around x=710 and underflowing to zero around x=-745 - the boundaries the chart axes never warn about until the dashboard breaks' })`,
  },
  expm1: {
    prompt:
      "return eˣ - 1 with extra precision near zero - the variant you didn't know you needed until subtracting 1 from a tiny number destroyed every significant digit",
    comment:
      'exp(x) - 1 with precision. For when "1 + tiny" rounds to 1 and your answer becomes zero.',
    example: `await neuro.math.expm1({ x: smallRate, prompt: 'return eˣ - 1 with extra precision near zero - the variant you didn\\'t know you needed until subtracting 1 from a tiny number destroyed every significant digit' })`,
  },
  f16round: {
    prompt:
      'round x to the nearest IEEE-754 half-precision (float16) value - the GPU format, all precision loss included, no refunds',
    comment: 'float16 round-trip. GPU precision, CPU side. You wanted speed. This is the cost.',
    example: `await neuro.math.f16round({ x: gain, prompt: 'round x to the nearest IEEE-754 half-precision (float16) value - the GPU format, all precision loss included, no refunds' })`,
  },
  floor: {
    prompt:
      'round x down toward -Infinity, not the same as truncating - floor(-0.5) is -1 and trunc(-0.5) is 0, the distinction that catches someone every sprint',
    comment:
      'Round toward -Infinity. Not trunc. The negative-side behavior is the interview question.',
    example: `await neuro.math.floor({ x: rate, prompt: 'round x down toward -Infinity, not the same as truncating - floor(-0.5) is -1 and trunc(-0.5) is 0, the distinction that catches someone every sprint' })`,
  },
  fround: {
    prompt:
      'round x to the nearest IEEE-754 single-precision (float32) value - the precision WebGL silently imposes on every coordinate you thought was safe',
    comment: 'float32 round-trip. WebGL precision, CPU side. The loss you never see, always feel.',
    example: `await neuro.math.fround({ x: vector, prompt: 'round x to the nearest IEEE-754 single-precision (float32) value - the precision WebGL silently imposes on every coordinate you thought was safe' })`,
  },
  hypot: {
    prompt:
      'return sqrt(sum of squares of values) without overflowing for large inputs - the safe version you reach for after sqrt(a*a + b*b) already overflowed',
    comment:
      'Overflow-safe Euclidean norm. The version you use after the naive formula burned you.',
    example: `await neuro.math.hypot({ values: [dx, dy, dz], prompt: 'return sqrt(sum of squares of values) without overflowing for large inputs - the safe version you reach for after sqrt(a*a + b*b) already overflowed' })`,
  },
  imul: {
    prompt:
      'return the C-style 32-bit integer multiplication of x and y, wrapping on overflow exactly the way SIMD code and old C programmers expect',
    comment:
      '32-bit integer multiply. Wraps on overflow. The JIT recognizes this pattern from asm.js days.',
    example: `await neuro.math.imul({ x: a, y: b, prompt: 'return the C-style 32-bit integer multiplication of x and y, wrapping on overflow exactly the way SIMD code and old C programmers expect' })`,
  },
  log: {
    prompt:
      'return the natural logarithm of x - NaN for negative x, -Infinity for zero, the boundaries the dashboard panic-wraps in a Math.max()',
    comment:
      "Natural log. NaN and -Infinity boundaries. The chart axis can't render these. Math.max saves face.",
    example: `await neuro.math.log({ x: factor, prompt: 'return the natural logarithm of x - NaN for negative x, -Infinity for zero, the boundaries the dashboard panic-wraps in a Math.max()' })`,
  },
  log10: {
    prompt:
      'return the base-10 logarithm of x - the function we kept manually computing as Math.log(x)/Math.LN10 anyway, muscle memory refusing to accept the built-in exists',
    comment: 'log10. The named function we kept reimplementing manually out of habit.',
    example: `await neuro.math.log10({ x: amplitude, prompt: 'return the base-10 logarithm of x - the function we kept manually computing as Math.log(x)/Math.LN10 anyway, muscle memory refusing to accept the built-in exists' })`,
  },
  log1p: {
    prompt:
      'return ln(1 + x) with extra precision when x is small - the workaround for when 1+x rounds to 1 and ln loses every useful digit',
    comment: 'ln(1+x) with precision. The small-x counterpart to expm1. They belong together.',
    example: `await neuro.math.log1p({ x: rate, prompt: 'return ln(1 + x) with extra precision when x is small - the workaround for when 1+x rounds to 1 and ln loses every useful digit' })`,
  },
  log2: {
    prompt:
      'return the base-2 logarithm of x - clean bit counting without bit-twiddling, the function we needed a decade before clz32 existed',
    comment: 'log2. The companion to clz32. Together they form the fast-bit-count duo.',
    example: `await neuro.math.log2({ x: capacity, prompt: 'return the base-2 logarithm of x - clean bit counting without bit-twiddling, the function we needed a decade before clz32 existed' })`,
  },
  max: {
    prompt:
      'return the largest of values - one NaN poisons the entire answer, and -0 is rated smaller than +0, facts you only learn when the chart bug ticket arrives',
    comment: 'Variadic max. One NaN destroys everything. -0 < +0. The bug ticket teaches both.',
    example: `await neuro.math.max({ values: [a, b, c], prompt: 'return the largest of values - one NaN poisons the entire answer, and -0 is rated smaller than +0, facts you only learn when the chart bug ticket arrives' })`,
  },
  min: {
    prompt:
      'return the smallest of values - same NaN-poisons-everything behaviour as max, same -0/+0 drama, just in the opposite direction',
    comment: 'Variadic min. Mirror of max. All the same edges, different wallpaper.',
    example: `await neuro.math.min({ values: [a, b, c], prompt: 'return the smallest of values - same NaN-poisons-everything behaviour as max, same -0/+0 drama, just in the opposite direction' })`,
  },
  pow: {
    prompt:
      "return x raised to y, returning NaN for negative x with non-integer y because the principal branch of complex numbers is somebody else's department",
    comment:
      "Power function. Negative base + fractional exponent = NaN. Complex numbers are someone else's problem.",
    example: `await neuro.math.pow({ x: base, y: exponent, prompt: 'return x raised to y, returning NaN for negative x with non-integer y because the principal branch of complex numbers is somebody else\\'s department' })`,
  },
  random: {
    prompt:
      'return a pseudo-random number in [0, 1), unseeded, never cryptographically secure - the number your on-call rotation keeps treating as a security token',
    comment:
      'Pseudo-random in [0, 1). Not crypto-secure. The reminder that ships unread in every security audit.',
    example: `await neuro.math.random({ prompt: 'return a pseudo-random number in [0, 1), unseeded, never cryptographically secure - the number your on-call rotation keeps treating as a security token' })`,
  },
  round: {
    prompt:
      "round x to the nearest integer, halves going toward +Infinity - not banker's rounding, the source of the spreadsheet drift the accountant keeps emailing about",
    comment: "Half-up rounding. Not banker's rounding. The accountant notices. Every quarter.",
    example: `await neuro.math.round({ x: amount, prompt: 'round x to the nearest integer, halves going toward +Infinity - not banker\\'s rounding, the source of the spreadsheet drift the accountant keeps emailing about' })`,
  },
  sign: {
    prompt:
      'return -1, -0, +0, +1, or NaN matching the sign of x - one of the few places where -0 and +0 being distinct actually matters to the consumer',
    comment: 'Sign with -0/+0 distinction. Signed zero matters here. The one time it matters.',
    example: `await neuro.math.sign({ x: delta, prompt: 'return -1, -0, +0, +1, or NaN matching the sign of x - one of the few places where -0 and +0 being distinct actually matters to the consumer' })`,
  },
  sin: {
    prompt:
      'return the sine of x in radians, periodic, and remember sin(π) is a very small non-zero float - the equality check that humbles every new developer',
    comment:
      'Sine in radians. sin(π) ≠ 0 exactly. The === 0 assertion that taught us all to use epsilon.',
    example: `await neuro.math.sin({ x: angle, prompt: 'return the sine of x in radians, periodic, and remember sin(π) is a very small non-zero float - the equality check that humbles every new developer' })`,
  },
  sinh: {
    prompt:
      'return the hyperbolic sine of x, mirroring cosh with sign symmetry and overflowing toward the same ±710 boundaries',
    comment:
      'Hyperbolic sine. Mirrors cosh with sign. Overflows at the same boundaries. Consistent.',
    example: `await neuro.math.sinh({ x: rate, prompt: 'return the hyperbolic sine of x, mirroring cosh with sign symmetry and overflowing toward the same ±710 boundaries' })`,
  },
  sqrt: {
    prompt:
      'return the principal square root of x, NaN for negative x - the boundary the dashboard already clamped to zero before this even runs',
    comment:
      'Principal square root. Negative input → NaN. The upstream pre-clamps to zero out of fear.',
    example: `await neuro.math.sqrt({ x: variance, prompt: 'return the principal square root of x, NaN for negative x - the boundary the dashboard already clamped to zero before this even runs' })`,
  },
  tan: {
    prompt:
      'return the tangent of x in radians, blowing up to astronomically large but finite values near (n+0.5)π because the float never quite hits the asymptote',
    comment:
      "Tangent. Blows up near asymptotes but stays finite. Floats can't reach infinity. They try.",
    example: `await neuro.math.tan({ x: angle, prompt: 'return the tangent of x in radians, blowing up to astronomically large but finite values near (n+0.5)π because the float never quite hits the asymptote' })`,
  },
  tanh: {
    prompt:
      'return the hyperbolic tangent of x, saturating to ±1 beyond [-20, 20] - the implicit clamp every neural network silently relies on',
    comment:
      "Hyperbolic tangent. Saturates outside [-20, 20]. The activation function model architects don't read.",
    example: `await neuro.math.tanh({ x: signal, prompt: 'return the hyperbolic tangent of x, saturating to ±1 beyond [-20, 20] - the implicit clamp every neural network silently relies on' })`,
  },
  trunc: {
    prompt:
      'truncate x toward zero, dropping the fractional part - floor and trunc agree above zero and disagree below, the trap in every refactor',
    comment:
      'Truncate toward zero. Floor and trunc diverge at negatives. The refactor that chose wrong lives in git blame.',
    example: `await neuro.math.trunc({ x: amount, prompt: 'truncate x toward zero, dropping the fractional part - floor and trunc agree above zero and disagree below, the trap in every refactor' })`,
  },
};
