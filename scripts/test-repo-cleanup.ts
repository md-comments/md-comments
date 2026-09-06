import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CleanupOptions {
  token?: string;
  owner?: string;
  repo?: string;
  apiBase?: string;
}

export async function resetTestRepository(options: CleanupOptions = {}): Promise<void> {
  const token = options.token || process.env.TEST_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const owner = options.owner || process.env.TEST_REPO_OWNER || 'md-comments';
  const repo = options.repo || process.env.TEST_REPO_NAME || 'md-test';
  const apiBase = (
    options.apiBase ||
    process.env.TEST_GITHUB_API_URL ||
    'https://api.github.com'
  ).replace(/\/+$/, '');

  const isMockOrLocal = apiBase.includes('localhost') || apiBase.includes('127.0.0.1');

  if (!token && !isMockOrLocal) {
    console.warn(
      '[Test Repo] TEST_GITHUB_TOKEN not provided and not using local mock. Skipping remote repository cleanup.'
    );
    return;
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'md-comments-test-orchestration',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Wipe comment data refs
  const targetRefs = ['refs/md-comments/data', 'refs/notes/md-comments'];

  for (const ref of targetRefs) {
    const refEndpoint = ref.replace(/^refs\//, '');
    try {
      const res = await fetch(`${apiBase}/repos/${owner}/${repo}/git/refs/${refEndpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (res.status === 204 || res.status === 200) {
        console.log(`[Test Repo] Cleaned ref: ${ref}`);
      } else if (res.status === 404) {
        console.log(`[Test Repo] Ref ${ref} did not exist (already clean).`);
      } else {
        const text = await res.text();
        console.warn(
          `[Test Repo] Warning: DELETE ref ${ref} returned status ${res.status}: ${text}`
        );
      }
    } catch (err: any) {
      console.warn(`[Test Repo] Failed to clean ref ${ref}:`, err.message);
    }
  }

  // 2. Synchronize README.md test fixture
  try {
    const fixturePath = path.resolve(__dirname, '../tests/fixtures/sample-doc.md');
    let fixtureContent =
      '# Test Fixture Document\n\nThis is a clean markdown document used for automated testing.\n';
    if (fs.existsSync(fixturePath)) {
      fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    }

    let existingSha: string | undefined;
    const getRes = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/README.md`, {
      method: 'GET',
      headers,
    });

    if (getRes.ok) {
      const data: any = await getRes.json();
      existingSha = data.sha;
    }

    const putRes = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/README.md`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'ci: reset test fixture README.md [skip ci]',
        content: Buffer.from(fixtureContent, 'utf8').toString('base64'),
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (putRes.ok) {
      console.log('[Test Repo] Synchronized clean fixture README.md');
    } else {
      const errText = await putRes.text();
      console.warn(`[Test Repo] Could not reset README.md (status ${putRes.status}): ${errText}`);
    }
  } catch (err: any) {
    console.warn('[Test Repo] Notice: Failed to synchronize README.md fixture:', err.message);
  }
}

// Support direct script execution via CLI
if (process.argv[1] && process.argv[1].endsWith('test-repo-cleanup.ts')) {
  resetTestRepository()
    .then(() => {
      console.log('[Test Repo] Cleanup routine completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Test Repo] Cleanup routine failed:', err);
      process.exit(1);
    });
}
