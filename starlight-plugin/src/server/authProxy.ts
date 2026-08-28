/**
 * Vite & Astro Dev Server Proxy Middleware for GitHub OAuth Device Flow.
 * Proxies `/api/md-comments/auth/*` requests to GitHub to bypass browser CORS in development.
 */

export function createAuthMiddleware() {
  return async (req: any, res: any, next: any) => {
    const rawUrl = req.url || '';
    const url = rawUrl.split('?')[0].replace(/\/+$/, '');

    const isDeviceCode = url.includes('/api/md-comments/auth/device-code');
    const isAccessToken = url.includes('/api/md-comments/auth/access-token');

    if (!isDeviceCode && !isAccessToken) {
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      return next();
    }

    try {
      let rawBody = '';
      if (req.body && Object.keys(req.body).length > 0) {
        rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        rawBody = Buffer.concat(chunks).toString('utf-8');
      }

      const parsed = JSON.parse(rawBody || '{}');
      const targetUrl = isDeviceCode
        ? 'https://github.com/login/device/code'
        : 'https://github.com/login/oauth/access_token';

      const ghRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Markdown-Comments-Starlight-Plugin',
        },
        body: JSON.stringify(parsed),
      });

      const data = await ghRes.json();
      res.writeHead(ghRes.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(data));
    } catch (err: any) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: err?.message || 'Internal proxy error' }));
    }
  };
}

export function createAuthProxyVitePlugin() {
  const middleware = createAuthMiddleware();
  return {
    name: 'md-comments-auth-proxy',
    configureServer(server: any) {
      server.middlewares.use(middleware);
    },
  };
}
