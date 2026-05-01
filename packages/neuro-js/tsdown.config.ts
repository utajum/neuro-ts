import { defineConfig } from 'tsdown';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig([
  // Universal entry (Node + bundlers). `openai` stays external.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    platform: 'neutral',
    outDir: 'dist',
    external: ['openai'],
    hooks: {
      'build:done'(ctx: unknown) {
        // Copy prompts.json so consumers can `import 'neuro-js/prompts'`.
        try {
          copyFileSync(resolve('src/generated/prompts.json'), resolve('dist/prompts.json'));
        } catch {
          /* noop */
        }
      },
    },
  },
  // Browser-only entry (still externalises openai for tree-shaking bundlers).
  {
    entry: { browser: 'src/browser.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    platform: 'browser',
    outDir: 'dist',
    external: ['openai'],
  },
  // IIFE bundle for direct <script> tag / CDN usage. Inlines `openai`.
  {
    entry: { 'neuro-js': 'src/browser.ts' },
    format: ['iife'],
    globalName: 'NeuroJS',
    dts: false,
    sourcemap: true,
    clean: false,
    minify: true,
    target: 'es2020',
    platform: 'browser',
    outDir: 'dist',
  },
]);
