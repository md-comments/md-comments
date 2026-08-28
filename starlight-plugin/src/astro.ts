import type { MdCommentsPluginOptions } from './types.js';
import { createAuthProxyVitePlugin, createAuthMiddleware } from './server/authProxy.js';

export interface AstroIntegration {
  name: string;
  hooks: {
    'astro:config:setup'?: (args: any) => void;
    'astro:server:setup'?: (args: any) => void;
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
      'astro:config:setup'({ updateConfig, injectScript }: any) {
        if (updateConfig) {
          updateConfig({
            vite: {
              plugins: [createAuthProxyVitePlugin()],
            },
          });
        }
        injectScript('page', `window.__MD_COMMENTS_OPTIONS__ = ${JSON.stringify(options)};`);
        injectScript('page', `import '@md-comments/starlight/client/bootstrap';`);
      },
      'astro:server:setup'({ server }: any) {
        if (server?.middlewares) {
          server.middlewares.use(createAuthMiddleware());
        }
      },
    },
  };
}
