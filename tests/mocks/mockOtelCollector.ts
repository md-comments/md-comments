/**
 * Hermetic Mock OpenTelemetry Collector Server
 * In-memory HTTP server capturing OTLP /v1/logs and /v1/traces for automated testing.
 */

import http from 'http';
import { AddressInfo } from 'net';

export interface ReceivedLogBatch {
  headers: http.IncomingHttpHeaders;
  body: any;
  timestamp: number;
}

export class MockOtelCollector {
  private server: http.Server | null = null;
  private receivedBatches: ReceivedLogBatch[] = [];
  private port: number = 0;

  public async start(): Promise<string> {
    this.receivedBatches = [];

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          let parsed: any = null;
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch {
            parsed = body;
          }

          this.receivedBatches.push({
            headers: req.headers,
            body: parsed,
            timestamp: Date.now(),
          });

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ status: 'success' }));
        });
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server?.address() as AddressInfo;
        this.port = addr.port;
        resolve(`http://127.0.0.1:${this.port}`);
      });

      this.server.on('error', reject);
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getReceivedBatches(): ReceivedLogBatch[] {
    return [...this.receivedBatches];
  }

  public clear(): void {
    this.receivedBatches = [];
  }

  public getPort(): number {
    return this.port;
  }
}
