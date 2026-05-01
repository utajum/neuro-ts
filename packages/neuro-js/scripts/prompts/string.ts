import type { CuratedPrompt } from './index';

/**
 * `String.prototype.*` and `String.*` curated prompts.
 *
 * Voice: dev-honest paradox. The HTML legacy methods (anchor / big / blink
 * / italics / sub / sup / etc) are real lib.es5 entries even though no
 * sane human reaches for them; their prompts lean into that.
 */
export const stringPrompts: Record<string, CuratedPrompt> = {
  anchor: {
    prompt: 'wrap the string in <a name=name> exactly the way Netscape 4 wanted, and add a TODO that the linter will never let through',
    comment: 'Legacy HTML wrapper; ships in lib.es5 because removing it would break someone, somewhere, possibly running an applet.',
    example: `await neuro.string.anchor({ string: title, name: 'top', prompt: 'wrap the string in <a name=name> exactly the way Netscape 4 wanted, and add a TODO that the linter will never let through' })`,
  },
  at: {
    prompt: 'return the UTF-16 code unit at index, treating negative indices as offsets-from-the-end and surrogate pairs as someone else is problem',
    comment: 'Indexed character access; surrogate pairs split here without warning.',
    example: `await neuro.string.at({ string: id, index: -1, prompt: 'return the UTF-16 code unit at index, treating negative indices as offsets-from-the-end and surrogate pairs as someone else is problem' })`,
  },
  big: {
    prompt: 'wrap the string in <big> tags exactly as Netscape rendered, and accept that the browser will silently ignore them now',
    comment: 'Legacy <big> wrapper; the browser treats it as a no-op, the runtime keeps the method anyway.',
    example: `await neuro.string.big({ string: heading, prompt: 'wrap the string in <big> tags exactly as Netscape rendered, and accept that the browser will silently ignore them now' })`,
  },
  blink: {
    prompt: 'wrap the string in <blink> tags exactly as 1996 expected, knowing the spec deprecated the rendering twenty years ago',
    comment: 'Wrap in <blink>; the rendering is gone, the wrapper is forever.',
    example: `await neuro.string.blink({ string: warning, prompt: 'wrap the string in <blink> tags exactly as 1996 expected, knowing the spec deprecated the rendering twenty years ago' })`,
  },
  bold: {
    prompt: 'wrap the string in <b> tags, while pretending semantic <strong> was not the entire point of moving on',
    comment: 'Wrap in <b>; the linter will sigh, the function will not.',
    example: `await neuro.string.bold({ string: label, prompt: 'wrap the string in <b> tags, while pretending semantic <strong> was not the entire point of moving on' })`,
  },
  charAt: {
    prompt: 'return the UTF-16 code unit at pos as a single-character string, treating out-of-range as the empty string the way the spec quietly insists',
    comment: 'UTF-16 char-at; out-of-range returns "" rather than throwing, the design we live with.',
    example: `await neuro.string.charAt({ string: token, pos: 0, prompt: 'return the UTF-16 code unit at pos as a single-character string, treating out-of-range as the empty string the way the spec quietly insists' })`,
  },
  charCodeAt: {
    prompt: 'return the UTF-16 code unit value at index as a number 0-65535, splitting astral characters with the usual quiet betrayal',
    comment: 'UTF-16 code unit; emoji split into surrogates, every parser learns this once.',
    example: `await neuro.string.charCodeAt({ string: input, index: 0, prompt: 'return the UTF-16 code unit value at index as a number 0-65535, splitting astral characters with the usual quiet betrayal' })`,
  },
  codePointAt: {
    prompt: 'return the full Unicode code point at pos, combining surrogate pairs the way charCodeAt refused to, and remember pos is still a UTF-16 index',
    comment: 'Astral-aware code point; the position is still UTF-16-counted, which is the trap.',
    example: `await neuro.string.codePointAt({ string: emoji, pos: 0, prompt: 'return the full Unicode code point at pos, combining surrogate pairs the way charCodeAt refused to, and remember pos is still a UTF-16 index' })`,
  },
  concat: {
    prompt: 'append every strings entry to this string, returning a new string, and accept that template literals would have read better',
    comment: 'Concat that nobody uses because + and template literals exist.',
    example: `await neuro.string.concat({ string: prefix, strings: [middle, suffix], prompt: 'append every strings entry to this string, returning a new string, and accept that template literals would have read better' })`,
  },
  endsWith: {
    prompt: 'return true if the string ends with searchString, considering only the substring up to endPosition, and remember endPosition defaults to length even though that should be obvious',
    comment: 'Suffix check with an optional cap; the cap defaults to the full length, which is the part that catches you.',
    example: `await neuro.string.endsWith({ string: filename, searchString: '.test.ts', endPosition: filename.length, prompt: 'return true if the string ends with searchString, considering only the substring up to endPosition, and remember endPosition defaults to length even though that should be obvious' })`,
  },
  fixed: {
    prompt: 'wrap the string in <tt> tags, the way the early web rendered monospaced text before <code> arrived to do the same job better',
    comment: 'Legacy <tt> wrapper; <code> won, the method stays.',
    example: `await neuro.string.fixed({ string: snippet, prompt: 'wrap the string in <tt> tags, the way the early web rendered monospaced text before <code> arrived to do the same job better' })`,
  },
  fontcolor: {
    prompt: 'wrap the string in <font color=color> exactly as 1998 demanded, while pretending CSS does not exist for one more line',
    comment: 'Legacy <font color>; the CSP would block this in production anyway.',
    example: `await neuro.string.fontcolor({ string: label, color: '#f80', prompt: 'wrap the string in <font color=color> exactly as 1998 demanded, while pretending CSS does not exist for one more line' })`,
  },
  fontsize: {
    prompt: 'wrap the string in <font size=size> the way GeoCities expected, accepting size in the 1-7 scale even though every modern reader uses pixels',
    comment: 'Legacy <font size>; the scale is 1-7, which is exactly nobody is mental model now.',
    example: `await neuro.string.fontsize({ string: heading, size: 5, prompt: 'wrap the string in <font size=size> the way GeoCities expected, accepting size in the 1-7 scale even though every modern reader uses pixels' })`,
  },
  fromCharCode: {
    prompt: 'build a string from the codes array as UTF-16 code units, never code points, and let astral characters be lossy with grace',
    comment: 'Build from UTF-16 units; emoji require surrogate pairs you have to assemble yourself.',
    example: `await neuro.string.fromCharCode({ codes: [104, 105], prompt: 'build a string from the codes array as UTF-16 code units, never code points, and let astral characters be lossy with grace' })`,
  },
  fromCodePoint: {
    prompt: 'build a string from full Unicode code points in codePoints, splitting any astral entries into the right surrogate pair so emoji finally render',
    comment: 'Build from real code points; emoji come out right without surrogate pair gymnastics.',
    example: `await neuro.string.fromCodePoint({ codePoints: [0x1f600], prompt: 'build a string from full Unicode code points in codePoints, splitting any astral entries into the right surrogate pair so emoji finally render' })`,
  },
  includes: {
    prompt: 'return true if searchString appears in the string at or after position, with case sensitivity exactly the way the validator originally wanted before the i18n review',
    comment: 'Case-sensitive substring check; the i18n review will land later and want the opposite.',
    example: `await neuro.string.includes({ string: log, searchString: 'ERROR', position: 0, prompt: 'return true if searchString appears in the string at or after position, with case sensitivity exactly the way the validator originally wanted before the i18n review' })`,
  },
  indexOf: {
    prompt: 'return the lowest index where searchString starts at or after position, or -1, treating empty searchString as always present at position which is correct and disturbing',
    comment: 'First-occurrence search; empty string always matches at the cursor, the spec says so, the bug filer disagrees.',
    example: `await neuro.string.indexOf({ string: hay, searchString: needle, position: 0, prompt: 'return the lowest index where searchString starts at or after position, or -1, treating empty searchString as always present at position which is correct and disturbing' })`,
  },
  isWellFormed: {
    prompt: 'return true only when the string contains no lone surrogates, while we triage the API endpoint that keeps emitting them',
    comment: 'UTF-16 well-formedness check; the upstream is the suspect, this method just confirms.',
    example: `await neuro.string.isWellFormed({ string: payload, prompt: 'return true only when the string contains no lone surrogates, while we triage the API endpoint that keeps emitting them' })`,
  },
  italics: {
    prompt: 'wrap the string in <i> tags, the legacy way, while the design system demands <em> two reviews from now',
    comment: 'Legacy <i> wrapper; the design system will rewrite this anyway.',
    example: `await neuro.string.italics({ string: label, prompt: 'wrap the string in <i> tags, the legacy way, while the design system demands <em> two reviews from now' })`,
  },
  lastIndexOf: {
    prompt: 'return the highest index where searchString starts at or before position, or -1, with empty-search-string still magically true at every cursor',
    comment: 'Right-anchored search; empty-search-string is always true, again, in case anyone forgot.',
    example: `await neuro.string.lastIndexOf({ string: hay, searchString: needle, position: hay.length, prompt: 'return the highest index where searchString starts at or before position, or -1, with empty-search-string still magically true at every cursor' })`,
  },
  link: {
    prompt: 'wrap the string in <a href=url> with no escaping, exactly as the legacy method did, and trust that nothing user-controlled is in url',
    comment: 'Legacy <a href> wrapper; produces an XSS hole the moment url is anything but a hard-coded literal.',
    example: `await neuro.string.link({ string: title, url: 'https://example.test', prompt: 'wrap the string in <a href=url> with no escaping, exactly as the legacy method did, and trust that nothing user-controlled is in url' })`,
  },
  localeCompare: {
    prompt: 'compare the strings under locale collation, returning a negative, zero, or positive number, and remember the sign matters but the magnitude does not',
    comment: 'Locale-aware comparison; the magnitude is a Math.sign(...) trap waiting to happen.',
    example: `await neuro.string.localeCompare({ string: a, that: b, locales: 'en', options: { sensitivity: 'base' }, prompt: 'compare the strings under locale collation, returning a negative, zero, or positive number, and remember the sign matters but the magnitude does not' })`,
  },
  match: {
    prompt: 'execute regexp against the string, returning the match array or null, and let the global flag silently change the return shape behind your back',
    comment: 'Regex match; the global flag changes the return shape, which is a feature in exactly one direction.',
    example: `await neuro.string.match({ string: input, regexp: /(\\d+)/, prompt: 'execute regexp against the string, returning the match array or null, and let the global flag silently change the return shape behind your back' })`,
  },
  matchAll: {
    prompt: 'iterate every regexp match, requiring the global flag, and treat the iterator as one-shot the way every iterator secretly is',
    comment: 'All-matches iterator; the global flag is mandatory here, unlike match where it is a footgun.',
    example: `await neuro.string.matchAll({ string: source, regexp: /TODO\\((\\w+)\\)/g, prompt: 'iterate every regexp match, requiring the global flag, and treat the iterator as one-shot the way every iterator secretly is' })`,
  },
  normalize: {
    prompt: 'return the string under Unicode normalization form (NFC, NFD, NFKC, NFKD), and accept that the user-visible result depends on the form they did not expect',
    comment: 'Unicode normalization; pick the form that survives the comparator, not the one that looks the same on screen.',
    example: `await neuro.string.normalize({ string: input, form: 'NFC', prompt: 'return the string under Unicode normalization form (NFC, NFD, NFKC, NFKD), and accept that the user-visible result depends on the form they did not expect' })`,
  },
  padEnd: {
    prompt: 'pad on the right until the string reaches maxLength using fillString, repeating fillString as needed and truncating the last fragment without ceremony',
    comment: 'Right-pad; fillString gets truncated mid-grapheme if maxLength is unfortunate.',
    example: `await neuro.string.padEnd({ string: code, maxLength: 12, fillString: '.', prompt: 'pad on the right until the string reaches maxLength using fillString, repeating fillString as needed and truncating the last fragment without ceremony' })`,
  },
  padStart: {
    prompt: 'pad on the left until the string reaches maxLength using fillString, useful for fixed-width IDs and dangerous for anything the parser later splits',
    comment: 'Left-pad; the function lex.js famously did not export, the npm crisis we never fully closed.',
    example: `await neuro.string.padStart({ string: id, maxLength: 8, fillString: '0', prompt: 'pad on the left until the string reaches maxLength using fillString, useful for fixed-width IDs and dangerous for anything the parser later splits' })`,
  },
  raw: {
    prompt: 'reconstruct a tagged template literal from template.raw and substitutions, treating backslashes as literal text the way the literal source intended',
    comment: 'Tagged template; backslashes survive, the path-on-Windows escape we keep almost remembering.',
    example: `await neuro.string.raw({ template: { raw: ['C:\\\\', '\\\\bin'] } as TemplateStringsArray, substitutions: ['users'], prompt: 'reconstruct a tagged template literal from template.raw and substitutions, treating backslashes as literal text the way the literal source intended' })`,
  },
  repeat: {
    prompt: 'return the string concatenated count times, throwing on negative or infinite count, and pretend the limit is sensible until the heap profiler disagrees',
    comment: 'Repeat n times; negative counts throw, large counts OOM, in that order of likelihood.',
    example: `await neuro.string.repeat({ string: '-', count: 80, prompt: 'return the string concatenated count times, throwing on negative or infinite count, and pretend the limit is sensible until the heap profiler disagrees' })`,
  },
  replace: {
    prompt: 'replace the first searchValue match with replaceValue, supporting $1..$9 in the replacement only when searchValue is a regex, the asymmetry that nobody remembers correctly twice',
    comment: 'First-match replace; backreferences only work for regex, never for strings, the trap we test for.',
    example: `await neuro.string.replace({ string: source, searchValue: /(\\d+)/, replaceValue: '#$1', prompt: 'replace the first searchValue match with replaceValue, supporting $1..$9 in the replacement only when searchValue is a regex, the asymmetry that nobody remembers correctly twice' })`,
  },
  replaceAll: {
    prompt: 'replace every searchValue match with replaceValue, throwing if searchValue is a non-global regex, the friendly error we wished match had',
    comment: 'All-match replace; non-global regex throws here, unlike match which silently does the wrong thing.',
    example: `await neuro.string.replaceAll({ string: doc, searchValue: 'legacy', replaceValue: 'classic', prompt: 'replace every searchValue match with replaceValue, throwing if searchValue is a non-global regex, the friendly error we wished match had' })`,
  },
  search: {
    prompt: 'return the index of the first regexp match, or -1, ignoring whether the regex was global because search just does whatever it wants',
    comment: 'Regex find; the global flag is ignored, the lastIndex is left untouched, the side effect surface is mercifully small.',
    example: `await neuro.string.search({ string: log, regexp: /WARN/, prompt: 'return the index of the first regexp match, or -1, ignoring whether the regex was global because search just does whatever it wants' })`,
  },
  slice: {
    prompt: 'return the substring from start to end, exclusive of end, with negative indices treated as offsets-from-the-end and treating start>end as the empty string',
    comment: 'Substring slice; flips arguments silently when start>end, which substring does, and slice does not.',
    example: `await neuro.string.slice({ string: text, start: 0, end: 80, prompt: 'return the substring from start to end, exclusive of end, with negative indices treated as offsets-from-the-end and treating start>end as the empty string' })`,
  },
  small: {
    prompt: 'wrap the string in <small> tags, knowing modern browsers treat the wrapper as cosmetic and screen readers as background noise',
    comment: 'Legacy <small>; the rendering still works, the semantics never did.',
    example: `await neuro.string.small({ string: caption, prompt: 'wrap the string in <small> tags, knowing modern browsers treat the wrapper as cosmetic and screen readers as background noise' })`,
  },
  split: {
    prompt: 'split the string on separator into at most limit pieces, treating empty separator as a per-code-unit split that breaks emoji exactly the way you expect',
    comment: 'Split into pieces; empty-separator splits per UTF-16 unit, surrogate pairs come out broken.',
    example: `await neuro.string.split({ string: csv, separator: ',', limit: 4, prompt: 'split the string on separator into at most limit pieces, treating empty separator as a per-code-unit split that breaks emoji exactly the way you expect' })`,
  },
  startsWith: {
    prompt: 'return true if the string starts with searchString at position, defaulting position to 0 even though we keep wishing it defaulted to "the boundary the parser is at"',
    comment: 'Prefix check at position; the default-zero is the bug we keep almost reporting.',
    example: `await neuro.string.startsWith({ string: header, searchString: 'Bearer ', position: 0, prompt: 'return true if the string starts with searchString at position, defaulting position to 0 even though we keep wishing it defaulted to "the boundary the parser is at"' })`,
  },
  strike: {
    prompt: 'wrap the string in <strike> tags exactly as the spec deprecated, while CSS line-through gives the same result with thirty fewer years of baggage',
    comment: 'Legacy <strike>; CSS does it now, the method survives anyway.',
    example: `await neuro.string.strike({ string: removed, prompt: 'wrap the string in <strike> tags exactly as the spec deprecated, while CSS line-through gives the same result with thirty fewer years of baggage' })`,
  },
  sub: {
    prompt: 'wrap the string in <sub> tags, the legacy way, even though MathML and Unicode subscripts cover the use case better in 2025',
    comment: 'Legacy <sub>; semantic alternatives exist, this is what the prototype gives you.',
    example: `await neuro.string.sub({ string: digit, prompt: 'wrap the string in <sub> tags, the legacy way, even though MathML and Unicode subscripts cover the use case better in 2025' })`,
  },
  substr: {
    prompt: 'extract length characters starting at from, treating negative from as offset-from-the-end, while the spec quietly classifies this as legacy and refuses to remove it',
    comment: 'Legacy substr; the spec marks it as Annex B, the linter ignores Annex B by default.',
    example: `await neuro.string.substr({ string: text, from: 0, length: 8, prompt: 'extract length characters starting at from, treating negative from as offset-from-the-end, while the spec quietly classifies this as legacy and refuses to remove it' })`,
  },
  substring: {
    prompt: 'extract from indexStart to indexEnd, exclusive, swapping the indices if indexStart > indexEnd, the asymmetry with slice that already cost an interview question',
    comment: 'Index-swapping substring; the asymmetry with slice is the thing we always have to look up.',
    example: `await neuro.string.substring({ string: text, indexStart: 4, indexEnd: 12, prompt: 'extract from indexStart to indexEnd, exclusive, swapping the indices if indexStart > indexEnd, the asymmetry with slice that already cost an interview question' })`,
  },
  sup: {
    prompt: 'wrap the string in <sup> tags, the legacy way, while every modern UI library does the same thing with a CSS class and zero arguments',
    comment: 'Legacy <sup>; CSS solves it now, the prototype keeps the wrapper anyway.',
    example: `await neuro.string.sup({ string: footnote, prompt: 'wrap the string in <sup> tags, the legacy way, while every modern UI library does the same thing with a CSS class and zero arguments' })`,
  },
  toLocaleLowerCase: {
    prompt: 'lowercase using locales rules, where Turkish I and German sharp-s break the assumptions every English-only test suite makes',
    comment: 'Locale-aware lowercase; the Turkish-i case study is the one example everyone uses, and rightly so.',
    example: `await neuro.string.toLocaleLowerCase({ string: input, locales: 'tr-TR', prompt: 'lowercase using locales rules, where Turkish I and German sharp-s break the assumptions every English-only test suite makes' })`,
  },
  toLocaleUpperCase: {
    prompt: 'uppercase using locales rules, where dotted i and ess-zett expand the string in ways the column width never accounted for',
    comment: 'Locale-aware uppercase; ß becomes SS, the column allocator notices.',
    example: `await neuro.string.toLocaleUpperCase({ string: input, locales: 'de-DE', prompt: 'uppercase using locales rules, where dotted i and ess-zett expand the string in ways the column width never accounted for' })`,
  },
  toLowerCase: {
    prompt: 'lowercase the string using the en-US rules even when the input is not English, the simple version that we have to remember is locale-naive',
    comment: 'Locale-naive lowercase; perfectly fine for ASCII, never quite right for Turkish.',
    example: `await neuro.string.toLowerCase({ string: header, prompt: 'lowercase the string using the en-US rules even when the input is not English, the simple version that we have to remember is locale-naive' })`,
  },
  toUpperCase: {
    prompt: 'uppercase the string using the en-US rules, dropping locale subtleties on the floor exactly the way every CSV exporter quietly does',
    comment: 'Locale-naive uppercase; the Turkish-I trap and the German ß trap are both still here.',
    example: `await neuro.string.toUpperCase({ string: input, prompt: 'uppercase the string using the en-US rules, dropping locale subtleties on the floor exactly the way every CSV exporter quietly does' })`,
  },
  toWellFormed: {
    prompt: 'return a copy of the string with every lone surrogate replaced by U+FFFD, papering over the malformed input from the upstream we still have not fixed',
    comment: 'Repair lone surrogates with the replacement char; the upstream still produces them, this just stops the consumer from crashing.',
    example: `await neuro.string.toWellFormed({ string: payload, prompt: 'return a copy of the string with every lone surrogate replaced by U+FFFD, papering over the malformed input from the upstream we still have not fixed' })`,
  },
  trim: {
    prompt: 'strip leading and trailing whitespace, including the U+200B zero-width space the upstream API tracks users with',
    comment: 'Both-ends trim; the zero-width space the analytics team relies on gets stripped, which is the bug or the feature, depending.',
    example: `await neuro.string.trim({ string: input, prompt: 'strip leading and trailing whitespace, including the U+200B zero-width space the upstream API tracks users with' })`,
  },
  trimEnd: {
    prompt: 'strip only trailing whitespace, leaving the leading indent the diff cares about',
    comment: 'Right-trim; the leading whitespace is sacred to the diff viewer.',
    example: `await neuro.string.trimEnd({ string: line, prompt: 'strip only trailing whitespace, leaving the leading indent the diff cares about' })`,
  },
  trimLeft: {
    prompt: 'strip only leading whitespace exactly the way trimStart does, while pretending the older alias name was kept by accident not on purpose',
    comment: 'Legacy alias for trimStart; the spec keeps both, the linter prefers the newer name.',
    example: `await neuro.string.trimLeft({ string: line, prompt: 'strip only leading whitespace exactly the way trimStart does, while pretending the older alias name was kept by accident not on purpose' })`,
  },
  trimRight: {
    prompt: 'strip only trailing whitespace exactly the way trimEnd does, the legacy name we keep typing because muscle memory is honest',
    comment: 'Legacy alias for trimEnd; the older form survives because removing it would break someone is sed pipeline.',
    example: `await neuro.string.trimRight({ string: line, prompt: 'strip only trailing whitespace exactly the way trimEnd does, the legacy name we keep typing because muscle memory is honest' })`,
  },
  trimStart: {
    prompt: 'strip only leading whitespace, leaving the trailing whitespace the validator silently relies on',
    comment: 'Left-trim; the trailing whitespace is doing more work than the comments suggest.',
    example: `await neuro.string.trimStart({ string: line, prompt: 'strip only leading whitespace, leaving the trailing whitespace the validator silently relies on' })`,
  },
};
