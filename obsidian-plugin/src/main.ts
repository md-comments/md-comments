import {
  Plugin,
  WorkspaceLeaf,
  TFile,
  PluginSettingTab,
  Setting,
  App,
  Modal,
  MarkdownView,
  Menu,
} from 'obsidian';
import { CommentStore } from './storage';
import { CommentsSidebarView, VIEW_TYPE_COMMENTS } from './sidebarView';
import { registerReadingViewProcessor } from './readingView';
import { createLivePreviewExtension } from './livePreview';
import { parseMarkdownAnchors, fnv1aHash } from '../../shared/anchor';
import { placeInlineComments, isOrphanedPlacement } from '../../shared/placement';
import type { AnchorBlock, InlineComment } from '../../shared/types';

export interface MarkdownCommentsSettings {
  authorName: string;
  reactionEmojis: string[];
}

const DEFAULT_SETTINGS: MarkdownCommentsSettings = {
  authorName: '',
  reactionEmojis: ['👍', '👀', '❤️', '🎉', '❓'],
};

export default class MarkdownCommentsPlugin extends Plugin {
  declare settings: MarkdownCommentsSettings;
  store!: CommentStore;

  // Cache parsed blocks for active post-processors and CodeMirror
  private blockCache = new Map<string, { mtime: number; blocks: AnchorBlock[] }>();

