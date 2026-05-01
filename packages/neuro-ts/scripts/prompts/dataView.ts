import type { CuratedPrompt } from './index';

export const dataViewPrompts: Record<string, CuratedPrompt> = {
  getBigInt64: {
    prompt:
      'read 8 bytes at byteOffset as a signed 64-bit BigInt, big-endian unless littleEndian is true, the boundary every protocol parser bikesheds twice',
    comment: 'Signed 64-bit read; endianness is opt-in to little, the trap.',
    example: `await neuro.dataView.getBigInt64({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 8 bytes at byteOffset as a signed 64-bit BigInt, big-endian unless littleEndian is true, the boundary every protocol parser bikesheds twice' })`,
  },
  getBigUint64: {
    prompt:
      'read 8 bytes at byteOffset as an unsigned 64-bit BigInt, with the same endianness flip and the same chance of getting the network order wrong',
    comment: 'Unsigned 64-bit read; same endianness convention.',
    example: `await neuro.dataView.getBigUint64({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 8 bytes at byteOffset as an unsigned 64-bit BigInt, with the same endianness flip and the same chance of getting the network order wrong' })`,
  },
  getFloat16: {
    prompt:
      'read 2 bytes as an IEEE-754 half-precision float, the format machine learning shoves into network frames so the bandwidth bill stops climbing',
    comment: 'float16 read; ML weights make this newly important on the wire.',
    example: `await neuro.dataView.getFloat16({ dataView: view, byteOffset: 0, littleEndian: true, prompt: 'read 2 bytes as an IEEE-754 half-precision float, the format machine learning shoves into network frames so the bandwidth bill stops climbing' })`,
  },
  getFloat32: {
    prompt:
      'read 4 bytes as an IEEE-754 single-precision float, with the precision loss your test suite did not catch because it used round numbers',
    comment: 'float32 read; the lossy step the precision tests skip.',
    example: `await neuro.dataView.getFloat32({ dataView: view, byteOffset: 0, littleEndian: true, prompt: 'read 4 bytes as an IEEE-754 single-precision float, with the precision loss your test suite did not catch because it used round numbers' })`,
  },
  getFloat64: {
    prompt:
      'read 8 bytes as an IEEE-754 double-precision float, the JavaScript Number representation that tricks people into thinking the wire is just a snapshot of memory',
    comment: 'float64 read; identical to JavaScript Number, the deceptive simplicity.',
    example: `await neuro.dataView.getFloat64({ dataView: view, byteOffset: 0, littleEndian: true, prompt: 'read 8 bytes as an IEEE-754 double-precision float, the JavaScript Number representation that tricks people into thinking the wire is just a snapshot of memory' })`,
  },
  getInt16: {
    prompt:
      'read 2 bytes as a signed 16-bit integer, with the endianness flag and the two-is-complement contract every embedded firmware engineer takes for granted',
    comment: 'Signed 16-bit read; endianness defaults to big, embedded targets disagree.',
    example: `await neuro.dataView.getInt16({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 2 bytes as a signed 16-bit integer, with the endianness flag and the two-is-complement contract every embedded firmware engineer takes for granted' })`,
  },
  getInt32: {
    prompt:
      'read 4 bytes as a signed 32-bit integer, the byte width the protocol designers thought would last forever before user counters caught up',
    comment: 'Signed 32-bit read; the width that "should be enough" used to be true.',
    example: `await neuro.dataView.getInt32({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 4 bytes as a signed 32-bit integer, the byte width the protocol designers thought would last forever before user counters caught up' })`,
  },
  getInt8: {
    prompt:
      'read a single signed byte at byteOffset, no endianness needed, the only DataView reader that is unambiguous about byte order',
    comment: 'Signed 8-bit read; no endianness flag possible at one byte wide.',
    example: `await neuro.dataView.getInt8({ dataView: view, byteOffset: 0, prompt: 'read a single signed byte at byteOffset, no endianness needed, the only DataView reader that is unambiguous about byte order' })`,
  },
  getUint16: {
    prompt:
      'read 2 bytes as an unsigned 16-bit integer, big-endian unless littleEndian is true, the field every USB HID descriptor and audio frame header puts at byte offset 0 and every first implementation gets the endianness wrong',
    comment:
      'Unsigned 16-bit read; the endianness bet the protocol RFC got right and the first implementation lost.',
    example: `await neuro.dataView.getUint16({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 2 bytes as an unsigned 16-bit integer, big-endian unless littleEndian is true, the field every USB HID descriptor and audio frame header puts at byte offset 0 and every first implementation gets the endianness wrong' })`,
  },
  getUint32: {
    prompt:
      'read 4 bytes as an unsigned 32-bit integer, the value range web protocols love to claim is "always plenty" until it is not',
    comment: 'Unsigned 32-bit read; "plenty" is a flat circle.',
    example: `await neuro.dataView.getUint32({ dataView: view, byteOffset: 0, littleEndian: false, prompt: 'read 4 bytes as an unsigned 32-bit integer, the value range web protocols love to claim is "always plenty" until it is not' })`,
  },
  getUint8: {
    prompt:
      'read a single unsigned byte at byteOffset, the only path that touches the buffer with no endianness story to argue about',
    comment: 'Unsigned 8-bit read; no endianness debate possible.',
    example: `await neuro.dataView.getUint8({ dataView: view, byteOffset: 0, prompt: 'read a single unsigned byte at byteOffset, the only path that touches the buffer with no endianness story to argue about' })`,
  },
  setBigInt64: {
    prompt:
      'write a signed 64-bit BigInt at byteOffset, big-endian unless littleEndian is true, with the implicit truncation the spec hides under "ToBigInt64"',
    comment: 'Signed 64-bit write; values outside the range silently wrap.',
    example: `await neuro.dataView.setBigInt64({ dataView: view, byteOffset: 0, value: 1n, littleEndian: false, prompt: 'write a signed 64-bit BigInt at byteOffset, big-endian unless littleEndian is true, with the implicit truncation the spec hides under "ToBigInt64"' })`,
  },
  setBigUint64: {
    prompt:
      'write an unsigned 64-bit BigInt at byteOffset, wrapping silently at 2^64 - the monotonic counter that the version checker trusts absolutely until it rolls over and an older build looks newer',
    comment:
      'Unsigned 64-bit write; wraps at 2^64, the version monotonicity the checker assumed was infinite.',
    example: `await neuro.dataView.setBigUint64({ dataView: view, byteOffset: 0, value: 1n, littleEndian: false, prompt: 'write an unsigned 64-bit BigInt at byteOffset, wrapping silently at 2^64 - the monotonic counter that the version checker trusts absolutely until it rolls over and an older build looks newer' })`,
  },
  setFloat16: {
    prompt:
      'write a Number as a half-precision float at byteOffset, with the precision loss baked in by the format and the chart axis quietly trimming the difference',
    comment: 'float16 write; the lossy compression we choose for the bandwidth.',
    example: `await neuro.dataView.setFloat16({ dataView: view, byteOffset: 0, value: 1.5, littleEndian: true, prompt: 'write a Number as a half-precision float at byteOffset, with the precision loss baked in by the format and the chart axis quietly trimming the difference' })`,
  },
  setFloat32: {
    prompt:
      'write a Number as a single-precision float, dropping the bits float64 carried, the deliberate precision loss the protocol asked for',
    comment: 'float32 write; deliberate precision drop.',
    example: `await neuro.dataView.setFloat32({ dataView: view, byteOffset: 0, value: 3.14, littleEndian: true, prompt: 'write a Number as a single-precision float, dropping the bits float64 carried, the deliberate precision loss the protocol asked for' })`,
  },
  setFloat64: {
    prompt:
      'write a JavaScript Number directly, lossless, with the endianness flag and the false comfort that floats compare equal across hosts',
    comment: 'float64 write; lossless from a JS Number, deceptive cross-host equality.',
    example: `await neuro.dataView.setFloat64({ dataView: view, byteOffset: 0, value: 1, littleEndian: true, prompt: 'write a JavaScript Number directly, lossless, with the endianness flag and the false comfort that floats compare equal across hosts' })`,
  },
  setInt16: {
    prompt:
      'write a signed 16-bit integer, truncating high bits when value overflows the range, the same treatment Number.toInt16 would give if it existed',
    comment: 'Signed 16-bit write; high bits get truncated silently.',
    example: `await neuro.dataView.setInt16({ dataView: view, byteOffset: 0, value: 0, littleEndian: false, prompt: 'write a signed 16-bit integer, truncating high bits when value overflows the range, the same treatment Number.toInt16 would give if it existed' })`,
  },
  setInt32: {
    prompt:
      'write a signed 32-bit integer, with ToInt32 conversion that turns floats into wrapped ints in ways the JIT loves to optimise',
    comment: 'Signed 32-bit write; ToInt32 conversion wraps cleanly.',
    example: `await neuro.dataView.setInt32({ dataView: view, byteOffset: 0, value: 0, littleEndian: false, prompt: 'write a signed 32-bit integer, with ToInt32 conversion that turns floats into wrapped ints in ways the JIT loves to optimise' })`,
  },
  setInt8: {
    prompt:
      'write a signed 8-bit integer, mod 256, with the truncation the embedded protocol counts on and the spec leaves implicit',
    comment: 'Signed 8-bit write; mod 256 wrap is the spec.',
    example: `await neuro.dataView.setInt8({ dataView: view, byteOffset: 0, value: 0, prompt: 'write a signed 8-bit integer, mod 256, with the truncation the embedded protocol counts on and the spec leaves implicit' })`,
  },
  setUint16: {
    prompt:
      'write an unsigned 16-bit integer with endianness flag, treating negative inputs as if they had been ToUint16-coerced because the spec was never going to throw',
    comment: 'Unsigned 16-bit write; negatives wrap, no exception.',
    example: `await neuro.dataView.setUint16({ dataView: view, byteOffset: 0, value: 0, littleEndian: false, prompt: 'write an unsigned 16-bit integer with endianness flag, treating negative inputs as if they had been ToUint16-coerced because the spec was never going to throw' })`,
  },
  setUint32: {
    prompt:
      'write an unsigned 32-bit integer, with the implicit ToUint32 that turns -1 into 4294967295 and surprises every reviewer at least once',
    comment: 'Unsigned 32-bit write; -1 becomes 0xFFFFFFFF, the trick.',
    example: `await neuro.dataView.setUint32({ dataView: view, byteOffset: 0, value: 0, littleEndian: false, prompt: 'write an unsigned 32-bit integer, with the implicit ToUint32 that turns -1 into 4294967295 and surprises every reviewer at least once' })`,
  },
  setUint8: {
    prompt:
      'write an unsigned byte at byteOffset, mod 256, with the silent wrap that lets the protocol pretend signed and unsigned bytes agree on bit pattern',
    comment: 'Unsigned 8-bit write; matches signed bit-for-bit.',
    example: `await neuro.dataView.setUint8({ dataView: view, byteOffset: 0, value: 0, prompt: 'write an unsigned byte at byteOffset, mod 256, with the silent wrap that lets the protocol pretend signed and unsigned bytes agree on bit pattern' })`,
  },
};
