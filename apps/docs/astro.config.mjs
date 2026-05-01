// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightLinksValidator from 'starlight-links-validator';
import starlightSiteGraph from 'starlight-site-graph';
import starlightCopyButton from 'starlight-copy-button';
import starlightLlmsTxt from 'starlight-llms-txt';

import methodsSidebar from './src/api-sidebar.json' with { type: 'json' };

export default defineConfig({
  site: 'https://neuro-ts.dev',
  integrations: [
    sitemap({
      serialize(item) {
        const p = new URL(item.url).pathname;

        // Exclude llms-txt files and the warp redirector - not HTML pages.
        if (p.endsWith('.txt') || p === '/warp/' || p === '/warp') return undefined;

        let priority = 0.5;
        // EnumChangefreq values - cast to any to avoid TS enum mismatch in .mjs
        let changefreq = /** @type {any} */ ('monthly');

        if (p === '/') {
          priority = 1.0;
          changefreq = 'weekly';
        } else if (/^\/methods\/[^/]+\/$/.test(p)) {
          priority = 0.8;
        } else if (/^\/methods\/[^/]+\/[^/]+\/$/.test(p)) {
          priority = 0.6;
        } else if (p.startsWith('/guides/')) {
          priority = 0.7;
        } else if (p.startsWith('/concepts/')) {
          priority = 0.7;
        } else if (p.startsWith('/api/')) {
          priority = 0.5;
        } else if (p === '/support/') {
          priority = 0.4;
          changefreq = 'yearly';
        }

        item.priority = priority;
        item.changefreq = changefreq;
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
    starlight({
      title: 'neuro-ts',
      description:
        'AI-augmented JavaScript built-ins. neuro.math.random, neuro.array.map, neuro.string.split. Every method takes the same arguments as the original plus an optional trailing prompt.',
      logo: {
        // The wordmark colour has to flip per theme (cream on coal in
        // dark, deep iron on paper in light), and Starlight emits the
        // logo as a plain <img> so currentColor / CSS-var trickery
        // can't reach inside the SVG. Two source files is the only
        // robust fix.
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo.svg',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css', './src/styles/fonts.css'],
      components: {
        SocialIcons: './src/components/overrides/SocialIcons.astro',
        ThemeSelect: './src/components/overrides/ThemeSelect.astro',
        // Override Starlight's stock provider so first-visit readers
        // land on the light theme rather than honouring the system
        // colour-scheme. Returning visitors keep their last toggle.
        ThemeProvider: './src/components/overrides/ThemeProvider.astro',
        // Adds og:image, twitter:image*, JSON-LD, SEO meta. Starlight's
        // stock Head only renders frontmatter title/description.
        Head: './src/components/overrides/Head.astro',
        // Suppresses the auto-emitted <h1> on the homepage (the custom
        // hero already provides one). Other pages keep the default.
        PageTitle: './src/components/overrides/PageTitle.astro',
      },
      head: [
        // Colour meta
        { tag: 'meta', attrs: { name: 'theme-color', content: '#fbf6ec' } },
        // Sitemap
        {
          tag: 'link',
          attrs: { rel: 'sitemap', type: 'application/xml', href: '/sitemap-index.xml' },
        },
        // PWA / home-screen
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        {
          tag: 'meta',
          attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'neuro-ts' } },
        { tag: 'meta', attrs: { name: 'application-name', content: 'neuro-ts' } },
        { tag: 'meta', attrs: { name: 'msapplication-TileColor', content: '#a83904' } },
      ],
      social: [
        {
          icon: 'npm',
          label: 'npm',
          href: 'https://www.npmjs.com/package/neuro-ts',
        },
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/utajum/neuro-ts',
        },
      ],
      expressiveCode: {
        themes: ['github-dark-default', 'github-light-default'],
        styleOverrides: {
          borderRadius: '10px',
          codeFontFamily: '"Geist Mono", ui-monospace, monospace',
        },
      },
      plugins: [
        // TypeDoc only documents the small client/configuration/types
        // surface. The 654 generated wrapper pages live under
        // /api/methods/ and are produced by `scripts/generate-api-docs.ts`
        // straight from prompts.json (so each page can show its actual
        // system prompt).
        starlightTypeDoc({
          entryPoints: ['../../packages/neuro-ts/typedoc-entry.ts'],
          tsconfig: '../../packages/neuro-ts/tsconfig.json',
          sidebar: { collapsed: true, label: 'Client API' },
          pagination: true,
          typeDoc: {
            commentStyle: 'all',
            searchInComments: true,
            parametersFormat: 'htmlTable',
            propertiesFormat: 'list',
            enumMembersFormat: 'htmlTable',
            typeDeclarationFormat: 'table',
            excludePrivate: true,
            excludeProtected: true,
            excludeInternal: true,
            disableSources: true,
            useCodeBlocks: true,
            sort: ['source-order'],
          },
        }),
        starlightCopyButton(),
        starlightLlmsTxt({
          // projectName and description fall back to Starlight's `title`
          // ("neuro-ts") and `description` option - no need to repeat them.
          details: [
            'neuro-ts wraps every standard JavaScript built-in (Math, Array, String,',
            'Object, Number, Date, Map, Set, Promise, RegExp, JSON, BigInt, Atomics,',
            'TypedArray, Intl, and the global functions) so each method accepts an',
            'optional trailing natural-language prompt. With no prompt the wrapper',
            'falls through to the native built-in. With a prompt the call is routed',
            'to an LLM (OpenAI by default, or any OpenAI-compatible endpoint).',
            'The library is TypeScript-first: each wrapper preserves the original',
            'signature exactly, plus an optional `prompt: string` field.',
          ].join(' '),
          promote: ['index', 'guides/install', 'guides/quick-start'],
          customSets: [
            {
              label: 'Concepts and guides',
              description:
                'Conceptual docs, installation, configuration, and how-tos for neuro-ts.',
              paths: ['guides/**', 'concepts/**', 'support'],
            },
            {
              label: 'Method reference',
              description:
                'AI-augmented wrappers for every JavaScript built-in (654 methods across 30 groups).',
              paths: ['methods/**'],
            },
            {
              label: 'API reference',
              description: 'Client class, configuration, error types, and TypeScript interfaces.',
              paths: ['api/**'],
            },
          ],
          pageSeparator: '\n\n---\n\n',
        }),
        starlightSiteGraph({
          graphConfig: {
            depth: 1,
            renderArrows: true,
            scale: 1.25,
            // Slightly bolder labels so the typography reads at the
            // edge of the panel.
            labelFontSize: 13,
            labelOffset: 12,
            // Default style: small circle in the brand amber. Each
            // section overrides via `styleRules` below.
            nodeDefaultStyle: {
              shape: 'circle',
              shapeSize: 6,
              shapeColor: 'nodeColor1',
              strokeWidth: 0,
              colliderScale: 1.05,
              neighborScale: 0.55,
            },
            nodeCurrentStyle: {
              shapeColor: 'nodeColor1',
              shapeSize: 9,
              strokeColor: 'nodeColor1',
              strokeWidth: 2,
            },
            nodeVisitedStyle: {
              shapeColor: 'nodeColor2',
            },
          },
          sitemapConfig: {
            // Section-aware shapes & colours. Each tuple is `[globs,
            // partialStyle]`. Style cascades: earlier rules merge
            // into later ones (per the vendored builder), so put
            // narrower paths first. CSS variables `--slsg-node-color-1`
            // through `--slsg-node-color-5` (defined in custom.css)
            // resolve per-theme.
            styleRules: [
              [
                ['/methods/*/'], // group overview pages: bigger circle
                { shape: 'circle', shapeSize: 8, shapeColor: 'nodeColor1' },
              ],
              [
                ['/methods/**'], // individual method pages: small circle
                { shape: 'circle', shapeSize: 5, shapeColor: 'nodeColor1' },
              ],
              [['/guides/**'], { shape: 'triangle', shapeSize: 8, shapeColor: 'nodeColor2' }],
              [
                ['/concepts/**'],
                {
                  shape: 'polygon',
                  shapePoints: 5,
                  shapeSize: 8,
                  shapeColor: 'nodeColor3',
                },
              ],
              [
                ['/api/**'],
                {
                  shape: 'square',
                  shapeSize: 6,
                  shapeColor: 'nodeColor4',
                  shapeCornerRadius: '20%',
                },
              ],
              [
                ['/support/**'],
                {
                  shape: 'star',
                  shapePoints: 5,
                  shapeSize: 10,
                  shapeColor: 'nodeColor5',
                },
              ],
              [
                ['/'], // homepage: large brand star
                {
                  shape: 'star',
                  shapePoints: 6,
                  shapeSize: 12,
                  shapeColor: 'nodeColor1',
                  strokeColor: 'nodeColor1',
                  strokeWidth: 1,
                },
              ],
            ],
          },
        }),
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          errorOnInvalidHashes: true,
          errorOnLocalLinks: true,
        }),
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', slug: 'index' },
            { label: 'Install', slug: 'guides/install' },
            { label: 'Quick start', slug: 'guides/quick-start' },
            { label: 'Support the project', slug: 'support' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Browser safety', slug: 'guides/browser-safety' },
            { label: 'Custom models', slug: 'guides/custom-models' },
            { label: 'Custom proxy contract', slug: 'guides/proxy-contract' },
            { label: 'Deploy the proxy', slug: 'guides/deploy-proxy' },
            { label: 'Native fallback', slug: 'guides/native-fallback' },
            { label: 'Migrate from native', slug: 'guides/migrate' },
            { label: 'Error reference', slug: 'guides/errors' },
            { label: 'Troubleshooting', slug: 'guides/troubleshooting' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            {
              label: 'How prompts are built',
              slug: 'concepts/prompt-engineering',
            },
            { label: 'Naming conventions', slug: 'concepts/naming' },
            { label: 'Method catalog', slug: 'concepts/catalog' },
          ],
        },
        methodsSidebar,
        typeDocSidebarGroup,
      ],
    }),
  ],
});
