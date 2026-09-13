import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('vscode', () => ({
  env: {
    uriScheme: 'vscode',
  },
  window: {
    showWarningMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn((key: string, defaultVal: unknown) => defaultVal),
    }),
    getWorkspaceFolder: vi.fn().mockReturnValue({
      uri: { fsPath: process.cwd(), toString: () => process.cwd() },
    }),
  },
  Uri: {
    file: (p: string) => ({ fsPath: p, toString: () => p }),
    parse: (uri: string) => ({ fsPath: uri, toString: () => uri }),
  },
}));

vi.mock('../vscode-extension/src/repoManager', () => ({
  resolveStorageKeyForUri: vi.fn().mockResolvedValue({
    owner: 'test-owner',
    repo: 'test-repo',
    filePath: 'test.md',
    commitHash: 'abc1234',
  }),
}));

vi.mock('../vscode-extension/src/author', () => ({
  getAuthor: vi.fn().mockResolvedValue('testuser'),
  getAuthorDisplayName: vi.fn().mockResolvedValue('Test User'),
  authorsMatch: vi.fn((a: string, b: string) => a.toLowerCase() === b.toLowerCase()),
}));

import {
  addInlineComment,
  addPageComment,
  addReply,
  deleteComment,
  resolveComment,
  unresolveComment,
  readComments,
} from '../vscode-extension/src/commentStore';
import { executeCommentAction } from '../vscode-extension/src/commentActions';
import { OptimisticCommentStore } from '../vscode-extension/src/optimisticStore';
import type { CommentsFile } from '../shared/types';
import * as vscode from 'vscode';

