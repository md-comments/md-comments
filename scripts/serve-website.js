#!/usr/bin/env node

/**
 * Lightweight local dev server for the website with built-in GitHub OAuth Device Flow proxy.
 * Zero external dependencies (uses Node.js standard library http, fs, path).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(
  process.env.PORT ||
    process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] ||
    '4321',
  10
);
const WEBSITE_DIR = path.resolve(__dirname, '..', 'website');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. GitHub OAuth Device Flow Proxy
  if (
    pathname.includes('/api/md-comments/auth/device-code') ||
    pathname.includes('/api/md-comments/auth/access-token')
  ) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const isDeviceCode = pathname.includes('device-code');
    const targetUrl = isDeviceCode
      ? 'https://github.com/login/device/code'
      : 'https://github.com/login/oauth/access_token';

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf-8');
        const parsedBody = bodyStr ? JSON.parse(bodyStr) : {};

        const ghRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Markdown-Comments-Dev-Server',
          },
          body: JSON.stringify(parsedBody),
        });

        const data = await ghRes.json();
        res.writeHead(ghRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Proxy error' }));
      }
    });
    return;
  }

  // 2. Static File Serving
  let filePath = path.join(WEBSITE_DIR, pathname);

  // Handle directory index
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found: ${pathname}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`500 Server Error: ${err.message}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Website dev server running at: http://localhost:${PORT}/`);
  console.log(`   Instant Mock Demo at:          http://localhost:${PORT}/demo-mock/`);
  console.log(`   Git Live Demo at:              http://localhost:${PORT}/demo-html/`);
  console.log(
    `   GitHub OAuth proxy active at:  http://localhost:${PORT}/api/md-comments/auth/*\n`
  );
});
