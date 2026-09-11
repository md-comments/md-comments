import * as vscode from 'vscode';
import { executeCommentAction, type CommentActionMessage } from './commentActions';
import { renderMarkdownWithComments } from './markdownRender';
import { escapeHtml } from '../../shared/html';
import { logDebug, logError } from './logger';

const VIEW_TYPE = 'mdComments.commentPreview';

export class CommentPreviewPanel {
  private static panels = new Map<string, CommentPreviewPanel>();

  static show(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    column?: vscode.ViewColumn
  ): void {
    const key = document.uri.toString();
    const existing = CommentPreviewPanel.panels.get(key);
    if (existing) {
      existing.panel.reveal(column);
      void existing.refresh(true); // Fetch remote comments on panel open
      return;
    }
    new CommentPreviewPanel(extensionUri, document, column);
  }

  static refreshForUri(uri: vscode.Uri, forceRemote = false): void {
    CommentPreviewPanel.panels.get(uri.toString())?.refresh(forceRemote);
  }

  static isOpenForUri(uri: vscode.Uri): boolean {
    return CommentPreviewPanel.panels.has(uri.toString());
  }

  static closeForUri(uri: vscode.Uri): void {
    const p = CommentPreviewPanel.panels.get(uri.toString());
    if (p) {
      p.panel.dispose();
    }
  }

  static closeAll(): void {
    for (const panelObj of CommentPreviewPanel.panels.values()) {
      panelObj.panel.dispose();
    }
    CommentPreviewPanel.panels.clear();
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly mdUri: vscode.Uri;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    column?: vscode.ViewColumn
  ) {
    this.extensionUri = extensionUri;
    this.mdUri = document.uri;

    this.panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      `Comments: ${vscode.workspace.asRelativePath(document.uri)}`,
      column ?? vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        localResourceRoots: [extensionUri],
      }
    );

    CommentPreviewPanel.panels.set(this.mdUri.toString(), this);

    this.panel.webview.onDidReceiveMessage(
      async (msg: CommentActionMessage) => {
        logDebug('CommentPreviewPanel webview message received:', msg);
        const isManualRefresh = msg.action === 'refresh';
        await executeCommentAction(this.mdUri, msg);
        await this.refresh(isManualRefresh);
        try {
          await vscode.commands.executeCommand('mdComments.refreshPreview');
        } catch (err) {
          logError('Failed to execute mdComments.refreshPreview:', err);
        }
        try {
          await vscode.commands.executeCommand('markdown.preview.refresh');
        } catch {
          // ignore if native preview is not active
        }
      },
      undefined,
      this.disposables
    );

    this.panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible) {
          logDebug(`CommentPreviewPanel became visible for ${this.mdUri.toString()}`);
          void this.refresh(false);
        }
      },
      null,
      this.disposables
    );

    const pollInterval = setInterval(() => {
      if (this.panel.visible) {
        logDebug(`CommentPreviewPanel background poll for ${this.mdUri.toString()}`);
        void this.refresh(false);
      }
    }, 30000);
    this.disposables.push(new vscode.Disposable(() => clearInterval(pollInterval)));

    this.panel.onDidDispose(
      () => {
        logDebug('CommentPreviewPanel disposed for:', this.mdUri.toString());
        CommentPreviewPanel.panels.delete(this.mdUri.toString());
        while (this.disposables.length) {
          this.disposables.pop()?.dispose();
        }
      },
      null,
      this.disposables
    );

    void this.refresh(true); // Fetch remote comments on initial panel open
  }

  async refresh(forceRemote = false): Promise<void> {
    logDebug(
      `CommentPreviewPanel.refresh invoked for ${this.mdUri.toString()}, forceRemote=${forceRemote}`
    );
    const doc = await vscode.workspace.openTextDocument(this.mdUri);
    const bodyHtml = await renderMarkdownWithComments(doc.getText(), this.mdUri, forceRemote);
    const nonce = String(Date.now());
    const cssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview.css')
    );
    const mdCssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode-markdown.css')
    );
    const anchorsScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'inlineAnchors.js')
    );
    const sidebarScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'previewSidebar.js')
    );
    const actionsScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'previewActions.js')
    );
    const mentionScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'mentionAutocomplete.js')
    );
    const avatarScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'avatarFallback.js')
    );
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview-webview.js')
    );
    const mdPath = this.mdUri.fsPath;

    const themeKind = vscode.window.activeColorTheme.kind;
    const themeClass =
      themeKind === vscode.ColorThemeKind.Light
        ? 'vscode-light'
        : themeKind === vscode.ColorThemeKind.HighContrastLight
          ? 'vscode-high-contrast vscode-high-contrast-light'
          : themeKind === vscode.ColorThemeKind.HighContrast
            ? 'vscode-high-contrast vscode-high-contrast-dark'
            : 'vscode-dark';

    this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https://avatars.githubusercontent.com; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${cssUri}">
  <link rel="stylesheet" href="${mdCssUri}">
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body class="${themeClass}" data-md-webview="true" data-md-md-path="${escapeHtml(mdPath)}">
  ${bodyHtml}
  <script nonce="${nonce}" src="${anchorsScriptUri}"></script>
  <script nonce="${nonce}" src="${sidebarScriptUri}"></script>
  <script nonce="${nonce}" src="${actionsScriptUri}"></script>
  <script nonce="${nonce}" src="${mentionScriptUri}"></script>
  <script nonce="${nonce}" src="${avatarScriptUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
