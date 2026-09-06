import type { MdCommentsPluginOptions } from './types.js';
import { createAuthProxyVitePlugin, createAuthMiddleware } from './server/authProxy.js';

export interface StarlightPlugin {
  name: string;
  hooks: {
    'config:setup': (args: {
      config: { base?: string; [key: string]: unknown };
      updateConfig: (newConfig: Record<string, unknown>) => void;
      addIntegration: (integration: unknown) => void;
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
      'config:setup'({
        config,
        updateConfig,
        addIntegration,
      }: {
        config: { base?: string; [key: string]: unknown };
        updateConfig: (newConfig: Record<string, unknown>) => void;
        addIntegration: (integration: unknown) => void;
      }) {
        const mergedOptions: MdCommentsPluginOptions = {
          base: config?.base,
          ...options,
        };

        // 1. Inject options into head and styles into Starlight customCss
        updateConfig({
          head: [
            {
              tag: 'script',
              content: `window.__MD_COMMENTS_OPTIONS__ = ${JSON.stringify(mergedOptions)};`,
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
            'astro:config:setup'({
              updateConfig: updateAstroConfig,
              injectScript,
            }: {
              updateConfig?: (config: Record<string, unknown>) => void;
              injectScript: (stage: string, content: string) => void;
            }) {
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
            'astro:server:setup'({
              server,
            }: {
              server?: { middlewares?: { use: (middleware: unknown) => void } };
            }) {
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
