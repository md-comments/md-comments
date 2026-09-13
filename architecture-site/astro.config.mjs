import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  base: '/architecture',
  outDir: '../website/architecture',
  integrations: [
    starlight({
      title: 'Markdown Comments Architecture',
      description: 'Living Architecture Documentation, C4 Models, DFDs, and Invariants',
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/Header.astro',
      },
      social: {
        github: 'https://github.com/md-comments/md-comments',
      },
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: 'Architecture Overview', slug: 'index' },
          ],
        },
        {
          label: 'Interactive Model Explorer',
          items: [
            {
              label: 'Interactive LikeC4 ↗',
              link: '/assets/architecture/interactive/index.html',
              attrs: { target: '_blank', rel: 'noopener' },
            },
          ],
        },
        {
          label: 'C4 Architecture (Vector)',
          items: [
            { label: 'C4 Architecture Specifications', slug: 'architecture/c4-architecture' },
          ],
        },
        {
          label: 'Data Flow Diagrams (D2 + ELK)',
          items: [
            { label: 'Data Flow Specifications', slug: 'architecture/data-flow-diagrams' },
          ],
        },
        {
          label: 'Component Topology',
          items: [
            { label: 'Components Integration', slug: 'architecture/components-integration' },
            { label: 'Sequence Diagrams', slug: 'architecture/sequence-diagrams' },
          ],
        },
        {
          label: 'Invariants & ADRs',
          items: [
            { label: 'Invariants & ADR Catalog', slug: 'architecture/invariants-and-adrs' },
          ],
        },
        {
          label: 'Developer Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
});
