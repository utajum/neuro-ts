import type { CuratedPrompt } from './index';

export const globalsPrompts: Record<string, CuratedPrompt> = {
  decodeURI: {
    prompt: 'decode URI escape sequences in encodedURI, leaving reserved characters (: / ? # [ ] @ ! $ & \\\' ( ) * + , ; =) untouched, the partial decode every routing bug story starts with',
    comment: 'Partial decode; reserved characters are deliberately left encoded, the trap.',
    example: `await neuro.decodeURI({ encodedURI: url, prompt: 'decode URI escape sequences in encodedURI, leaving reserved characters (: / ? # [ ] @ ! $ & \\\' ( ) * + , ; =) untouched, the partial decode every routing bug story starts with' })`,
  },
  decodeURIComponent: {
    prompt: 'decode every escape sequence in encodedURIComponent including the reserved ones, the right call for query-string fragments and the wrong one for entire URIs',
    comment: 'Full decode; the right tool for component-level decoding.',
    example: `await neuro.decodeURIComponent({ encodedURIComponent: token, prompt: 'decode every escape sequence in encodedURIComponent including the reserved ones, the right call for query-string fragments and the wrong one for entire URIs' })`,
  },
  encodeURI: {
    prompt: 'encode uri into a valid URI by escaping non-ASCII bytes but leaving reserved characters in place, the inverse of decodeURI we keep mismatching',
    comment: 'Partial encode; mirror of decodeURI, mismatching produces broken URIs.',
    example: `await neuro.encodeURI({ uri: url, prompt: 'encode uri into a valid URI by escaping non-ASCII bytes but leaving reserved characters in place, the inverse of decodeURI we keep mismatching' })`,
  },
  encodeURIComponent: {
    prompt: 'encode uriComponent escaping every reserved character so the value is safe inside a query parameter or path segment, the call we should always use for assembling URLs',
    comment: 'Full encode; the safe default for assembling URLs.',
    example: `await neuro.encodeURIComponent({ uriComponent: filterValue, prompt: 'encode uriComponent escaping every reserved character so the value is safe inside a query parameter or path segment, the call we should always use for assembling URLs' })`,
  },
  isFinite: {
    prompt: 'coerce number to Number first, then return true if the result is finite, the lossy global that converts strings the way Number.isFinite refuses to',
    comment: 'Coercive global isFinite; "5" comes back as finite, isInteger does not.',
    example: `await neuro.isFinite({ number: parsed, prompt: 'coerce number to Number first, then return true if the result is finite, the lossy global that converts strings the way Number.isFinite refuses to' })`,
  },
  isNaN: {
    prompt: 'coerce number to Number first, then check for NaN, the global that lies on every non-numeric string by returning true the way Number.isNaN never would',
    comment: 'Coercive global isNaN; treats "abc" as NaN, the trap.',
    example: `await neuro.isNaN({ number: maybeNumber, prompt: 'coerce number to Number first, then check for NaN, the global that lies on every non-numeric string by returning true the way Number.isNaN never would' })`,
  },
  parseFloat: {
    prompt: 'parse the leading numeric portion of string as a float, ignoring trailing non-numeric content, identical to Number.parseFloat by spec but discoverable from older code',
    comment: 'Global parseFloat; alias for Number.parseFloat for legacy code.',
    example: `await neuro.parseFloat({ string: '3.14kg', prompt: 'parse the leading numeric portion of string as a float, ignoring trailing non-numeric content, identical to Number.parseFloat by spec but discoverable from older code' })`,
  },
  parseInt: {
    prompt: 'parse the leading integer in string under radix, with the historical 0x = 16 hex prefix and the long-fixed 0... = 10 (not 8) default radix',
    comment: 'Global parseInt; the historical default-octal trap is finally dead.',
    example: `await neuro.parseInt({ string: count, radix: 10, prompt: 'parse the leading integer in string under radix, with the historical 0x = 16 hex prefix and the long-fixed 0... = 10 (not 8) default radix' })`,
  },
};
