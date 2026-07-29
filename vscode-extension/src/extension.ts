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

const OUTPUT_CHANNEL = 'Markdown Comments';

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

async function refreshPreview(): Promise<void> {
  await warmAuthorCache();
  await vscode.commands.executeCommand('markdown.preview.refresh');
  globalCodeLensProvider?.refresh();
}

async function handlePreviewAction(raw: unknown): Promise<void> {
  const msg = parsePreviewCommandArg(raw);
  const mdUri = mdUriFromMessage(msg);
  await executeCommentAction(mdUri, msg);
  try {
    const comments = await readComments(mdUri);
    const logins = collectGitHubLogins(comments);
    await warmGitHubDisplayNames(logins);
    await warmGitHubAvatars(collectAvatarLogins(comments));
  } catch {
    /* optional */
  }
  CommentPreviewPanel.refreshForUri(mdUri);
  await refreshPreview();
}

async function handleUri(uri: vscode.Uri): Promise<void> {
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
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL);
  output.appendLine(`[${new Date().toISOString()}] Markdown Comments extension activated`);
  output.show(true);
  void (async () => {
    await warmAuthorCache();
    const name = await getAuthor();
    output.appendLine(`Comment author: ${name}`);
    if (isGitHubLogin(name)) {
      await warmGitHubDisplayNames([name]);
      await warmGitHubAvatars([name]);
    }
  })();

  globalCodeLensProvider = new MarkdownCommentsCodeLensProvider();

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, globalCodeLensProvider),
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === 'markdown') {
        void warmAuthorCache();
      }
    }),
    output,
    vscode.window.registerUriHandler({
      handleUri: async (uri) => {
        try {
          output.appendLine(`URI: ${uri.toString()}`);
          await handleUri(uri);
        } catch (err) {
          const text = err instanceof Error ? err.message : String(err);
          output.appendLine(`URI failed: ${text}`);
          vscode.window.showErrorMessage(`Markdown Comments: ${text}`);
        }
      },
    }),
    vscode.commands.registerCommand('mdComments.openCommentPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('Open a Markdown (.md) file first');
        return;
      }
      CommentPreviewPanel.show(context.extensionUri, editor.document, vscode.ViewColumn.Beside);
      output.appendLine(`Opened comment preview for ${editor.document.uri.fsPath}`);
    }),
    vscode.commands.registerCommand(
      'mdComments.handlePreviewAction',
      async (...args: unknown[]) => {
        try {
          output.appendLine(`Command invoked, args: ${JSON.stringify(args).slice(0, 200)}`);
          await handlePreviewAction(args[0]);
          output.appendLine('Command completed OK');
        } catch (err) {
          const text = err instanceof Error ? err.message : String(err);
          output.appendLine(`Command failed: ${text}`);
          vscode.window.showErrorMessage(`Markdown Comments: ${text}`);
        }
      }
    ),
    vscode.commands.registerCommand('mdComments.refreshPreview', refreshPreview),
    vscode.commands.registerCommand('mdComments.scanOrphans', async () => {
      const editor = vscode.window.activeTextEditor;
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
      const count = await scanOrphansForMarkdown(doc.uri);
      if (count > 0) {
        vscode.window.showWarningMessage(
          `Markdown Comments: ${count} inline comment(s) may be orphaned after your edit`
        );
      }
      CommentPreviewPanel.refreshForUri(doc.uri);
      await refreshPreview();
    }),
    vscode.workspace.createFileSystemWatcher('**/*.comments.yml').onDidChange((uri) => {
      output.appendLine(`Comments file changed: ${uri.fsPath}`);
      void refreshPreview();
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.fsPath.replace(/\.md$/i, '.comments.yml') === uri.fsPath) {
          CommentPreviewPanel.refreshForUri(editor.document.uri);
        }
      }
    })
  );

  return { extendMarkdownIt };
}

export function deactivate(): void {}
