/**
 * Cloudflare Worker Telemetry Proxy for Markdown Comments.
 * Relays sanitized OpenTelemetry logs and traces from client interfaces
 * (Chrome/Safari extensions, Desktop IDEs, Obsidian, Web embeds)
 * to upstream APM backends (Grafana Cloud / SigNoz) with zero client secrets.
 */

export interface Env {
  UPSTREAM_OTLP_ENDPOINT: string;
  UPSTREAM_AUTH_HEADER: string;
  MAX_REQUESTS_PER_MINUTE?: string;
  ALLOWED_ORIGINS?: string;
}

// In-memory sliding window rate limiter per worker isolate
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_BODY_SIZE_BYTES = 64 * 1024; // 64 KB maximum payload limit

function getCorsHeaders(
  origin: string | null,
  allowedOriginsConfig?: string
): Record<string, string> {
  const allowed = allowedOriginsConfig
    ? allowedOriginsConfig.split(',').map((s) => s.trim())
    : ['*'];
  const allowOrigin =
    allowed.includes('*') || (origin && allowed.includes(origin)) ? origin || '*' : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, X-Interface-Name, X-Release-Version',
    'Access-Control-Max-Age': '86400',
  };
}

function checkRateLimit(clientIp: string, maxPerMin: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const record = ipRequestCounts.get(clientIp);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(clientIp, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxPerMin) {
    return false;
  }

  record.count += 1;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGINS);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Health check endpoint
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'md-comments-telemetry-proxy' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Restrict paths to standard OTel endpoints
    if (
      request.method !== 'POST' ||
      (!url.pathname.endsWith('/v1/logs') && !url.pathname.endsWith('/v1/traces'))
    ) {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Quota Defense: IP Rate Limiting (INV-QUOTA-DEFENSE)
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const maxPerMin = parseInt(env.MAX_REQUESTS_PER_MINUTE || '20', 10);
    if (!checkRateLimit(clientIp, maxPerMin)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Quota Defense: Body size verification (<64KB)
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload Too Large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let bodyText: string;
    try {
      bodyText = await request.text();
      if (bodyText.length > MAX_BODY_SIZE_BYTES) {
        return new Response(JSON.stringify({ error: 'Payload Too Large' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Validate JSON structure
      JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Upstream Proxy Relay with Secret Attachment (INV-ZERO-CLIENT-SECRETS)
    const upstreamBase = env.UPSTREAM_OTLP_ENDPOINT.replace(/\/$/, '');
    const upstreamPath = url.pathname.endsWith('/v1/traces') ? '/v1/traces' : '/v1/logs';
    const upstreamUrl = `${upstreamBase}${upstreamPath}`;

    const upstreamHeaders = new Headers({
      'Content-Type': 'application/json',
    });

    if (env.UPSTREAM_AUTH_HEADER) {
      let authHeader = env.UPSTREAM_AUTH_HEADER.trim();
      if (authHeader.startsWith('glc_')) {
        try {
          const jsonStr = atob(authHeader.slice(4));
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.o) {
            authHeader = `Basic ${btoa(`${parsed.o}:${authHeader}`)}`;
          }
        } catch {
          // If decoding fails, pass as-is
        }
      }
      upstreamHeaders.set('Authorization', authHeader);
    }

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: bodyText,
      });

      const resBody = await upstreamRes.text();
      return new Response(resBody, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json',
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upstream communication failure';
      return new Response(JSON.stringify({ error: 'Bad Gateway', details: errorMessage }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
