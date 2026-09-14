import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocked globalState and secrets
let mockGlobalStore: Record<string, unknown> = {};
const mockGlobalState = {
  get: vi.fn((key: string, defaultVal: unknown) => {
    return key in mockGlobalStore ? mockGlobalStore[key] : defaultVal;
  }),
  update: vi.fn(async (key: string, val: unknown) => {
    mockGlobalStore[key] = val;
  }),
};

let mockSecretStore: Record<string, string> = {};
const mockSecrets = {
  get: vi.fn(async (key: string) => mockSecretStore[key] ?? null),
  store: vi.fn(async (key: string, val: string) => {
    mockSecretStore[key] = val;
  }),
  delete: vi.fn(async (key: string) => {
    delete mockSecretStore[key];
  }),
  onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
};

let mockAuthSession: { accessToken: string; account: { label: string } } | undefined = undefined;

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn((key: string, defaultVal: unknown) => defaultVal),
    }),
    asRelativePath: vi.fn((uri: { fsPath: string }) => uri.fsPath),
  },
  authentication: {
    getSession: vi.fn(
      async (_provider: string, _scopes: string[], _opts: unknown) => mockAuthSession
    ),
    onDidChangeSessions: vi.fn(() => ({ dispose: vi.fn() })),
  },
  window: {
    createStatusBarItem: vi.fn().mockReturnValue({
      show: vi.fn(),
      text: '',
      tooltip: '',
      command: undefined,
    }),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  StatusBarAlignment: { Right: 2 },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path, scheme: 'file' }),
    parse: (uri: string) => ({ fsPath: uri, toString: () => uri, scheme: 'file' }),
  },
}));

import {
  initializeAuth,
  hasTokenSync,
  getOAuthToken,
  signOut,
  onDidChangeAuthState,
} from '../vscode-extension/src/githubAuth';
import { renderDocumentLayout } from '../vscode-extension/src/markdownItPlugin';

describe('VS Code GitHub Auth Persistence and Startup Synchronization', () => {
  beforeEach(() => {
    mockGlobalStore = {};
    mockSecretStore = {};
    mockAuthSession = undefined;
    vi.clearAllMocks();
  });

  it('restores hasTokenSync() synchronously as true on first launch if previously authenticated', () => {
    mockGlobalStore['github_has_token'] = true;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    // Without awaiting any promises, hasTokenSync() must immediately be true!
    expect(hasTokenSync()).toBe(true);
  });

  it('restores hasTokenSync() synchronously as false if not previously authenticated', () => {
    mockGlobalStore['github_has_token'] = false;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    expect(hasTokenSync()).toBe(false);
  });

  it('updates cached state, persists to globalState, and notifies onDidChangeAuthState when token is acquired', async () => {
    mockGlobalStore['github_has_token'] = false;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    expect(hasTokenSync()).toBe(false);

    const listener = vi.fn();
    const sub = onDidChangeAuthState(listener);

    // Simulate native auth session becoming available
    mockAuthSession = { accessToken: 'gho_secret123', account: { label: 'octocat' } };

    const token = await getOAuthToken();
    expect(token).toBe('gho_secret123');
    expect(hasTokenSync()).toBe(true);
    expect(mockGlobalState.update).toHaveBeenCalledWith('github_has_token', true);
    expect(listener).toHaveBeenCalledWith(true);

    sub.dispose();
  });

  it('updates cached state and persists false to globalState on signOut', async () => {
    mockGlobalStore['github_has_token'] = true;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    expect(hasTokenSync()).toBe(true);

    const listener = vi.fn();
    const sub = onDidChangeAuthState(listener);

    await signOut();

    expect(hasTokenSync()).toBe(false);
    expect(mockGlobalState.update).toHaveBeenCalledWith('github_has_token', false);
    expect(listener).toHaveBeenCalledWith(false);

    sub.dispose();
  });

  it('omits the "Not Logged In to GitHub" banner from rendered layout when hasTokenSync() is true', () => {
    mockGlobalStore['github_has_token'] = true;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    const mockCtx = {
      comments: { page_comments: [], inline_comments: [] },
      placements: [],
      blocks: [],
      mdPath: '/test/doc.md',
    };

    const html = renderDocumentLayout('<h1>Doc</h1>', mockCtx as any, '', '');
    expect(html).not.toContain('Not Logged In to GitHub');
    expect(html).not.toContain('md-comments-auth-banner');
  });

  it('includes the "Not Logged In to GitHub" banner in rendered layout when hasTokenSync() is false', () => {
    mockGlobalStore['github_has_token'] = false;

    initializeAuth({
      secrets: mockSecrets,
      globalState: mockGlobalState,
    } as any);

    const mockCtx = {
      comments: { page_comments: [], inline_comments: [] },
      placements: [],
      blocks: [],
      mdPath: '/test/doc.md',
    };

    const html = renderDocumentLayout('<h1>Doc</h1>', mockCtx as any, '', '');
    expect(html).toContain('Not Logged In to GitHub');
    expect(html).toContain('md-comments-auth-banner');
  });

  it('requests least-privilege public_repo scope by default (SEC-05)', async () => {
    let queriedScopes: string[] = [];
    const vscode = await import('vscode');
    (vscode.authentication.getSession as any).mockImplementation(
      async (_provider: string, scopes: string[]) => {
        queriedScopes = scopes;
        return { accessToken: 'token_123', account: { label: 'user' } };
      }
    );

    const token = await getOAuthToken();
    expect(token).toBe('token_123');
    expect(queriedScopes).toEqual(['public_repo']);
  });
});
