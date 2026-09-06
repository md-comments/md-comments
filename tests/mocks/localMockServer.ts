import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface MockRef {
  ref: string;
  sha: string;
}

export interface MockFile {
  path: string;
  content: string; // raw utf8 or decoded
  sha: string;
}

export interface MockServerOptions {
  port?: number;
}

export class LocalMockServer {
  private server: http.Server | null = null;
  public port: number;
  public url: string = '';
  public refs: Map<string, MockRef> = new Map();
  public files: Map<string, MockFile> = new Map();
  public commits: Map<string, any> = new Map();
  public trees: Map<string, any> = new Map();
  public commitComments: any[] = [];

  constructor(options: MockServerOptions = {}) {
    this.port = options.port ?? 0;
    this.reset();
  }

  public reset(): void {
    this.refs.clear();
    this.files.clear();
    this.commits.clear();
    this.trees.clear();
    this.commitComments = [];

    // Default main ref
    const initSha = this.generateSha('init-commit');
    this.refs.set('refs/heads/main', { ref: 'refs/heads/main', sha: initSha });
    this.commits.set(initSha, {
      sha: initSha,
      message: 'Initial commit',
      tree: { sha: this.generateSha('init-tree') },
      parents: [],
    });

    // Default README.md
    const readmeContent = '# Test Fixture Document\n\nDefault local mock README fixture.\n';
    const readmeSha = this.generateSha(readmeContent);
    this.files.set('README.md', {
      path: 'README.md',
      content: readmeContent,
      sha: readmeSha,
    });
  }

  public generateSha(seed: string): string {
    return crypto
      .createHash('sha1')
      .update(seed + Date.now() + Math.random())
      .digest('hex');
  }

