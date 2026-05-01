/**
 * Best-effort parsing of an LLM completion into a JS value.
 * The model is instructed to return raw JSON, but it sometimes wraps in
 * code fences or returns the literal string "undefined".
 */
export function parseLLMResult(raw: string | null | undefined): unknown {
  if (raw == null) return undefined;
  let text = raw.trim();
  if (text === '' || text === 'undefined') return undefined;
  if (text === 'null') return null;

  // Strip ```json ... ``` or ``` ... ``` fences
  const fence = text.match(/^```(?:json|javascript|js|ts|typescript)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fence) text = fence[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    // Try unwrapping single-quoted strings
    if (
      (text.startsWith("'") && text.endsWith("'")) ||
      (text.startsWith('`') && text.endsWith('`'))
    ) {
      return text.slice(1, -1);
    }
    // Numbers / booleans
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (text === 'true') return true;
    if (text === 'false') return false;
    return text;
  }
}
