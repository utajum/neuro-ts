// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightLinksValidator from 'starlight-links-validator';
import starlightSiteGraph from 'starlight-site-graph';
import starlightCopyButton from 'starlight-copy-button';

import methodsSidebar from './src/api-sidebar.json' with { type: 'json' };

export default defineConfig({
  site: 'https://neuro-js.dev',
  integrations: [
    starlight({
      title: 'neuro-js',
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
        // Paper tone matching the default light canvas (--neuro-paper-0).
        // Browsers that respect color-scheme will pick up the dark
        // counterpart through CSS once data-theme flips.
        { tag: 'meta', attrs: { name: 'theme-color', content: '#fbf6ec' } },
        // Discoverability hints; Starlight's stock head ships title +
        // description but nothing else SEO-relevant. Per-page og:image
        // tags + JSON-LD + extra metadata live in
        // `src/components/overrides/Head.astro`.
        {
          tag: 'link',
          attrs: {
            rel: 'sitemap',
            type: 'application/xml',
            href: '/sitemap-index.xml',
          },
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/utajum/neuro-js',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/utajum/neuro-js/edit/main/apps/docs/',
      },
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
          entryPoints: ['../../packages/neuro-js/typedoc-entry.ts'],
          tsconfig: '../../packages/neuro-js/tsconfig.json',
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
            { label: 'Native fallback', slug: 'guides/native-fallback' },
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
