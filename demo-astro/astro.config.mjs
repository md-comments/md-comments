import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { starlightMdComments } from '@md-comments/starlight';

// https://astro.build/config
export default defineConfig({
  base: '/demo-astro',
  integrations: [
    starlight({
      title: 'Markdown Comments Demo',
      description: 'Interactive Starlight documentation demo with Markdown Comments inline discussions.',
      customCss: ['./src/styles/custom.css'],
      components: {
        Banner: './src/components/Banner.astro',
      },
      social: {
        github: 'https://github.com/md-comments/md-comments',
      },
      sidebar: [
        {
          label: 'Documentation & Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
      plugins: [
        starlightMdComments({
          repo: 'md-comments/astro-demo-comments',
          branch: 'main',
          docBasePath: 'demo-astro/src/content/docs',
        }),
      ],
    }),
  ],
});
