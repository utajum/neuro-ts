/**
 * Per-page Open Graph image generator.
 *
 * Method pages:  syntax-highlighted code card in the lower portion, sourced
 *                from prompts.json curated examples. Shiki tokenises the flat
 *                one-liner; a post-tokenisation soft-wrap splits token content
 *                at safe boundaries so string literals keep their colour.
 *
 * Non-method pages: feature-bullets card in the lower portion.
 *
 * The logo SVG is rasterised to PNG once (CanvasKit cannot decode SVG).
 * All cards are transparent 1200×630 RGBA PNGs passed as bgImage overlays.
 */
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import promptsRaw from 'neuro-ts/prompts';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';
import { createHash } from 'node:crypto';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { codeToTokens } from 'shiki';
import sharp from 'sharp';

const PROJECT_ROOT = pathResolve(fileURLToPath(import.meta.url), '../../../..');
const asset = (rel: string) => pathResolve(PROJECT_ROOT, rel);
const OG_CACHE = pathResolve(PROJECT_ROOT, 'node_modules/.astro-og-canvas');

// ---------------------------------------------------------------------------
// Prompt data
// ---------------------------------------------------------------------------

interface Curated {
  prompt: string;
  comment: string;
  example: string;
}
interface PromptEntry {
  group: string;
  methodName: string;
  functionId: string;
  kind: 'instance' | 'static' | 'global';
  curated: Curated;
}
const prompts: Record<string, PromptEntry> = promptsRaw as Record<string, PromptEntry>;

const docs = await getCollection('docs');
const pages: Record<string, (typeof docs)[number]> = {};
for (const entry of docs) {
  pages[entry.id] = entry;
}

// ---------------------------------------------------------------------------
// Group accent colours
// ---------------------------------------------------------------------------

const GROUP_COLORS: Record<string, string> = {
  array: '#2da44e',
  string: '#0969da',
  number: '#0550ae',
  math: '#8250df',
  json: '#cf222e',
  date: '#d4a72c',
  promise: '#1a7f37',
  map: '#0969da',
  set: '#0969da',
  weakMap: '#8250df',
  weakSet: '#8250df',
  object: '#656d76',
  proxy: '#8250df',
  regexp: '#cf222e',
  error: '#cf222e',
  symbol: '#d4a72c',
  bigint: '#0550ae',
  typedArray: '#8250df',
  globals: '#a83904',
};
const groupAccent = (g: string) => GROUP_COLORS[g] ?? '#a83904';

// ---------------------------------------------------------------------------
// SVG helpers
// ---------------------------------------------------------------------------

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Post-Shiki soft-wrap
//
// We tokenise the *unbroken* code string so Shiki sees complete string
// literals and keywords. Then we wrap visually here, splitting long token
// content at space boundaries while preserving each token's colour. This
// prevents the "GC runs as soon as" keyword-colour explosion that occurs
// when a bare newline is injected mid-string before tokenisation.
// ---------------------------------------------------------------------------

type SvgToken = { content: string; color: string };
type SvgLine = SvgToken[];

const INDENT = '  ';
const INDENT_COL = '#57534e'; // muted colour for indent spaces
const MAX_COLS = 75;

function softWrapTokenLine(
  shikiTokens: Array<{ content: string; color?: string }>,
  maxCols: number = MAX_COLS,
): SvgLine[] {
  const result: SvgLine[] = [];
  let line: SvgLine = [];
  let col = 0;
  let first = true; // first visual line carries no indent

  const flush = () => {
    if (line.length) result.push(line);
    if (first) {
      first = false;
      line = [];
      col = 0;
    } else {
      line = [{ content: INDENT, color: INDENT_COL }];
      col = INDENT.length;
    }
  };

  for (const tok of shikiTokens) {
    const color = tok.color ?? '#24292f';
    let content = tok.content;
    if (!content) continue;

    while (content.length > 0) {
      const available = maxCols - col;

      if (available <= 0) {
        flush();
        continue;
      }

      if (content.length <= available) {
        line.push({ content, color });
        col += content.length;
        break;
      }

      // Token doesn't fit - find last safe break within `available` chars.
      // Prefer breaking right after a space (i.e. at position where content[i]
      // is a space so we leave it on the current piece and trim it from next).
      let breakAt = -1;
      for (let i = Math.min(available - 1, content.length - 1); i >= 1; i--) {
        if (content[i] === ' ') {
          breakAt = i;
          break;
        }
      }

      if (breakAt > 0) {
        line.push({ content: content.slice(0, breakAt), color });
        content = content.slice(breakAt).trimStart();
        flush();
      } else {
        // No space found - hard-break at column limit.
        line.push({ content: content.slice(0, available), color });
        content = content.slice(available);
        flush();
      }
    }
  }

  if (line.length) result.push(line);
  return result;
}

// ---------------------------------------------------------------------------
// Logo: rasterise SVG → PNG once (CanvasKit cannot decode SVG)
// ---------------------------------------------------------------------------

const LOGO_CACHE = pathResolve(OG_CACHE, 'logo');
let _logoPngPath: string | undefined;

