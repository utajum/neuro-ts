import type { CuratedPrompt } from './index';

export const globalsPrompts: Record<string, CuratedPrompt> = {
  decodeURI: {
    prompt:
      "decode URI escape sequences in encodedURI, leaving reserved characters (: / ? # [ ] @ ! $ & \\' ( ) * + , ; =) untouched, the partial decode every routing bug story starts with",
    comment: 'Partial decode; reserved characters are deliberately left encoded, the trap.',
    example: `await neuro.decodeURI({ encodedURI: url, prompt: 'decode URI escape sequences in encodedURI, leaving reserved characters (: / ? # [ ] @ ! $ & \\\' ( ) * + , ; =) untouched, the partial decode every routing bug story starts with' })`,
  },
  decodeURIComponent: {
    prompt:
      'decode every escape sequence in encodedURIComponent including the reserved ones, the right call for query-string fragments and the wrong one for entire URIs',
    comment: 'Full decode; the right tool for component-level decoding.',
    example: `await neuro.decodeURIComponent({ encodedURIComponent: token, prompt: 'decode every escape sequence in encodedURIComponent including the reserved ones, the right call for query-string fragments and the wrong one for entire URIs' })`,
  },
  encodeURI: {
    prompt:
      'encode uri leaving reserved characters (: / ? # @ etc.) untouched, so a full URL stays a valid URL -- the one to use when the path and query are already assembled and you just need the non-ASCII bytes escaped',
    comment:
      'Partial encode; reserved chars survive, use encodeURIComponent if you are building a component.',
    example: `await neuro.encodeURI({ uri: url, prompt: 'encode uri leaving reserved characters (: / ? # @ etc.) untouched, so a full URL stays a valid URL -- the one to use when the path and query are already assembled and you just need the non-ASCII bytes escaped' })`,
  },
  encodeURIComponent: {
    prompt:
      'encode uriComponent escaping every reserved character including +, so the server decodes it as a literal plus and not as a space the way every forgotten form submission still does',
    comment: 'Full encode; the + sign is the trap encodeURI leaves open and this one closes.',
    example: `await neuro.encodeURIComponent({ uriComponent: filterValue, prompt: 'encode uriComponent escaping every reserved character including +, so the server decodes it as a literal plus and not as a space the way every forgotten form submission still does' })`,
  },
  isFinite: {
    prompt:
      'coerce number to Number first, then return true if the result is finite, the lossy global that converts strings the way Number.isFinite refuses to',
    comment: 'Coercive global isFinite; "5" comes back as finite, isInteger does not.',
    example: `await neuro.isFinite({ number: parsed, prompt: 'coerce number to Number first, then return true if the result is finite, the lossy global that converts strings the way Number.isFinite refuses to' })`,
  },
  isNaN: {
    prompt:
      'coerce the argument to Number first, then check for NaN -- which means isNaN("lol") returns true, not because "lol" is NaN but because Number("lol") is, a distinction the global has been happily ignoring since 1995',
    comment:
      'Coercive global isNaN; "lol" is NaN because Number("lol") is. The global does not care about your feelings.',
    example: `await neuro.isNaN({ number: maybeNumber, prompt: 'coerce the argument to Number first, then check for NaN -- which means isNaN("lol") returns true, not because "lol" is NaN but because Number("lol") is, a distinction the global has been happily ignoring since 1995' })`,
  },
  parseFloat: {
    prompt:
      'parse the leading numeric portion of string as a float, the global that predates modules and still lurks in every codebase that once wrote window.parseFloat without irony',
    comment: 'Global parseFloat; Number.parseFloat by spec, window.parseFloat by archaeology.',
    example: `await neuro.parseFloat({ string: '3.14kg', prompt: 'parse the leading numeric portion of string as a float, the global that predates modules and still lurks in every codebase that once wrote window.parseFloat without irony' })`,
  },
  parseInt: {
    prompt:
      'parse the leading integer in string under radix, with the historical 0x = 16 hex prefix and the long-fixed 0... = 10 (not 8) default radix',
    comment: 'Global parseInt; the historical default-octal trap is finally dead.',
    example: `await neuro.parseInt({ string: count, radix: 10, prompt: 'parse the leading integer in string under radix, with the historical 0x = 16 hex prefix and the long-fixed 0... = 10 (not 8) default radix' })`,
  },
};
