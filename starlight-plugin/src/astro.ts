import type { MdCommentsPluginOptions } from './types.js';
import { createAuthProxyVitePlugin, createAuthMiddleware } from './server/authProxy.js';

export interface AstroIntegration {
  name: string;
  hooks: {
    'astro:config:setup'?: (args: {
      updateConfig?: (config: Record<string, unknown>) => void;
      injectScript: (stage: string, content: string) => void;
    }) => void;
    'astro:server:setup'?: (args: {
      server?: { middlewares?: { use: (middleware: unknown) => void } };
    }) => void;
  };
}

/**
 * Markdown Comments Integration for standard Astro sites.
 *
 * Usage in `astro.config.mjs`:
 * ```js
 * import { astroMdComments } from '@md-comments/starlight';
 *
 * export default defineConfig({
 *   integrations: [
 *     astroMdComments({
 *       repo: 'owner/repo',
 *       branch: 'main'
 *     })
 *   ]
 * });
 * ```
 */
export function astroMdComments(options: MdCommentsPluginOptions = {}): AstroIntegration {
  return {
    name: '@md-comments/astro',
    hooks: {
      'astro:config:setup'({
        updateConfig,
        injectScript,
      }: {
        updateConfig?: (config: Record<string, unknown>) => void;
        injectScript: (stage: string, content: string) => void;
      }) {
        if (updateConfig) {
          updateConfig({
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
        injectScript('page', `window.__MD_COMMENTS_OPTIONS__ = ${JSON.stringify(options)};`);
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
  };
}
