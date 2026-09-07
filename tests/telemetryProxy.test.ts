import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker, { Env } from '../infrastructure/telemetry-proxy/src/worker';

describe('Cloudflare Worker Telemetry Proxy (telemetryProxy)', () => {
  let mockEnv: Env;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globalFetchMock: any;

  beforeEach(() => {
    mockEnv = {
      UPSTREAM_OTLP_ENDPOINT: 'https://otlp-mock.grafana.net/otlp',
      UPSTREAM_AUTH_HEADER: 'Basic MTIzNDU2OmdsY19leU1vY2s=',
      MAX_REQUESTS_PER_MINUTE: '5',
      ALLOWED_ORIGINS: '*',
    };

    globalFetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', globalFetchMock);
  });

  it('should handle CORS preflight OPTIONS requests with HTTP 204', async () => {
    const request = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'OPTIONS',
      headers: {
        Origin: 'chrome-extension://mjlhdjonjfcedkbpajkfeidfebefhkpp',
        'Access-Control-Request-Method': 'POST',
      },
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'chrome-extension://mjlhdjonjfcedkbpajkfeidfebefhkpp'
    );
  });

  it('should respond to health checks at /health with HTTP 200', async () => {
    const request = new Request('https://telemetry.md-comments.org/health', {
      method: 'GET',
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('md-comments-telemetry-proxy');
  });

  it('should reject invalid paths with HTTP 404', async () => {
    const request = new Request('https://telemetry.md-comments.org/unsupported', {
      method: 'POST',
      body: JSON.stringify({ resourceLogs: [] }),
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(404);
  });

  it('should enforce INV-ZERO-CLIENT-SECRETS by injecting upstream Authorization header', async () => {
    const payload = {
      resourceLogs: [
        {
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'md-comments' } }],
          },
          scopeLogs: [],
        },
      ],
    };

    const request = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.1',
      },
      body: JSON.stringify(payload),
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);

    // Verify upstream call
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = globalFetchMock.mock.calls[0];
    expect(callUrl).toBe('https://otlp-mock.grafana.net/otlp/v1/logs');
    expect(callInit.method).toBe('POST');
    expect(callInit.headers.get('Authorization')).toBe('Basic MTIzNDU2OmdsY19leU1vY2s=');
  });

  it('should enforce INV-QUOTA-DEFENSE rate-limiting (HTTP 429)', async () => {
    const ip = '203.0.113.42';
    const payload = JSON.stringify({ test: 'rate-limit' });

    for (let i = 0; i < 5; i++) {
      const req = new Request('https://telemetry.md-comments.org/v1/logs', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' },
        body: payload,
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
    }

    // 6th request from same IP should be blocked
    const blockedReq = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' },
      body: payload,
    });
    const blockedRes = await worker.fetch(blockedReq, mockEnv);
    expect(blockedRes.status).toBe(429);
    const body = await blockedRes.json();
    expect(body.error).toContain('Rate limit exceeded');
  });

  it('should reject payloads exceeding 64KB with HTTP 413 (INV-QUOTA-DEFENSE)', async () => {
    const largeString = 'a'.repeat(65 * 1024);
    const request = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(largeString.length),
      },
      body: largeString,
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(413);
  });

  it('should reject malformed JSON with HTTP 400', async () => {
    const request = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not-valid-json',
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(400);
  });

  it('should handle upstream failures gracefully with HTTP 502', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Connection reset by peer'));

    const request = new Request('https://telemetry.md-comments.org/v1/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: 'json' }),
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('Bad Gateway');
  });
});
