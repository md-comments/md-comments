import * as vscode from 'vscode';
import { getAuthor, isGitHubLogin, warmAuthorCache } from './author';
import { collectAvatarLogins, warmGitHubAvatars } from './githubAvatars';
import { collectGitHubLogins, warmGitHubDisplayNames } from './githubDisplayNames';
import { readComments } from './commentStore';
import { CommentPreviewPanel } from './commentPreviewPanel';
import { extendMarkdownIt } from './markdownItPlugin';
import { executeCommentAction, type CommentActionMessage } from './commentActions';
import { parsePreviewCommandArg } from './previewCommand';
import { scanOrphansForMarkdown } from './orphan';
import { MarkdownCommentsCodeLensProvider } from './codeLensProvider';
import { initializeAuth, signIn, signOut, getOAuthToken } from './githubAuth';
import { initializeLogger, logDebug, logInfo, logError } from './logger';
import { globalOptimisticStore } from './optimisticStore';
import { resolveStorageKeyForUri } from './repoManager';

function mdUriFromMessage(msg: CommentActionMessage): vscode.Uri {
  const md = msg.md?.trim();
  if (md) {
    if (md.startsWith('file://')) {
      return vscode.Uri.parse(md);
    }
    return vscode.Uri.file(md);
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    throw new Error('Open the Markdown file in the editor (preview lost document path)');
  }
  return editor.document.uri;
}

let globalCodeLensProvider: MarkdownCommentsCodeLensProvider | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

async function updateStatusBar(): Promise<void> {
  if (!statusBarItem) return;
  const token = await getOAuthToken();
  logDebug('updateStatusBar token exists:', !!token);
  if (token) {
    const author = await getAuthor();
    statusBarItem.text = `$(github) ${author}`;
    statusBarItem.tooltip = 'Markdown Comments: Remote GitHub storage active';
    statusBarItem.command = undefined;
  } else {
    statusBarItem.text = '$(warning) Not Logged In to GitHub';
    statusBarItem.tooltip = 'Markdown Comments: You are not logged in to GitHub. Click to sign in.';
    statusBarItem.command = 'mdComments.signIn';
  }
  statusBarItem.show();
}

async function refreshPreview(forceRemote = false): Promise<void> {
  logDebug(`refreshPreview triggered, forceRemote=${forceRemote}`);
  globalCodeLensProvider?.refresh();
  const editor = vscode.window.activeTextEditor;
  if (
    forceRemote &&
    editor?.document &&
    (editor.document.languageId === 'markdown' || editor.document.uri.path.endsWith('.md'))
  ) {
    try {
      const key = await resolveStorageKeyForUri(editor.document.uri);
      if (key) {
        globalOptimisticStore.invalidate(key);
      }
      void readComments(editor.document.uri, true);
      CommentPreviewPanel.refreshForUri(editor.document.uri, true);
    } catch (err) {
      logError('refreshPreview invalidating/reading remote failed', err);
    }
  }
  try {
    await warmAuthorCache();
  } catch (err) {
    logError('refreshPreview warmAuthorCache failed', err);
  }
  try {
    await updateStatusBar();
  } catch (err) {
    logError('refreshPreview updateStatusBar failed', err);
  }
  try {
    await vscode.commands.executeCommand('markdown.preview.refresh');
  } catch (err) {
    logDebug('refreshPreview markdown.preview.refresh failed or preview not open', err);
  }
}

async function handlePreviewAction(raw: unknown): Promise<void> {
  logDebug('handlePreviewAction raw msg:', raw);
  const msg = parsePreviewCommandArg(raw);
  const mdUri = mdUriFromMessage(msg);
  await executeCommentAction(mdUri, msg);
  try {
    const comments = await readComments(mdUri);
    const logins = collectGitHubLogins(comments);
    await warmGitHubDisplayNames(logins);
    await warmGitHubAvatars(collectAvatarLogins(comments));
  } catch (err) {
    logError('handlePreviewAction warming avatars/names failed', err);
  }
  CommentPreviewPanel.refreshForUri(mdUri);
  await refreshPreview();
}

