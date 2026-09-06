import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createLocalMockServer, LocalMockServer } from './mocks/localMockServer.js';
import { resetTestRepository } from '../scripts/test-repo-cleanup.js';
import { pathToExtension } from './e2e/fixtures/extensionFixture.js';

describe('Phase 0: Test Environment Orchestration Framework', () => {
  let mockServer: LocalMockServer;
  let serverUrl: string;

  beforeAll(async () => {
    mockServer = createLocalMockServer();
    serverUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('LocalMockServer Hermetic GitHub API', () => {
    it('serves /user profile', async () => {
      const res = await fetch(`${serverUrl}/user`);
      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.login).toBe('test-runner-bot');
    });

    it('manages Git refs (create, read, patch, delete)', async () => {
      // 1. Create ref
      const createRes = await fetch(`${serverUrl}/repos/md-comments/md-test/git/refs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'refs/md-comments/data', sha: '111122223333' }),
      });
      expect(createRes.status).toBe(201);

      // 2. Read ref
      const getRes = await fetch(
        `${serverUrl}/repos/md-comments/md-test/git/refs/md-comments/data`
      );
      expect(getRes.status).toBe(200);
      const getData: any = await getRes.json();
      expect(getData.object.sha).toBe('111122223333');

      // 3. Patch ref
      const patchRes = await fetch(
        `${serverUrl}/repos/md-comments/md-test/git/refs/md-comments/data`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: '444455556666' }),
        }
      );
      expect(patchRes.status).toBe(200);
      const patchData: any = await patchRes.json();
      expect(patchData.object.sha).toBe('444455556666');

      // 4. Delete ref
      const delRes = await fetch(
        `${serverUrl}/repos/md-comments/md-test/git/refs/md-comments/data`,
        {
          method: 'DELETE',
        }
      );
      expect(delRes.status).toBe(204);

      // 5. Verify deleted
      const afterRes = await fetch(
        `${serverUrl}/repos/md-comments/md-test/git/refs/md-comments/data`
      );
      expect(afterRes.status).toBe(404);
    });

    it('handles contents API and git trees/commits', async () => {
      // Trees
      const treeRes = await fetch(`${serverUrl}/repos/md-comments/md-test/git/trees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree: [{ path: 'test.md', mode: '100644', type: 'blob', content: '# Hello' }],
        }),
      });
      expect(treeRes.status).toBe(201);
      const treeData: any = await treeRes.json();
      expect(treeData.sha).toBeDefined();

      // Commits
      const commitRes = await fetch(`${serverUrl}/repos/md-comments/md-test/git/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test commit', tree: treeData.sha, parents: [] }),
      });
      expect(commitRes.status).toBe(201);
      const commitData: any = await commitRes.json();
      expect(commitData.sha).toBeDefined();

      // Read contents
      const getFileRes = await fetch(`${serverUrl}/repos/md-comments/md-test/contents/README.md`);
      expect(getFileRes.status).toBe(200);
    });
  });

  describe('test-repo-cleanup Script Execution', () => {
    it('wipes orphan comment refs and restores README.md fixture on mock server', async () => {
      // Pre-seed a comment ref
      await fetch(`${serverUrl}/repos/md-comments/md-test/git/refs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'refs/md-comments/data', sha: 'seed-sha-12345' }),
      });

      // Run cleanup targeting the mock server
      await resetTestRepository({
        apiBase: serverUrl,
        token: 'mock-token',
        owner: 'md-comments',
        repo: 'md-test',
      });

      // Verify ref was cleaned
      const refCheck = await fetch(
        `${serverUrl}/repos/md-comments/md-test/git/refs/md-comments/data`
      );
      expect(refCheck.status).toBe(404);

      // Verify README.md contains test fixture content
      const readmeRes = await fetch(`${serverUrl}/repos/md-comments/md-test/contents/README.md`);
      expect(readmeRes.status).toBe(200);
      const readmeData: any = await readmeRes.json();
      const content = Buffer.from(readmeData.content, 'base64').toString('utf8');
      expect(content).toContain('Markdown Comments Test Fixture');
    });

    it('gracefully handles missing token in offline mode without throwing', async () => {
      await expect(
        resetTestRepository({ apiBase: 'https://api.github.com', token: '' })
      ).resolves.not.toThrow();
    });
  });

  describe('Extension Fixture Environment', () => {
    it('locates valid chrome-extension build artifact directory with manifest.json', () => {
      expect(fs.existsSync(pathToExtension)).toBe(true);
      const manifestPath = path.join(pathToExtension, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeDefined();
    });
  });
});
