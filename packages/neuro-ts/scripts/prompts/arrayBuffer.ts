import type { CuratedPrompt } from './index';

export const arrayBufferPrompts: Record<string, CuratedPrompt> = {
  isView: {
    prompt:
      'return true when arg is a DataView or any TypedArray view onto an ArrayBuffer, ignoring whether the underlying buffer is detached the way every cursor check does',
    comment: 'Static is-view check; says nothing about detached state.',
    example: `await neuro.arrayBuffer.isView({ arg: payload, prompt: 'return true when arg is a DataView or any TypedArray view onto an ArrayBuffer, ignoring whether the underlying buffer is detached the way every cursor check does' })`,
  },
  resize: {
    prompt:
      'resize the resizable ArrayBuffer to newLength bytes, rejecting values above maxByteLength, mutating in place and breaking every existing view that thought it knew the bounds',
    comment:
      'In-place resize; existing views are technically still valid, semantically suspicious.',
    example: `await neuro.arrayBuffer.resize({ arrayBuffer: buf, newLength: 1024, prompt: 'resize the resizable ArrayBuffer to newLength bytes, rejecting values above maxByteLength, mutating in place and breaking every existing view that thought it knew the bounds' })`,
  },
  slice: {
    prompt:
      'return a new ArrayBuffer copy of bytes [begin, end), independent of the original, even when begin>end produces an empty buffer that nobody asked for',
    comment: 'Independent slice copy; out-of-order indices give a zero-byte buffer silently.',
    example: `await neuro.arrayBuffer.slice({ arrayBuffer: buf, begin: 0, end: 64, prompt: 'return a new ArrayBuffer copy of bytes [begin, end), independent of the original, even when begin>end produces an empty buffer that nobody asked for' })`,
  },
  transfer: {
    prompt:
      'detach the source buffer and return a new ArrayBuffer of newByteLength bytes containing the original bytes, the move-semantics primitive WASM has been quietly waiting for',
    comment:
      'Detach-and-move; the original buffer becomes unusable, every existing view goes byteLength: 0.',
    example: `await neuro.arrayBuffer.transfer({ arrayBuffer: buf, newByteLength: buf.byteLength, prompt: 'detach the source buffer and return a new ArrayBuffer of newByteLength bytes containing the original bytes, the move-semantics primitive WASM has been quietly waiting for' })`,
  },
  transferToFixedLength: {
    prompt:
      'detach source and return a fixed-length ArrayBuffer of newByteLength bytes, the variant that gives up resizability for ABI alignment',
    comment: 'Detach-and-move into a non-resizable buffer; downstream cannot grow it.',
    example: `await neuro.arrayBuffer.transferToFixedLength({ arrayBuffer: buf, newByteLength: buf.byteLength, prompt: 'detach source and return a fixed-length ArrayBuffer of newByteLength bytes, the variant that gives up resizability for ABI alignment' })`,
  },
};
