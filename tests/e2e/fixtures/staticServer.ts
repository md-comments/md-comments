import http from 'http';
import fs from 'fs';
import path from 'path';

export interface StaticServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

export interface StaticServerOptions {
  basePath?: string;
}

/**
 * Starts a lightweight, zero-dependency HTTP server on an ephemeral OS-assigned port.
 */
export function startStaticServer(
  rootDir: string,
  options?: StaticServerOptions
): Promise<StaticServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (options?.basePath && reqPath.startsWith(options.basePath)) {
        reqPath = reqPath.slice(options.basePath.length);
        if (!reqPath.startsWith('/')) {
          reqPath = '/' + reqPath;
        }
      }
      let filePath = path.join(rootDir, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not Found: ${reqPath}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to acquire listening port'));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        port: address.port,
        close: () => new Promise((resClose) => server.close(() => resClose())),
      });
    });
  });
}
