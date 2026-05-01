/**
 * Per-page Open Graph image generator.
 *
 * Iterates Starlight's `docs` content collection and emits a 1200x630 PNG
 * per page under `/og/<slug>.png`. The card uses the project's paper
 * canvas + ember accent palette so a deep-link share looks visually
 * connected to the live site.
 *
 * astro-og-canvas (CanvasKit-backed) only supports a fixed layout:
 *   logo (top) → title → description → optional one-side border.
 * We work within that, but enrich the title for method pages with the
 * fully-qualified `neuro.<group>.<method>` form.
 */
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import promptsRaw from 'neuro-js/prompts';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';

// astro-og-canvas reads files via `fs.readFile(path)` - relative paths
// resolve against CWD which during the prerender pass is the dist
// folder, not the project root. Compute absolute paths once here.
const PROJECT_ROOT = pathResolve(fileURLToPath(import.meta.url), '../../../..');
const asset = (rel: string) => pathResolve(PROJECT_ROOT, rel);

interface PromptEntry {
  group: string;
  methodName: string;
  functionId: string;
  kind: 'instance' | 'static' | 'global';
}
const prompts: Record<string, PromptEntry> = promptsRaw as Record<string, PromptEntry>;

// Build a `pages` map keyed by the route path Astro will generate
// (e.g. `methods/array/map`). The slug param then maps 1:1 onto the
// content-collection id.
const docs = await getCollection('docs');
const pages: Record<string, (typeof docs)[number]> = {};
for (const entry of docs) {
  pages[entry.id] = entry;
}

/** Pick a human-friendly title for the OG card. Method pages get the
 * fully qualified `neuro.<group>.<method>` form rather than just the
 * bare method name. */
function ogTitle(id: string, fmTitle: string): string {
  // /methods/<group>/<method> route ids look like 'methods/array/map'.
  const parts = id.split('/');
  if (parts[0] === 'methods' && parts.length === 3) {
    const group = parts[1];
    const method = parts[2];
    // Reverse-look up the dotted key from prompts. The map keys use the
    // original camelCase group (e.g. `weakMap`) whereas the URL slug is
    // lowercase. Resolve by case-insensitive match.
    const dotted = `neuro.${group === 'globals' ? '' : group + '.'}${method}`;
    const lookup = Object.keys(prompts).find((k) => k.toLowerCase() === dotted.toLowerCase());
    if (lookup) return lookup;
  }
  return fmTitle;
}

/** Compose a description for the card. Falls back to a short tagline
 * when the page has none of its own. */
function ogDescription(id: string, fmDescription: string | undefined): string {
  if (fmDescription) return fmDescription;
  if (id === 'index') {
    return 'AI-augmented JavaScript built-ins. Wrap Array, Math, String, JSON and 600+ more methods with optional LLM prompts.';
  }
  return 'AI-augmented JavaScript built-ins.';
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'slug',
  getImageOptions: (_path, page) => ({
    title: ogTitle(page.id, page.data.title),
    description: ogDescription(page.id, page.data.description),
    logo: {
      path: asset('public/logo-light.svg'),
      size: [180],
    },
    // Warm-paper canvas. Two-stop subtle radial gradient feel via two
    // close cream tones.
    bgGradient: [
      [251, 246, 236], // --neuro-paper-0
      [243, 230, 213], // --neuro-paper-2 (warm cream)
    ],
    border: {
      // Bottom ember accent rail (matches the site's `--neuro-700`).
      color: [168, 57, 4],
      width: 12,
      side: 'block-end',
    },
    padding: 60,
    font: {
      title: {
        color: [35, 21, 16], // --neuro-ink-1 (deep iron)
        size: 68,
        weight: 'Bold',
        lineHeight: 1.1,
        families: ['Geist'],
      },
      description: {
        color: [90, 58, 40], // ink-2
        size: 28,
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
  }),
});
