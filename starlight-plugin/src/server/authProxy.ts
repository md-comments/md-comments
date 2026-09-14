/**
 * Vite & Astro Dev Server Proxy Middleware for GitHub OAuth Device Flow.
 * Proxies `/api/md-comments/auth/*` requests to GitHub to bypass browser CORS in development.
 */

import type { IncomingMessage, ServerResponse } from 'http';

export function isOriginAllowed(
  origin: string | undefined,
  hostHeader: string | undefined
): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '::1'
    ) {
      return true;
    }
    if (hostHeader) {
      const hostWithoutPort = hostHeader.split(':')[0];
      if (hostname === hostWithoutPort) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function createAuthMiddleware() {
  return async (
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
    next: () => void
  ) => {
    const rawUrl = req.url || '';
    const url = rawUrl.split('?')[0].replace(/\/+$/, '');

    const isDeviceCode = url.includes('/api/md-comments/auth/device-code');
    const isAccessToken = url.includes('/api/md-comments/auth/access-token');

    if (!isDeviceCode && !isAccessToken) {
      return next();
    }

    const origin = req.headers.origin;
    if (!isOriginAllowed(origin, req.headers.host)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden: origin not allowed' }));
      return;
    }

    const allowOrigin =
      origin || (req.headers.host ? `http://${req.headers.host}` : 'http://localhost');

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Vary', 'Origin');

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

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawBody || '{}');
      } catch {
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowOrigin,
          Vary: 'Origin',
        });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowOrigin,
          Vary: 'Origin',
        });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
        return;
      }

      let forwardPayload: Record<string, string>;

      if (isDeviceCode) {
        if (!parsed.client_id || typeof parsed.client_id !== 'string') {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            Vary: 'Origin',
          });
          res.end(JSON.stringify({ error: 'Missing or invalid client_id' }));
          return;
        }

        if (parsed.scope !== undefined && typeof parsed.scope !== 'string') {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            Vary: 'Origin',
          });
          res.end(JSON.stringify({ error: 'Invalid scope parameter' }));
          return;
        }

        const allowedKeys = new Set(['client_id', 'scope']);
        for (const key of Object.keys(parsed)) {
          if (!allowedKeys.has(key)) {
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': allowOrigin,
              Vary: 'Origin',
            });
            res.end(JSON.stringify({ error: `Unexpected parameter: ${key}` }));
            return;
          }
        }

        forwardPayload = { client_id: parsed.client_id };
        if (parsed.scope) {
          forwardPayload.scope = parsed.scope;
        }
      } else {
        if (!parsed.client_id || typeof parsed.client_id !== 'string') {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            Vary: 'Origin',
          });
          res.end(JSON.stringify({ error: 'Missing or invalid client_id' }));
          return;
        }
        if (!parsed.device_code || typeof parsed.device_code !== 'string') {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            Vary: 'Origin',
          });
          res.end(JSON.stringify({ error: 'Missing or invalid device_code' }));
          return;
        }
        if (!parsed.grant_type || typeof parsed.grant_type !== 'string') {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            Vary: 'Origin',
          });
          res.end(JSON.stringify({ error: 'Missing or invalid grant_type' }));
          return;
        }

        const allowedKeys = new Set(['client_id', 'device_code', 'grant_type']);
        for (const key of Object.keys(parsed)) {
          if (!allowedKeys.has(key)) {
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': allowOrigin,
              Vary: 'Origin',
            });
            res.end(JSON.stringify({ error: `Unexpected parameter: ${key}` }));
            return;
          }
        }

        forwardPayload = {
          client_id: parsed.client_id,
          device_code: parsed.device_code,
          grant_type: parsed.grant_type,
        };
      }

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
        body: JSON.stringify(forwardPayload),
      });

      const data = await ghRes.json();
      res.writeHead(ghRes.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        Vary: 'Origin',
      });
      res.end(JSON.stringify(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal proxy error';
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        Vary: 'Origin',
      });
      res.end(JSON.stringify({ error: msg }));
    }
  };
}

export function createAuthProxyVitePlugin() {
  const middleware = createAuthMiddleware();
  return {
    name: 'md-comments-auth-proxy',
    configureServer(server: { middlewares: { use: (middleware: unknown) => void } }) {
      server.middlewares.use(middleware);
    },
  };
}