async function handleUri(uri: vscode.Uri): Promise<void> {
  logDebug('handleUri query:', uri.query);
  const params = new URLSearchParams(uri.query);
  const action = params.get('action');
  if (!action) {
    return;
  }
  const md = params.get('md');
  const msg: CommentActionMessage = {
    action,
    md: md ? decodeURIComponent(md) : undefined,
    body: params.get('body') ? `b64:${params.get('body')}` : undefined,
    text: params.get('text') ? `b64:${params.get('text')}` : undefined,
    heading: params.get('heading') ? `b64:${params.get('heading')}` : undefined,
    hash: params.get('hash') ?? undefined,
    index: params.get('index') ?? undefined,
    rootId: params.get('rootId') ?? undefined,
    type: params.get('type') ?? undefined,
    id: params.get('id') ?? undefined,
    targetId: params.get('targetId') ?? undefined,
    kind: params.get('kind') ?? undefined,
    emoji: params.get('emoji') ? `b64:${params.get('emoji')}` : undefined,
  };
  await handlePreviewAction(msg);
}

export function activate(context: vscode.ExtensionContext): {
  extendMarkdownIt: typeof extendMarkdownIt;
} {
  initializeLogger(context);
  logInfo('Markdown Comments extension activate() invoked');
  initializeAuth(context);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  void updateStatusBar();

  void (async () => {
    try {
      await warmAuthorCache();
      const name = await getAuthor();
      logInfo(`Comment author resolved: ${name}`);
      if (isGitHubLogin(name)) {
        await warmGitHubDisplayNames([name]);
        await warmGitHubAvatars([name]);
      }
    } catch (err) {
      logError('Error preloading author/names/avatars', err);
    }
  })();

  globalCodeLensProvider = new MarkdownCommentsCodeLensProvider();

  context.subscriptions.push(
    statusBarItem,
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, globalCodeLensProvider),
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === 'markdown') {
        logDebug('onDidOpenTextDocument:', doc.uri.toString());
        void warmAuthorCache();
        void updateStatusBar();
        void readComments(doc.uri, true).then((comments) => {
          logDebug(
            `Pre-warmed comments onDidOpenTextDocument, count: inline=${comments.inline_comments.length}, page=${comments.page_comments.length}`
          );
        });
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === 'markdown' || editor?.document.uri.path.endsWith('.md')) {
        logDebug('onDidChangeActiveTextEditor:', editor.document.uri.toString());
        void readComments(editor.document.uri, true).then((comments) => {
          logDebug(
            `Pre-warmed comments onDidChangeActiveTextEditor, count: inline=${comments.inline_comments.length}, page=${comments.page_comments.length}`
          );
        });
      }
    }),
    vscode.window.registerUriHandler({
      handleUri: async (uri) => {
        try {
          logInfo(`URI handler invoked: ${uri.toString()}`);
          await handleUri(uri);
        } catch (err) {
          logError('URI handler failed', err);
          vscode.window.showErrorMessage(
            `Markdown Comments: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      },
    }),
    vscode.commands.registerCommand('mdComments.signIn', async () => {
      logInfo('Command mdComments.signIn invoked');
      await signIn();
      await refreshPreview();
    }),
    vscode.commands.registerCommand('mdComments.signOut', async () => {
      logInfo('Command mdComments.signOut invoked');
      await signOut();
      await refreshPreview();
    }),
    vscode.commands.registerCommand(
      'mdComments.openCommentPreview',
      async (uriArg?: vscode.Uri) => {
        let doc: vscode.TextDocument | undefined;
        if (uriArg && uriArg instanceof vscode.Uri) {
          try {
            doc = await vscode.workspace.openTextDocument(uriArg);
          } catch (err) {
            logError('Failed to open document from URI arg:', err);
          }
        }
        if (!doc) {
          doc = vscode.window.activeTextEditor?.document;
        }

        const targetUri = doc?.uri || (uriArg instanceof vscode.Uri ? uriArg : undefined);
        logInfo('Command mdComments.openCommentPreview invoked, doc exists:', !!doc);

        const previewMode = vscode.workspace
          .getConfiguration('mdComments')
          .get<string>('previewMode', 'standalone');

        if (previewMode === 'builtin') {
          try {
            await vscode.commands.executeCommand('markdown.showPreviewToSide', targetUri);
            return;
          } catch (err) {
            logError(
              'Failed to open native markdown preview to side, falling back to standalone:',
              err
            );
          }
        }

        if (!doc || (doc.languageId !== 'markdown' && !doc.uri.path.endsWith('.md'))) {
          vscode.window.showWarningMessage('Open a Markdown (.md) file first');
          return;
        }
        CommentPreviewPanel.show(context.extensionUri, doc, vscode.ViewColumn.Beside);
        logInfo(`Opened comment preview panel for ${doc.uri.fsPath}`);
      }
    ),
    vscode.commands.registerCommand(
      'mdComments.openStandaloneCommentPreview',
      async (uriArg?: vscode.Uri) => {
        let doc: vscode.TextDocument | undefined;
        if (uriArg && uriArg instanceof vscode.Uri) {
          try {
            doc = await vscode.workspace.openTextDocument(uriArg);
          } catch (err) {
            logError('Failed to open document from URI arg:', err);
          }
        }
        if (!doc) {
          doc = vscode.window.activeTextEditor?.document;
        }
        if (!doc || (doc.languageId !== 'markdown' && !doc.uri.path.endsWith('.md'))) {
          vscode.window.showWarningMessage('Open a Markdown (.md) file first');
          return;
        }
        CommentPreviewPanel.show(context.extensionUri, doc, vscode.ViewColumn.Beside);
        logInfo(`Opened standalone comment preview panel for ${doc.uri.fsPath}`);
      }
    ),
    vscode.commands.registerCommand(
      'mdComments.toggleCommentPreview',
      async (uriArg?: vscode.Uri) => {
        const previewMode = vscode.workspace
          .getConfiguration('mdComments')
          .get<string>('previewMode', 'standalone');

        const editor = vscode.window.activeTextEditor;
        const targetUri = uriArg || editor?.document.uri;
        if (!targetUri) {
          vscode.window.showWarningMessage('Open a Markdown (.md) file first');
          return;
        }

        if (previewMode === 'builtin') {
          await vscode.commands.executeCommand('markdown.showPreviewToSide', targetUri);
          return;
        }

        if (CommentPreviewPanel.isOpenForUri(targetUri)) {
          CommentPreviewPanel.closeForUri(targetUri);
        } else {
          await vscode.commands.executeCommand('mdComments.openCommentPreview', targetUri);
        }
      }
    ),
    vscode.commands.registerCommand(
      'mdComments.handlePreviewAction',
      async (...args: unknown[]) => {
        try {
          logDebug('Command mdComments.handlePreviewAction invoked, args:', args);
          await handlePreviewAction(args[0]);
        } catch (err) {
          logError('Command mdComments.handlePreviewAction failed', err);
          vscode.window.showErrorMessage(
            `Markdown Comments: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    ),
    vscode.commands.registerCommand('mdComments.refreshPreview', () => refreshPreview(true)),
    vscode.commands.registerCommand('mdComments.scanOrphans', async () => {
      const editor = vscode.window.activeTextEditor;
      logInfo('Command mdComments.scanOrphans invoked');
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('Open a Markdown file to scan for orphans');
        return;
      }
      const count = await scanOrphansForMarkdown(editor.document.uri);
      vscode.window.showInformationMessage(
        count > 0
          ? `Markdown Comments: marked ${count} orphaned comment(s)`
          : 'Markdown Comments: no orphan updates needed'
      );
      await refreshPreview();
    }),
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      if (doc.languageId !== 'markdown') {
        return;
      }
      logDebug('onDidSaveTextDocument:', doc.uri.toString());
      const count = await scanOrphansForMarkdown(doc.uri);
      if (count > 0) {
        vscode.window.showWarningMessage(
          `Markdown Comments: ${count} inline comment(s) may be orphaned after your edit`
        );
      }
      CommentPreviewPanel.refreshForUri(doc.uri);
      await refreshPreview();
    }),
    vscode.window.onDidChangeWindowState(async (windowState) => {
      if (windowState.focused) {
        logDebug('VS Code window focused, checking comments refresh');
        const editor = vscode.window.activeTextEditor;
        if (
          editor?.document &&
          (editor.document.languageId === 'markdown' || editor.document.uri.path.endsWith('.md'))
        ) {
          CommentPreviewPanel.refreshForUri(editor.document.uri, false);
          await refreshPreview(false);
        }
      }
    })
  );

  const commentsWatcher = vscode.workspace.createFileSystemWatcher('**/*.comments.y*ml');
  const handleCommentsFileChange = async (commentsUri: vscode.Uri) => {
    logDebug('Comments file changed externally:', commentsUri.toString());
    const mdPath = commentsUri.path.replace(/\.comments\.ya?ml$/i, '.md');
    const mdUri = commentsUri.with({ path: mdPath });
    try {
      const key = await resolveStorageKeyForUri(mdUri);
      if (key) {
        globalOptimisticStore.invalidate(key);
      }
    } catch {
      // ignore
    }
    CommentPreviewPanel.refreshForUri(mdUri, true);
    await refreshPreview(true);
  };

  context.subscriptions.push(
    commentsWatcher,
    commentsWatcher.onDidChange(handleCommentsFileChange),
    commentsWatcher.onDidCreate(handleCommentsFileChange),
    commentsWatcher.onDidDelete(handleCommentsFileChange)
  );

  return { extendMarkdownIt };
}

export function deactivate(): void {}