  async onload() {
    await this.loadSettings();

    // Set up Storage
    this.store = new CommentStore(this.app, () => this.settings.authorName || 'anonymous');

    // Auto-resolve author if empty
    if (!this.settings.authorName) {
      this.resolveDefaultAuthor().then((resolved) => {
        if (resolved && !this.settings.authorName) {
          this.settings.authorName = resolved;
          this.saveSettings();
        }
      });
    }

    // Register custom sidebar view
    this.registerView(VIEW_TYPE_COMMENTS, (leaf) => new CommentsSidebarView(leaf, this));

    // Ensure the sidebar view leaf is initialized on startup so its tab icon is visible in the right sidebar dock
    this.app.workspace.onLayoutReady(() => {
      this.initSidebarView();
    });

    // Register Reading Mode post-processor
    this.registerMarkdownPostProcessor(
      registerReadingViewProcessor(
        this.app,
        (file) => this.store.readComments(file),
        (file) => this.getAnchorBlocks(file),
        (file, block, selection) => this.openComposerForParagraph(file, block, selection),
        (commentId) => this.openSidebarAndFocus(commentId)
      )
    );

    // Register Live Preview CodeMirror 6 extension
    this.registerEditorExtension(
      createLivePreviewExtension(
        this.app,
        (file) => this.store.readComments(file),
        (file) => this.getAnchorBlocks(file),
        (commentId) => this.openSidebarAndFocus(commentId)
      )
    );

    // Add Commands
    this.addCommand({
      id: 'open-comments-sidebar',
      name: 'Open Comments Sidebar',
      callback: () => this.activateSidebarView(),
    });

    this.addCommand({
      id: 'add-inline-comment',
      name: 'Add Comment to Selection',
      editorCallback: async (editor, view) => {
        const file = view.file;
        if (!file) return;

        const selection = editor.getSelection().trim();
        if (!selection) {
          this.openComposerForCursorLine(file, editor);
          return;
        }

        await this.openComposerForSelection(file, editor, selection);
      },
    });

    // Register Editor Context Menu (Live Preview and Source Mode)
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const file = view.file;
        if (!file) return;

        const selection = editor.getSelection().trim();
        if (selection) {
          menu.addItem((item) => {
            item
              .setTitle('Add Comment to Selection')
              .setIcon('message-square')
              .onClick(async () => {
                await this.openComposerForSelection(file, editor, selection);
              });
          });
        }

        menu.addItem((item) => {
          item
            .setTitle('Comment on Paragraph')
            .setIcon('message-square')
            .onClick(() => {
              this.openComposerForCursorLine(file, editor);
            });
        });
      })
    );

    this.addCommand({
      id: 'scan-orphaned-comments',
      name: 'Scan Active File for Orphaned Comments',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md') return;

        const blocks = await this.getAnchorBlocks(file);
        const comments = await this.store.readComments(file);

        const placements = placeInlineComments(blocks, comments.inline_comments);
        const orphans = placements.filter((p) => isOrphanedPlacement(blocks, p));
        const orphanIds = new Set(orphans.map((p) => p.comment.id));

        const changed = await this.store.updateOrphanFlags(file, orphanIds);

        if (changed) {
          this.triggerRefreshes();
          const count = orphans.length;
          new SuccessModal(
            this.app,
            `Scan complete: found and marked ${count} orphaned comment(s).`
          ).open();
        } else {
          new SuccessModal(this.app, 'Scan complete: all comments are correctly placed.').open();
        }
      },
    });

    // Add settings tab
    this.addSettingTab(new MarkdownCommentsSettingTab(this.app, this));
  }

  // Reload views and redraw highlights
  triggerRefreshes() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    for (const leaf of leaves) {
      if (leaf.view instanceof CommentsSidebarView) {
        leaf.view.refresh();
      }
    }

    // Refresh CodeMirror & post-processors by toggling view mode or triggering file modify event
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      activeView.previewMode?.rerender(true);
    }
  }

  async getAnchorBlocks(file: TFile): Promise<AnchorBlock[]> {
    const cached = this.blockCache.get(file.path);
    if (cached && cached.mtime === file.stat.mtime) {
      return cached.blocks;
    }

    const markdown = await this.app.vault.read(file);
    const blocks = parseMarkdownAnchors(markdown);
    this.blockCache.set(file.path, { mtime: file.stat.mtime, blocks });
    return blocks;
  }

  async openComposerForParagraph(file: TFile, block: AnchorBlock, selection?: string) {
    const isSelection = !!selection;
    const title = isSelection ? 'Add Comment to Selection' : 'Comment on Paragraph';
    const anchorText = isSelection ? selection : block.anchor_text;

    new CommentComposerModal(this.app, title, async (text) => {
      const comment = await this.store.addInlineComment(file, {
        body: text,
        anchor_text: anchorText,
        anchor_hash: block.anchor_hash,
        paragraph_index: block.paragraph_index,
        heading_context: block.heading_context,
      });
      this.triggerRefreshes();
      this.openSidebarAndFocus(comment.id);
    }).open();
  }

  async openComposerForSelection(file: TFile, editor: any, selection: string) {
    const cursor = editor.getCursor('from');
    const blocks = await this.getAnchorBlocks(file);

    // Find paragraph block containing the selection (closest line match)
    const block = blocks.reduce((prev, curr) => {
      return Math.abs((curr.line_number ?? 0) - cursor.line) <
        Math.abs((prev.line_number ?? 0) - cursor.line)
        ? curr
        : prev;
    }, blocks[0]);

    if (!block) return;

    await this.openComposerForParagraph(file, block, selection);
  }

  async openComposerForCursorLine(file: TFile, editor: any) {
    const cursor = editor.getCursor();
    const lineText = editor.getLine(cursor.line).trim();
    if (!lineText) return;

    const blocks = await this.getAnchorBlocks(file);
    const block = blocks.reduce((prev, curr) => {
      return Math.abs((curr.line_number ?? 0) - cursor.line) <
        Math.abs((prev.line_number ?? 0) - cursor.line)
        ? curr
        : prev;
    }, blocks[0]);

    if (!block) return;

    await this.openComposerForParagraph(file, block);
  }

  async openSidebarAndFocus(commentId: string) {
    await this.activateSidebarView();
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (leaves.length > 0 && leaves[0].view instanceof CommentsSidebarView) {
      leaves[0].view.highlightAndScrollTo(commentId);
    }
  }

  async activateSidebarView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (leaves.length > 0) {
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_COMMENTS,
        active: true,
      });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  async initSidebarView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (leaves.length > 0) return;

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_COMMENTS,
        active: false,
      });
    }
  }

  async resolveDefaultAuthor(): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { exec } = (window as any).require('child_process');
        // Retrieve vault basePath (only works on Desktop)
        const adapter = this.app.vault.adapter as any;
        const basePath = adapter.getBasePath ? adapter.getBasePath() : '';

        if (basePath) {
          const getGitConfig = (key: string): Promise<string> => {
            return new Promise((resolve) => {
              exec(`git config --get ${key}`, { cwd: basePath }, (err: any, stdout: string) => {
                if (!err && stdout.trim()) {
                  resolve(stdout.trim());
                } else {
                  resolve('');
                }
              });
            });
          };

          const ghUser = await getGitConfig('github.user');
          if (ghUser) return ghUser;

          const originUrl = await getGitConfig('remote.origin.url');
          if (originUrl) {
            const match = originUrl.match(/github\.com[/:]([^/]+?)(?:\/|$)/i);
            const user = match?.[1]?.replace(/\.git$/i, '');
            if (user && user !== 'git') {
              return user;
            }
          }
        }
      } catch (e) {
        // Ignore fallback
      }
    }

    if (typeof process !== 'undefined' && process.env) {
      return process.env.USER || process.env.USERNAME || 'anonymous';
    }
    return 'anonymous';
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class CommentComposerModal extends Modal {
  constructor(
    app: App,
    private titleText: string,
    private onSubmit: (text: string) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    const headerEl = contentEl.createEl('h3', {
      text: this.titleText,
      cls: 'md-comments-sidebar-title',
    });
    headerEl.style.marginBottom = '1rem';

    const shell = contentEl.createDiv({ cls: 'md-comments-editor-shell' });
    const textarea = shell.createEl('textarea', {
      cls: 'md-comments-editor-input',
      placeholder: 'Add a comment… Use @username to mention someone on GitHub.',
    });
    textarea.rows = 4;
    textarea.style.width = '100%';
    textarea.focus();

    const footer = contentEl.createDiv({ cls: 'md-comments-composer-footer' });

    const submitBtn = footer.createEl('button', {
      cls: 'md-comments-btn-primary',
      text: 'Add comment',
    });
    submitBtn.addEventListener('click', () => {
      const val = textarea.value.trim();
      if (val) {
        this.onSubmit(val);
        this.close();
      }
    });

    const cancelBtn = footer.createEl('button', {
      cls: 'md-comments-btn-text',
      text: 'Cancel',
    });
    cancelBtn.addEventListener('click', () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}

class SuccessModal extends Modal {
  constructor(
    app: App,
    private message: string
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    const titleEl = contentEl.createEl('h3', { text: 'Markdown Comments Scan' });
    titleEl.style.marginBottom = '1rem';
    contentEl.createEl('p', { text: this.message });

    const footer = contentEl.createDiv();
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '1rem';
    const btn = footer.createEl('button', {
      cls: 'md-comments-btn-primary',
      text: 'OK',
    });
    btn.addEventListener('click', () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}

class MarkdownCommentsSettingTab extends PluginSettingTab {
  plugin: MarkdownCommentsPlugin;

  constructor(app: App, plugin: MarkdownCommentsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Markdown Comments Settings' });

    new Setting(containerEl)
      .setName('Author Name')
      .setDesc(
        'Your username displayed on comments and replies. Prefers GitHub login if configured in git.'
      )
      .addText((text) =>
        text
          .setPlaceholder('anonymous')
          .setValue(this.plugin.settings.authorName)
          .onChange(async (value) => {
            this.plugin.settings.authorName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Reaction Emojis')
      .setDesc('Comma-separated list of emojis available for reactions.')
      .addText((text) =>
        text
          .setPlaceholder('👍, 👀, ❤️, 🎉, ❓')
          .setValue(this.plugin.settings.reactionEmojis.join(', '))
          .onChange(async (value) => {
            const list = value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            this.plugin.settings.reactionEmojis =
              list.length > 0 ? list : DEFAULT_SETTINGS.reactionEmojis;
            await this.plugin.saveSettings();
          })
      );
  }
}