async function getLogoPng(): Promise<string> {
  if (_logoPngPath) return _logoPngPath;
  const out = pathResolve(LOGO_CACHE, 'logo-light-960.png');
  try {
    await readFile(out);
    _logoPngPath = out;
    return out;
  } catch {
    /* generate */
  }
  await mkdir(LOGO_CACHE, { recursive: true });
  const svgBuf = await readFile(asset('public/logo-light.svg'));
  await sharp(svgBuf, { density: 1200 }).resize(960).png().toFile(out);
  _logoPngPath = out;
  return out;
}

// ---------------------------------------------------------------------------
// Code card: method pages
// ---------------------------------------------------------------------------

const CARD_X = 60;
const CARD_W = 1080;
const CARD_Y_CODE = 360; // code card top (padding=30, logo=120px, 2-line desc ends ~345px)
const ACCENT_H = 6;
const LINE_H = 24;
const CODE_FS = 15;
const CODE_PAD_V = 26;
const CODE_PAD_L = 32;

const CODE_CACHE = pathResolve(OG_CACHE, 'code');

async function renderCodeCardPng(example: string, comment: string, group: string): Promise<string> {
  // v6 in hash = invalidates cache (CARD_Y_CODE=360)
  const hash = createHash('sha256')
    .update(`v6::${example}::${comment}::${group}`)
    .digest('hex')
    .slice(0, 16);
  const cachePath = pathResolve(CODE_CACHE, `${hash}.png`);
  try {
    await readFile(cachePath);
    return cachePath;
  } catch {
    /* generate */
  }

  // Tokenise the FLAT (unwrapped) source so Shiki sees whole literals.
  const fullCode = `// ${comment}\n${example}`;
  const { tokens: shikiLines } = await codeToTokens(fullCode, {
    lang: 'ts',
    theme: 'github-light-default',
  });

  // Soft-wrap each Shiki line into multiple visual lines.
  const visualLines: SvgLine[] = [];
  for (const shikiLine of shikiLines) {
    const wrapped = softWrapTokenLine(shikiLine);
    for (const vl of wrapped) visualLines.push(vl);
  }

  const numLines = visualLines.length;
  const cardH = ACCENT_H + CODE_PAD_V + numLines * LINE_H + CODE_PAD_V;
  const accent = groupAccent(group);
  const cy = CARD_Y_CODE;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">`);
  parts.push(
    `<defs><clipPath id="cc">` +
      `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${cardH}" rx="12" ry="12"/>` +
      `</clipPath></defs>`,
  );
  parts.push(
    `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${cardH}" rx="12" ry="12" fill="#f6f8fa"/>`,
  );
  parts.push(`<g clip-path="url(#cc)">`);
  parts.push(
    `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${ACCENT_H}" fill="${accent}"/>`,
  );

  const textY0 = cy + ACCENT_H + CODE_PAD_V;
  for (let li = 0; li < visualLines.length; li++) {
    const y = textY0 + li * LINE_H;
    // Join tspans with no separator - any whitespace between </tspan><tspan>
    // is treated as inter-element text by librsvg and rendered as a space,
    // producing the spurious gaps seen between e.g. "weakSet." and "has".
    const inner = visualLines[li]
      .map((tok) => `<tspan fill="${escXml(tok.color)}">${escXml(tok.content)}</tspan>`)
      .join('');
    parts.push(
      `<text font-family="monospace" font-size="${CODE_FS}" ` +
        `x="${CARD_X + CODE_PAD_L}" y="${y}" xml:space="preserve">${inner}</text>`,
    );
  }

  parts.push(`</g></svg>`);

  await mkdir(CODE_CACHE, { recursive: true });
  const png = await sharp(Buffer.from(parts.join('\n')))
    .png()
    .toBuffer();
  await writeFile(cachePath, png);
  return cachePath;
}

// ---------------------------------------------------------------------------
// Features card: non-method pages
// ---------------------------------------------------------------------------

const CARD_Y_FEAT = 395; // below 2-line non-method description; logo=120px, padding=30
const FEAT_PAD_T = 22;
const FEAT_PAD_B = 18;
const FEAT_ROW_H = 38;
const FEAT_CACHE = pathResolve(OG_CACHE, 'features');

const FEATURES = [
  {
    label: '600+ built-ins wrapped',
    sub: 'Array, Math, String, JSON, Date, Map, Set, RegExp\u2026',
  },
  { label: 'TypeScript-first', sub: 'Exact original signatures, inference intact' },
  { label: 'Native fallback', sub: 'Omit the prompt and the LLM is never contacted' },
  { label: 'OpenAI-compatible', sub: 'Point at any compatible endpoint or local model' },
] as const;