  public async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, '127.0.0.1', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          this.url = `http://127.0.0.1:${this.port}`;
          resolve(this.url);
        } else {
          reject(new Error('Failed to obtain server address'));
        }
      });
      this.server.on('error', reject);
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve();
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
      this.server = null;
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method || 'GET').toUpperCase();

    // Parse body for POST / PUT / PATCH
    let bodyJson: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const bodyStr = Buffer.concat(chunks).toString('utf8');
        if (bodyStr.trim()) {
          bodyJson = JSON.parse(bodyStr);
        }
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON body' }));
        return;
      }
    }

    // Default response helper
    const sendJson = (status: number, data: any) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      });
      res.end(JSON.stringify(data));
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      });
      res.end();
      return;
    }

    // 1. GET /user
    if (pathname === '/user' && method === 'GET') {
      return sendJson(200, {
        login: 'test-runner-bot',
        id: 999999,
        name: 'Test Runner Bot',
        avatar_url: 'https://github.com/ghost.png',
        html_url: 'https://github.com/test-runner-bot',
      });
    }

    // 1b. GET /user/installations
    if (pathname === '/user/installations' && method === 'GET') {
      return sendJson(200, {
        total_count: 1,
        installations: [
          {
            id: 12345,
            account: {
              login: 'md-comments',
            },
            repository_selection: 'all',
            app_slug: 'markdown-comments',
          },
        ],
      });
    }

    // 1c. POST /graphql
    if (pathname === '/graphql' && method === 'POST') {
      return sendJson(200, {
        data: {
          viewer: {
            login: 'test-runner-bot',
            avatarUrl: 'https://github.com/ghost.png',
          },
          repository: {
            id: 'repo_node_id_123',
            viewerPermission: 'ADMIN',
            defaultBranchRef: {
              name: 'main',
              target: { oid: '1111222233334444555566667777888899990000' },
            },
            ref: {
              target: { oid: '1111222233334444555566667777888899990000' },
              branchProtectionRule: null,
            },
          },
        },
      });
    }

    // 2. Git Refs endpoints: /repos/:owner/:repo/git/refs/* or /repos/:owner/:repo/git/ref/*
    const gitRefMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/git\/refs?\/(.+)$/);
    if (gitRefMatch) {
      const refSuffix = gitRefMatch[1];
      const fullRef = refSuffix.startsWith('refs/') ? refSuffix : `refs/${refSuffix}`;

      if (method === 'GET') {
        const found = this.refs.get(fullRef);
        if (!found) {
          return sendJson(404, { message: `Not Found: ref ${fullRef}` });
        }
        return sendJson(200, {
          ref: found.ref,
          node_id: 'MDM6UmVm' + Buffer.from(found.ref).toString('base64'),
          url: `${this.url}${pathname}`,
          object: {
            sha: found.sha,
            type: 'commit',
            url: `${this.url}/git/commits/${found.sha}`,
          },
        });
      }

      if (method === 'PATCH') {
        const found = this.refs.get(fullRef);
        if (!found) {
          return sendJson(404, { message: `Ref ${fullRef} not found for PATCH` });
        }
        const updated: MockRef = { ref: fullRef, sha: bodyJson?.sha || this.generateSha('commit') };
        this.refs.set(fullRef, updated);
        return sendJson(200, {
          ref: updated.ref,
          node_id: 'MDM6UmVm' + Buffer.from(updated.ref).toString('base64'),
          url: `${this.url}${pathname}`,
          object: {
            sha: updated.sha,
            type: 'commit',
            url: `${this.url}/git/commits/${updated.sha}`,
          },
        });
      }

      if (method === 'DELETE') {
        if (!this.refs.has(fullRef)) {
          return sendJson(404, { message: `Ref ${fullRef} not found` });
        }
        this.refs.delete(fullRef);
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
        });
        res.end();
        return;
      }
    }

    // 3. POST /repos/:owner/:repo/git/refs (create ref)
    const createRefMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/git\/refs$/);
    if (createRefMatch && method === 'POST') {
      const refName = bodyJson?.ref;
      const sha = bodyJson?.sha || this.generateSha('commit');
      if (!refName) {
        return sendJson(422, { message: 'Missing ref name' });
      }
      const fullRef = refName.startsWith('refs/') ? refName : `refs/${refName}`;
      const newRef: MockRef = { ref: fullRef, sha };
      this.refs.set(fullRef, newRef);
      return sendJson(201, {
        ref: newRef.ref,
        node_id: 'MDM6UmVm' + Buffer.from(newRef.ref).toString('base64'),
        url: `${this.url}/repos/owner/repo/git/${newRef.ref}`,
        object: {
          sha: newRef.sha,
          type: 'commit',
          url: `${this.url}/git/commits/${newRef.sha}`,
        },
      });
    }

    // 4. POST /repos/:owner/:repo/git/trees
    const treesMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/git\/trees$/);
    if (treesMatch && method === 'POST') {
      const treeSha = this.generateSha('tree');
      const treeObj = {
        sha: treeSha,
        url: `${this.url}${pathname}/${treeSha}`,
        tree: bodyJson?.tree || [],
      };
      this.trees.set(treeSha, treeObj);
      return sendJson(201, treeObj);
    }

    // 5. POST /repos/:owner/:repo/git/commits
    const commitsMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/git\/commits$/);
    if (commitsMatch && method === 'POST') {
      const commitSha = this.generateSha('commit');
      const commitObj = {
        sha: commitSha,
        url: `${this.url}${pathname}/${commitSha}`,
        message: bodyJson?.message || 'commit',
        tree: { sha: bodyJson?.tree || this.generateSha('tree') },
        parents: (bodyJson?.parents || []).map((p: string) => ({ sha: p })),
      };
      this.commits.set(commitSha, commitObj);
      return sendJson(201, commitObj);
    }

    // 5b. Commit comments: /repos/:owner/:repo/commits/:sha/comments
    const commitCommentsMatch = pathname.match(
      /^\/repos\/[^/]+\/[^/]+\/commits\/([^/]+)\/comments$/
    );
    if (commitCommentsMatch) {
      if (method === 'POST') {
        const commentId = Math.floor(Math.random() * 1000000);
        const commentObj = {
          id: commentId,
          body: bodyJson?.body || '',
          commit_id: commitCommentsMatch[1],
          created_at: new Date().toISOString(),
        };
        this.commitComments.push(commentObj);
        return sendJson(201, commentObj);
      }
      if (method === 'GET') {
        return sendJson(200, this.commitComments);
      }
    }

    // 5c. Repository commit comments list & delete: /repos/:owner/:repo/comments/:id
    const repoCommentsMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/comments(?:\/(\d+))?$/);
    if (repoCommentsMatch) {
      const commentIdStr = repoCommentsMatch[1];
      if (commentIdStr && method === 'DELETE') {
        const idNum = parseInt(commentIdStr, 10);
        this.commitComments = this.commitComments.filter((c) => c.id !== idNum);
        return sendJson(204, {});
      }
      if (method === 'GET') {
        return sendJson(200, this.commitComments);
      }
    }

    // 6. Contents API: /repos/:owner/:repo/contents/:path*
    const contentsMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
    if (contentsMatch) {
      const filePath = decodeURIComponent(contentsMatch[1]);

      if (method === 'GET') {
        const file = this.files.get(filePath);
        if (!file) {
          return sendJson(404, { message: `File not found: ${filePath}` });
        }
        const b64 = Buffer.from(file.content, 'utf8').toString('base64');
        return sendJson(200, {
          name: filePath.split('/').pop(),
          path: filePath,
          sha: file.sha,
          size: Buffer.byteLength(file.content),
          url: `${this.url}${pathname}`,
          content: b64,
          encoding: 'base64',
        });
      }

      if (method === 'PUT') {
        const b64Content = bodyJson?.content || '';
        const decodedContent = Buffer.from(b64Content, 'base64').toString('utf8');
        const newSha = this.generateSha(decodedContent);
        const updatedFile: MockFile = {
          path: filePath,
          content: decodedContent,
          sha: newSha,
        };
        this.files.set(filePath, updatedFile);

        return sendJson(200, {
          content: {
            name: filePath.split('/').pop(),
            path: filePath,
            sha: newSha,
            size: Buffer.byteLength(decodedContent),
          },
          commit: {
            sha: this.generateSha('commit-put'),
            message: bodyJson?.message || 'Update file',
          },
        });
      }
    }

    // 7. Collaborators API: /repos/:owner/:repo/collaborators
    const collaboratorsMatch = pathname.match(/^\/repos\/[^/]+\/[^/]+\/collaborators$/);
    if (collaboratorsMatch && method === 'GET') {
      return sendJson(200, [
        { login: 'alice', id: 101, avatar_url: 'https://github.com/alice.png' },
        { login: 'bob', id: 102, avatar_url: 'https://github.com/bob.png' },
        { login: 'carol', id: 103, avatar_url: 'https://github.com/carol.png' },
        {
          login: 'md-comments-test-mention',
          id: 104,
          avatar_url: 'https://github.com/md-comments-test-mention.png',
        },
        { login: 'test-runner-bot', id: 999999, avatar_url: 'https://github.com/ghost.png' },
      ]);
    }

    // 8. Rate limit API: /rate_limit
    if (pathname === '/rate_limit' && method === 'GET') {
      return sendJson(200, {
        resources: {
          core: {
            limit: 5000,
            remaining: 5000,
            reset: Math.floor(Date.now() / 1000) + 3600,
            used: 0,
          },
        },
      });
    }

    // 9. Fixture HTML: /fixture or /md-comments/md-test/blob/main/README.md
    if (pathname === '/fixture' || pathname.endsWith('.html') || pathname.includes('/blob/')) {
      const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');
      if (fs.existsSync(fixturePath)) {
        const html = fs.readFileSync(fixturePath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(html);
        return;
      }
    }

    // Fallback
    return sendJson(200, { ok: true, path: pathname, method });
  }
}

export function createLocalMockServer(options?: MockServerOptions): LocalMockServer {
  return new LocalMockServer(options);
}
