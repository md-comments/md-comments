import type { MdCommentsPluginOptions } from './types.js';
import { createAuthProxyVitePlugin, createAuthMiddleware } from './server/authProxy.js';

export interface StarlightPlugin {
  name: string;
  hooks: {
    'config:setup': (args: {
      config: any;
      updateConfig: (newConfig: any) => void;
      addIntegration: (integration: any) => void;
    }) => void;
  };
}

/**
 * Markdown Comments Plugin for Starlight.
 *
 * Usage in `astro.config.mjs`:
 * ```js
 * import starlight from '@astrojs/starlight';
 * import { starlightMdComments } from '@md-comments/starlight';
 *
 * export default defineConfig({
 *   integrations: [
 *     starlight({
 *       title: 'My Docs',
 *       plugins: [
 *         starlightMdComments({
 *           repo: 'owner/repo',
 *           branch: 'main'
 *         })
 *       ]
 *     })
 *   ]
 * });
 * ```
 */
export function starlightMdComments(options: MdCommentsPluginOptions = {}): StarlightPlugin {
  return {
    name: '@md-comments/starlight',
    hooks: {
      'config:setup'({ updateConfig, addIntegration }) {
        // 1. Inject options into head and styles into Starlight customCss
        updateConfig({
          head: [
            {
              tag: 'script',
              content: `window.__MD_COMMENTS_OPTIONS__ = ${JSON.stringify(options)};`,
            },
            {
              tag: 'script',
              attrs: {
                type: 'module',
              },
              content: `import '@md-comments/starlight/client/bootstrap';`,
            },
          ],
          customCss: ['@md-comments/starlight/styles.css'],
        });

        // 2. Automatically inject the client bootstrap runtime and dev auth proxy
        addIntegration({
          name: '@md-comments/starlight-client-runtime',
          hooks: {
            'astro:config:setup'({ updateConfig: updateAstroConfig, injectScript }: any) {
              if (updateAstroConfig) {
                updateAstroConfig({
                  vite: {
                    plugins: [createAuthProxyVitePlugin()],
                    optimizeDeps: {
                      esbuildOptions: {
                        target: 'es2022',
                      },
                    },
                    build: {
                      target: 'es2022',
                    },
                  },
                });
              }
              injectScript('page', `import '@md-comments/starlight/client/bootstrap';`);
            },
            'astro:server:setup'({ server }: any) {
              if (server?.middlewares) {
                server.middlewares.use(createAuthMiddleware());
              }
            },
          },
        });
      },
    },
  };
}