describe('VS Code Optimistic Comment Actions & Parity', () => {
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const inlineAnchorsJsPath = path.resolve(__dirname, '../vscode-extension/media/inlineAnchors.js');
  const previewJs = fs.readFileSync(previewJsPath, 'utf8');
  const previewWebviewJs = fs.readFileSync(previewWebviewJsPath, 'utf8');
  const inlineAnchorsJs = fs.readFileSync(inlineAnchorsJsPath, 'utf8');

  it('verifies preview.js and preview-webview.js define action SVG icons', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing ICON_EDIT`).toContain('ICON_EDIT =');
      expect(script, `${name} missing ICON_REACT`).toContain('ICON_REACT =');
      expect(script, `${name} missing ICON_RESOLVE`).toContain('ICON_RESOLVE =');
      expect(script, `${name} missing ICON_REOPEN`).toContain('ICON_REOPEN =');
      expect(script, `${name} missing ICON_DELETE`).toContain('ICON_DELETE =');
      expect(script, `${name} missing ICON_REPLY`).toContain('ICON_REPLY =');
    }
  });

  it('verifies insertOptimisticCard renders all action buttons and reply composer', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing action container`).toContain(
        'md-comments-actions md-comments-actions-icons'
      );
      expect(script, `${name} missing edit action`).toMatch(/actionIconBtn\(\s*'edit'/);
      expect(script, `${name} missing reply action`).toContain("actionIconBtn('reply', 'Reply'");
      expect(script, `${name} missing resolve action`).toContain(
        "actionIconBtn('resolve', 'Resolve thread'"
      );
      expect(script, `${name} missing react-picker action`).toContain(
        "actionIconBtn('react-picker', 'Add reaction'"
      );
      expect(script, `${name} missing delete action`).toMatch(/actionIconBtn\(\s*'delete'/);
      expect(script, `${name} missing reply-composer`).toContain(
        'reply-composer md-comments-reply-composer'
      );
    }
  });

  it('verifies insertOptimisticReply renders edit, react, and delete action buttons', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} reply missing edit action`).toMatch(
        /actionIconBtn\(\s*'edit',\s*'Edit reply'/
      );
      expect(script, `${name} reply missing react-picker action`).toContain(
        "actionIconBtn('react-picker', 'Add reaction'"
      );
      expect(script, `${name} reply missing delete action`).toMatch(
        /actionIconBtn\(\s*'delete',\s*'Delete reply'/
      );
    }
  });

  it('verifies stable comment ID generation and postAction parameter passing', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing generateCommentId`).toContain('generateCommentId');
      expect(script, `${name} missing id in addPage postAction`).toContain(
        "postAction({ action: 'addPage', body: body, id: commentId })"
      );
      expect(script, `${name} missing id in add postAction`).toContain("action: 'add'");
      expect(script, `${name} missing id in reply postAction`).toContain(
        "postAction({ action: 'reply'"
      );
    }
  });

  it('verifies applyCommentsUpdate in preview-webview.js does not abort when textarea is empty', () => {
    expect(previewWebviewJs).toContain('activeEl.value.trim().length > 0');
  });

  it('preserves client-provided IDs in commentStore addPageComment, addInlineComment, and addReply', async () => {
    const fakeUri = vscode.Uri.file('/fake/test.md');
    const customPageId = 'c-custom-page-12345';
    const customInlineId = 'c-custom-inline-67890';
    const customReplyId = 'c-custom-reply-54321';

    const { comment: pageComment } = await addPageComment(fakeUri, 'Hello page', customPageId);
    expect(pageComment.id).toBe(customPageId);

    const { comment: inlineComment } = await addInlineComment(fakeUri, {
      id: customInlineId,
      body: 'Hello inline',
      anchor_text: 'sample text',
      anchor_hash: '123',
      paragraph_index: 0,
      heading_context: 'Intro',
    });
    expect(inlineComment.id).toBe(customInlineId);

    await addReply(fakeUri, customPageId, 'page', 'A reply to page', customReplyId);
    const updated = await readComments(fakeUri);
    const targetPage = updated.page_comments.find((c) => c.id === customPageId);
    expect(targetPage).toBeDefined();
    expect(targetPage?.replies).toHaveLength(1);
    expect(targetPage?.replies[0].id).toBe(customReplyId);
  });

  it('unshifts newly added comments to the top (index 0) of comments file data', async () => {
    const fakeUri = vscode.Uri.file('/fake/sorting-test.md');

    await addPageComment(fakeUri, 'First page comment', 'p1');
    await addPageComment(fakeUri, 'Second page comment', 'p2');
    const dataAfterPage = await readComments(fakeUri);
    expect(dataAfterPage.page_comments[0].id).toBe('p2');
    expect(dataAfterPage.page_comments[1].id).toBe('p1');

    await addInlineComment(fakeUri, {
      id: 'i1',
      body: 'First inline comment',
      anchor_text: 'sample text',
      anchor_hash: '123',
      paragraph_index: 0,
      heading_context: 'Intro',
    });
    await addInlineComment(fakeUri, {
      id: 'i2',
      body: 'Second inline comment',
      anchor_text: 'sample text',
      anchor_hash: '123',
      paragraph_index: 0,
      heading_context: 'Intro',
    });
    const dataAfterInline = await readComments(fakeUri);
    expect(dataAfterInline.inline_comments[0].id).toBe('i2');
    expect(dataAfterInline.inline_comments[1].id).toBe('i1');
  });

  it('verifies insertOptimisticCard removes panel-loading-container in preview scripts', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing loading container removal`).toContain(
        "targetList.querySelector('.panel-loading-container')"
      );
    }
  });

  it('verifies preview scripts define removeOptimisticComment', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing removeOptimisticComment definition`).toContain(
        'function removeOptimisticComment('
      );
      expect(script, `${name} missing export on window`).toContain(
        'window.mdCommentsRemoveOptimisticComment = removeOptimisticComment'
      );
    }
  });

  it('verifies toggleReactionOptimistic strictly targets cards and replies, not render view anchors', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} missing scoped reply selector`).toContain(
        '.querySelector(\'.md-comments-reply[data-md-comment-id="'
      );
      expect(script, `${name} missing scoped card selector`).toContain(
        '.querySelector(\'.md-comments-card[data-md-comment-id="'
      );
      expect(
        script,
        `${name} should not use bare [data-md-comment-id] querySelector`
      ).not.toContain("document.querySelector('[data-md-comment-id=\"'");
    }
  });

  it('verifies inlineAnchors.js exports mdCommentsUnwrapAnchor for render view cleanup', () => {
    expect(inlineAnchorsJs).toContain('function unwrapAnchor(');
    expect(inlineAnchorsJs).toContain('window.mdCommentsUnwrapAnchor = unwrapAnchor');
  });

  it('resiliently deletes inline comments, page comments, and replies in commentStore', async () => {
    const fakeUri = vscode.Uri.file('/fake/deletion-resilience.md');
    const pageId = 'c-page-to-delete';
    const inlineId = 'c-inline-to-delete';
    const replyId = 'r-reply-to-delete';

    await addPageComment(fakeUri, 'Page comment to delete', pageId);
    await addInlineComment(fakeUri, {
      id: inlineId,
      body: 'Inline comment with reply',
      anchor_text: 'sample',
      anchor_hash: '123',
      paragraph_index: 0,
      heading_context: 'Heading',
    });
    await addReply(fakeUri, inlineId, 'inline', 'Reply to delete', replyId);

    const initialData = await readComments(fakeUri);
    expect(initialData.page_comments.some((c) => c.id === pageId)).toBe(true);
    expect(initialData.inline_comments.some((c) => c.id === inlineId)).toBe(true);

    // 1. Delete reply without specifying type or rootId
    await deleteComment(fakeUri, replyId);
    const dataAfterReplyDel = await readComments(fakeUri);
    const inlineCard = dataAfterReplyDel.inline_comments.find((c) => c.id === inlineId);
    expect(inlineCard?.replies.some((r) => r.id === replyId)).toBe(false);

    // 2. Delete page comment with mismatched/default type
    await deleteComment(fakeUri, pageId, 'inline');
    const dataAfterPageDel = await readComments(fakeUri);
    expect(dataAfterPageDel.page_comments.some((c) => c.id === pageId)).toBe(false);

    // 3. Delete inline comment
    await deleteComment(fakeUri, inlineId);
    const dataAfterInlineDel = await readComments(fakeUri);
    expect(dataAfterInlineDel.inline_comments.some((c) => c.id === inlineId)).toBe(false);

    // 4. Idempotently delete non-existent / unsaved IDs without throwing
    const nonExistentReplyId = 'c-mu05zvv3-0x1jbf-r-mu0600vs-5jy5a2';
    await expect(
      deleteComment(fakeUri, nonExistentReplyId, 'inline', 'reply', 'c-mu05zvv3-0x1jbf')
    ).resolves.toBeDefined();
    await expect(deleteComment(fakeUri, 'c-non-existent-root')).resolves.toBeDefined();
  });

  it('verifies removeOptimisticComment selects parent .md-comments-sidebar-thread to eliminate quote headers', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(
        script,
        `${name} missing card.closest('.md-comments-sidebar-thread, .md-comments-thread')`
      ).toContain("card.closest('.md-comments-sidebar-thread, .md-comments-thread')");
    }
  });

  it('verifies resolve and unresolve handlers toggle button icon, action, title, and resolved attributes', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      // Resolve sets unresolve action, Reopen thread title, and ICON_REOPEN
      expect(script, `${name} missing target action toggle to unresolve`).toContain(
        "target.setAttribute('data-md-action', 'unresolve')"
      );
      expect(script, `${name} missing title toggle to Reopen thread`).toContain(
        "target.setAttribute('title', 'Reopen thread')"
      );
      expect(script, `${name} missing icon toggle to ICON_REOPEN`).toContain(
        'target.innerHTML = ICON_REOPEN'
      );
      expect(script, `${name} missing data-md-resolved attribute set`).toContain(
        "card.setAttribute('data-md-resolved', 'true')"
      );

      // Unresolve sets resolve action, Resolve thread title, and ICON_RESOLVE
      expect(script, `${name} missing target action toggle to resolve`).toContain(
        "target.setAttribute('data-md-action', 'resolve')"
      );
      expect(script, `${name} missing title toggle to Resolve thread`).toContain(
        "target.setAttribute('title', 'Resolve thread')"
      );
      expect(script, `${name} missing icon toggle to ICON_RESOLVE`).toContain(
        'target.innerHTML = ICON_RESOLVE'
      );
      expect(script, `${name} missing data-md-resolved attribute remove`).toContain(
        "card.removeAttribute('data-md-resolved')"
      );
    }
  });

  it('verifies delete click handler dispatches postAction directly without custom confirmation popover', () => {
    for (const [name, script] of [
      ['preview.js', previewJs],
      ['preview-webview.js', previewWebviewJs],
    ] as const) {
      expect(script, `${name} should not contain showDeleteConfirm`).not.toContain(
        'function showDeleteConfirm('
      );
      expect(script, `${name} should not contain custom delete popover element`).not.toContain(
        'md-comments-confirm-popover'
      );
    }
  });

  it('verifies inlineAnchors.js clears container-marked classes and exports mdCommentsScheduleWire', () => {
    expect(inlineAnchorsJs).toContain("span.closest('[data-md-paragraph-index]')");
    expect(inlineAnchorsJs).toContain("container.classList.remove('md-comments-paragraph-marked')");
    expect(inlineAnchorsJs).toContain('window.mdCommentsScheduleWire = scheduleWire');
  });

  it('resiliently resolves and unresolves inline and page comments in commentStore', async () => {
    const fakeUri = vscode.Uri.file('/fake/resolve-resilience.md');
    const pageId = 'c-page-resolve';
    const inlineId = 'c-inline-resolve';

    await addPageComment(fakeUri, 'Page comment to resolve', pageId);
    await addInlineComment(fakeUri, {
      id: inlineId,
      body: 'Inline comment to resolve',
      anchor_text: 'sample',
      anchor_hash: '123',
      paragraph_index: 0,
      heading_context: 'Heading',
    });

    // 1. Resolve with mismatched / whitespace type
    await resolveComment(fakeUri, ` ${pageId} `, 'inline');
    let data = await readComments(fakeUri);
    let page = data.page_comments.find((c) => c.id === pageId);
    expect(page?.resolved).toBe(true);
    expect(page?.resolved_at).toBeTruthy();

    await resolveComment(fakeUri, inlineId, 'page');
    data = await readComments(fakeUri);
    let inline = data.inline_comments.find((c) => c.id === inlineId);
    expect(inline?.resolved).toBe(true);

    // 2. Unresolve
    await unresolveComment(fakeUri, pageId, 'inline');
    data = await readComments(fakeUri);
    page = data.page_comments.find((c) => c.id === pageId);
    expect(page?.resolved).toBe(false);
    expect(page?.resolved_at).toBeUndefined();

    await unresolveComment(fakeUri, inlineId, 'inline');
    data = await readComments(fakeUri);
    inline = data.inline_comments.find((c) => c.id === inlineId);
    expect(inline?.resolved).toBe(false);
  });

  it('verifies executeCommentAction requires native VS Code modal confirmation before deletion', async () => {
    const fakeUri = vscode.Uri.file('/fake/delete-confirm.md');
    const commentId = 'c-del-test';
    await addPageComment(fakeUri, 'To be deleted', commentId);

    // Verify comment exists
    let comments = await readComments(fakeUri);
    expect(comments.page_comments.some((c) => c.id === commentId)).toBe(true);

    // 1. User cancels native modal dialog
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce('Cancel' as any);
    const cancelResult = await executeCommentAction(fakeUri, {
      action: 'delete',
      id: commentId,
      type: 'page',
      kind: 'root',
    });
    expect(cancelResult).toBe(false);

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Delete this comment permanently? This cannot be undone.',
      { modal: true },
      'Delete',
      'Cancel'
    );
    comments = await readComments(fakeUri);
    expect(comments.page_comments.some((c) => c.id === commentId)).toBe(true);

    // 2. User confirms native modal dialog
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce('Delete' as any);
    const confirmResult = await executeCommentAction(fakeUri, {
      action: 'delete',
      id: commentId,
      type: 'page',
      kind: 'root',
    });
    expect(confirmResult).toBe(true);

    comments = await readComments(fakeUri);
    expect(comments.page_comments.some((c) => c.id === commentId)).toBe(false);
  });

  it('supports multiple sequential deletes with native modal confirmations', async () => {
    const fakeUri = vscode.Uri.file('/fake/delete-seq.md');
    const c1 = 'c-seq-1';
    const c2 = 'c-seq-2';
    await addPageComment(fakeUri, 'First comment', c1);
    await addPageComment(fakeUri, 'Second comment', c2);

    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Delete' as any);

    await executeCommentAction(fakeUri, { action: 'delete', id: c1, type: 'page', kind: 'root' });
    await executeCommentAction(fakeUri, { action: 'delete', id: c2, type: 'page', kind: 'root' });

    const comments = await readComments(fakeUri);
    expect(comments.page_comments.some((c) => c.id === c1)).toBe(false);
    expect(comments.page_comments.some((c) => c.id === c2)).toBe(false);
  });

  it('prevents resurrection of deleted comments via tombstones when remote fetch returns stale data', async () => {
    const key = { owner: 'test-owner', repo: 'test-repo', filePath: 'test.md' };
    const testStore = new OptimisticCommentStore();
    const initialData: CommentsFile = {
      inline_comments: [
        {
          id: 'inline-to-delete',
          author: 'alice',
          anchor_text: 'hello',
          anchor_hash: '123',
          paragraph_index: 0,
          heading_context: '',
          body: 'will be deleted',
          created_at: new Date().toISOString(),
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [
            {
              id: 'reply-to-delete',
              author: 'bob',
              body: 'reply',
              created_at: new Date().toISOString(),
              reactions: [],
            },
          ],
        },
        {
          id: 'inline-survivor',
          author: 'charlie',
          anchor_text: 'world',
          anchor_hash: '456',
          paragraph_index: 1,
          heading_context: '',
          body: 'stays',
          created_at: new Date().toISOString(),
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
        },
      ],
      page_comments: [],
    };

    // 1. Initial state populated
    testStore.updateComments(key, initialData, async () => {});

    // 2. Local deletion of inline-to-delete
    const remainingData: CommentsFile = {
      inline_comments: [initialData.inline_comments[1]],
      page_comments: [],
    };
    testStore.updateComments(
      key,
      remainingData,
      async () => {},
      new Set(['inline-to-delete', 'reply-to-delete'])
    );

    // 3. Remote fetch returns STALE data that still contains the deleted comment
    const fetched = await testStore.getComments(
      key,
      async () => initialData, // Stale backend return!
      true // forceRefresh
    );

    // 4. Verify tombstones prevented resurrection of deleted root and reply
    expect(fetched.inline_comments.some((c) => c.id === 'inline-to-delete')).toBe(false);
    expect(fetched.inline_comments.some((c) => c.id === 'inline-survivor')).toBe(true);
  });

  it('write barrier returns optimistic cache even if forceRefresh=true while remote write is in-flight', async () => {
    const key = { owner: 'test-owner', repo: 'test-repo', filePath: 'test.md' };
    const testStore = new OptimisticCommentStore();
    let resolveWrite: () => void = () => {};
    const pendingWrite = new Promise<void>((resolve) => {
      resolveWrite = resolve;
    });

    const data1: CommentsFile = {
      inline_comments: [
        {
          id: 'c-1',
          author: 'alice',
          anchor_text: 'txt',
          anchor_hash: 'h',
          paragraph_index: 0,
          heading_context: '',
          body: 'b1',
          created_at: new Date().toISOString(),
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
        },
      ],
      page_comments: [],
    };

    // Update with slow background write
    testStore.updateComments(key, data1, () => pendingWrite);
    expect(testStore.isWriting(key)).toBe(true);

    // Stale remote fetch should be blocked by in-flight write barrier
    let remoteCalled = false;
    const result = await testStore.getComments(
      key,
      async () => {
        remoteCalled = true;
        return { inline_comments: [], page_comments: [] };
      },
      true // forceRefresh requested
    );

    expect(remoteCalled).toBe(false);
    expect(result.inline_comments.length).toBe(1);
    expect(result.inline_comments[0].id).toBe('c-1');

    // Finish write
    resolveWrite();
    await Promise.resolve(); // let microtasks cycle
  });
});