async function renderFeaturesCardPng(): Promise<string> {
  const cachePath = pathResolve(FEAT_CACHE, 'features-v4.png');
  try {
    await readFile(cachePath);
    return cachePath;
  } catch {
    /* generate */
  }

  const accent = '#a83904';
  const cy = CARD_Y_FEAT;
  const cardH = ACCENT_H + FEAT_PAD_T + FEATURES.length * FEAT_ROW_H + FEAT_PAD_B;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">`);
  parts.push(
    `<defs><clipPath id="fc">` +
      `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${cardH}" rx="12" ry="12"/>` +
      `</clipPath></defs>`,
  );
  parts.push(
    `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${cardH}" rx="12" ry="12" fill="#f6f8fa"/>`,
  );
  parts.push(`<g clip-path="url(#fc)">`);
  parts.push(
    `<rect x="${CARD_X}" y="${cy}" width="${CARD_W}" height="${ACCENT_H}" fill="${accent}"/>`,
  );

  const rowsY = cy + ACCENT_H + FEAT_PAD_T;
  for (let i = 0; i < FEATURES.length; i++) {
    const f = FEATURES[i];
    const ry = rowsY + i * FEAT_ROW_H;
    const dotCx = CARD_X + 32 + 5;
    // Accent dot
    parts.push(`<circle cx="${dotCx}" cy="${ry + 12}" r="4" fill="${accent}"/>`);
    // Label
    parts.push(
      `<text font-family="sans-serif" font-weight="600" font-size="17" ` +
        `fill="#231510" x="${CARD_X + 56}" y="${ry + 16}">${escXml(f.label)}</text>`,
    );
    // Sub-label
    parts.push(
      `<text font-family="sans-serif" font-size="13" ` +
        `fill="#78716c" x="${CARD_X + 56}" y="${ry + 32}">${escXml(f.sub)}</text>`,
    );
  }

  parts.push(`</g></svg>`);

  await mkdir(FEAT_CACHE, { recursive: true });
  const png = await sharp(Buffer.from(parts.join('\n')))
    .png()
    .toBuffer();
  await writeFile(cachePath, png);
  return cachePath;
}

// ---------------------------------------------------------------------------
// Title / description / lookup helpers
// ---------------------------------------------------------------------------

function lookupEntry(id: string): PromptEntry | undefined {
  const parts = id.split('/');
  if (parts[0] !== 'methods' || parts.length !== 3) return undefined;
  const [, group, method] = parts;
  const dotted = `neuro.${group === 'globals' ? '' : group + '.'}${method}`;
  const key = Object.keys(prompts).find((k) => k.toLowerCase() === dotted.toLowerCase());
  return key ? prompts[key] : undefined;
}

function ogTitle(id: string, fmTitle: string, entry?: PromptEntry): string {
  if (entry) {
    const [, group, method] = id.split('/');
    const dotted = `neuro.${group === 'globals' ? '' : group + '.'}${method}`;
    const key = Object.keys(prompts).find((k) => k.toLowerCase() === dotted.toLowerCase());
    if (key) return key;
  }
  return fmTitle;
}

function ogDescription(id: string, fmDescription: string | undefined, entry?: PromptEntry): string {
  if (entry?.curated?.comment) return entry.curated.comment;
  if (fmDescription) return fmDescription;
  if (id === 'index')
    return 'AI-augmented JavaScript built-ins. Wrap Array, Math, String, JSON and 600+ more methods with optional LLM prompts.';
  return 'AI-augmented JavaScript built-ins.';
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'slug',
  getImageOptions: async (_path, page) => {
    const entry = lookupEntry(page.id);

    // Rasterise logo SVG once (CanvasKit cannot decode SVG natively).
    const logoPng = await getLogoPng().catch(() => asset('public/logo-light.svg'));

    // Code card (method pages) or features card (everything else).
    let bgImage: { path: string; fit: 'none'; position: ['start', 'start'] } | undefined;
    if (entry?.curated?.example) {
      try {
        const p = await renderCodeCardPng(
          entry.curated.example,
          entry.curated.comment ?? '',
          entry.group,
        );
        bgImage = { path: p, fit: 'none', position: ['start', 'start'] };
      } catch {
        /* degrade gracefully */
      }
    } else {
      try {
        const p = await renderFeaturesCardPng();
        bgImage = { path: p, fit: 'none', position: ['start', 'start'] };
      } catch {
        /* degrade gracefully */
      }
    }

    const isMethod = !!entry;

    return {
      title: ogTitle(page.id, page.data.title, entry),
      description: ogDescription(page.id, page.data.description, entry),
      logo: { path: logoPng, size: [600] },
      bgGradient: [
        [251, 246, 236],
        [243, 230, 213],
      ],
      ...(bgImage ? { bgImage } : {}),
      border: { color: [168, 57, 4], width: 12, side: 'block-end' },
      padding: 30,
      font: {
        title: {
          color: [35, 21, 16],
          size: isMethod ? 52 : 68,
          weight: 'Bold',
          lineHeight: 1.1,
          families: ['Geist'],
        },
        description: {
          color: [90, 58, 40],
          size: isMethod ? 24 : 28,
          weight: 'Normal',
          lineHeight: 1.4,
          families: ['Geist'],
        },
      },
      fonts: [
        asset('public/fonts/Geist-Bold.ttf'),
        asset('public/fonts/Geist-Regular.ttf'),
        asset('public/fonts/GeistMono-Regular.ttf'),
      ],
      format: 'PNG',
      quality: 90,
    };
  },
});
