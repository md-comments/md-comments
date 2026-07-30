import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { placeInlineComments, isOrphanedPlacement } from '../../shared/placement';
import { isGitHubLogin, githubAvatarUrl } from '../../shared/author';
import type {
  InlineComment,
  PageComment,
  Reply,
  Reaction,
  CommentRootType,
} from '../../shared/types';
import { escapeHtml } from '../../shared/html';
import type MarkdownCommentsPlugin from './main';

export const VIEW_TYPE_COMMENTS = 'md-comments-sidebar';

const ICON_REPLY =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 17H5l-4-4 4-4h4M5 13h11.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-3.5-3.5H5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_RESOLVE =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l3.5 3.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_REOPEN =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.5M20 12a8 8 0 0 1-13.5 5.5M16 6.5V10h-3.5M8 17.5V14H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_REACT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.25 10.25h.01M14.75 10.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.25 14.25c.85 1.15 2 1.75 2.75 1.75s1.9-.6 2.75-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON_DELETE =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_EDIT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_COMMENT_ADD =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const displayNameCache = new Map<string, string>();
const pendingFetches = new Set<string>();

export class CommentsSidebarView extends ItemView {
  private activeTab: 'inline' | 'page' | 'orphan' | 'resolved' = 'inline';
  private collapsedThreads = new Set<string>();

  // Track open composition forms to preserve text when re-rendering
  private composers: Record<string, { type: 'reply' | 'edit' | 'page'; value: string }> = {};

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: MarkdownCommentsPlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_COMMENTS;
  }

  getDisplayText(): string {
    return 'Comments';
  }

  getIcon(): string {
    return 'message-square';
  }

  async onOpen(): Promise<void> {
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.refresh()));
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.refresh();
        }
      })
    );

    this.contentEl.empty();
    this.contentEl.addClass('md-comments-sidebar-container');

    // Bind click events on container for action delegation
    this.contentEl.addEventListener('click', this.handleClicks.bind(this));

    await this.refresh();
  }

  async onClose(): Promise<void> {
    // Cleanup
  }

  async refresh(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') {
      this.renderEmptyState('Open a Markdown file to view comments.');
      return;
    }

    try {
      const blocks = await this.plugin.getAnchorBlocks(file);
      const comments = await this.plugin.store.readComments(file);
      const placements = placeInlineComments(blocks, comments.inline_comments);

      const activePage = comments.page_comments.filter((c) => !c.resolved);
      const resolvedPage = comments.page_comments.filter((c) => c.resolved);

      const inlineOpen = placements.filter(
        (p) => p.placed && !p.comment.resolved && !isOrphanedPlacement(blocks, p)
      );
      const inlineResolved = placements.filter((p) => p.placed && p.comment.resolved);
      const orphans = placements.filter(
        (p) => !p.comment.resolved && isOrphanedPlacement(blocks, p)
      );

      const resolvedAll = [
        ...resolvedPage.map((c) => ({ comment: c, type: 'page' as const, quote: '' })),
        ...inlineResolved.map((p) => ({
          comment: p.comment,
          type: 'inline' as const,
          quote: p.comment.anchor_text,
        })),
      ].sort((a, b) => b.comment.created_at.localeCompare(a.comment.created_at));

      this.contentEl.empty();

      // Render Header
      const header = this.contentEl.createDiv({ cls: 'md-comments-sidebar-header' });
      header.createEl('h3', { text: 'Comments', cls: 'md-comments-sidebar-title' });

      // Render Tabs
      const tabsNav = this.contentEl.createEl('nav', { cls: 'md-comments-tabs' });

      const createTab = (id: typeof this.activeTab, label: string, count: number) => {
        const btn = tabsNav.createEl('button', {
          cls: `md-comments-tab ${this.activeTab === id ? 'md-comments-tab-active' : ''}`,
          text: label,
        });
        btn.dataset.tabId = id;
        btn.createEl('span', { text: String(count), cls: 'md-comments-tab-count' });
      };

      createTab('inline', 'Inline', inlineOpen.length);
      createTab('page', 'Page', activePage.length);
      createTab('orphan', 'Orphan', orphans.length);
      createTab('resolved', 'Resolved', resolvedAll.length);

      // Render Tab Panels
      const panelsWrap = this.contentEl.createDiv({ cls: 'md-comments-tab-panels' });

      const renderPanel = (tabId: typeof this.activeTab, htmlContent: string) => {
        const panel = panelsWrap.createDiv({
          cls: `md-comments-tab-panel ${this.activeTab === tabId ? 'md-comments-tab-panel-active' : ''}`,
        });
        panel.innerHTML = htmlContent;
        this.restoreComposers(panel);
      };

      // 1. Inline Panel
      if (this.activeTab === 'inline') {
        const html = inlineOpen.length
          ? inlineOpen
              .map((p) => this.renderThread(p.comment, 'inline', p.comment.anchor_text))
              .join('')
          : '<p class="md-comments-sidebar-empty">No active inline comments. Highlight text in Reading or Live Preview mode to add a comment.</p>';
        renderPanel('inline', html);
      }

      // 2. Page Panel
      if (this.activeTab === 'page') {
        const pageListHtml = activePage.length
          ? activePage.map((c) => this.renderThread(c, 'page')).join('')
          : '<p class="md-comments-sidebar-empty">No page-level comments yet.</p>';

        let composerHtml = '';
        if (this.composers['addPage']) {
          composerHtml = this.renderComposerHtml('addPage', 'Add a comment', 'Add comment', 'page');
        }

        renderPanel('page', pageListHtml + composerHtml);
      }

      // 3. Orphan Panel
      if (this.activeTab === 'orphan') {
        const html = orphans.length
          ? orphans
              .map((p) => this.renderThread(p.comment, 'inline', p.comment.anchor_text, true))
              .join('')
          : '<p class="md-comments-sidebar-empty">No orphaned comments.</p>';
        renderPanel('orphan', html);
      }

      // 4. Resolved Panel
      if (this.activeTab === 'resolved') {
        const html = resolvedAll.length
          ? resolvedAll.map((r) => this.renderResolvedCollapse(r.comment, r.type, r.quote)).join('')
          : '<p class="md-comments-sidebar-empty">No resolved comments.</p>';
        renderPanel('resolved', html);
      }

      // Render Footer (only show for Page tab when composer isn't active)
      if (this.activeTab === 'page' && !this.composers['addPage']) {
        const footer = this.contentEl.createDiv({ cls: 'md-comments-sidebar-footer' });
        const addBtn = footer.createEl('button', {
          cls: 'md-comments-sidebar-add',
          text: ' Add a comment',
        });
        addBtn.dataset.action = 'addPage';
        addBtn.insertAdjacentHTML('afterbegin', ICON_COMMENT_ADD);
      }
    } catch (e) {
      console.error('[md-comments] refresh failed', e);
      this.renderEmptyState('Failed to load comments.');
    }
  }

  private renderEmptyState(message: string) {
    this.contentEl.empty();
    const wrap = this.contentEl.createDiv({ cls: 'md-comments-sidebar-empty' });
    wrap.setText(message);
  }

  private formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  private renderAvatar(author: string): string {
    const label = this.resolveDisplayName(author);
    const parts = label.split(/\s+/).filter(Boolean);
    let initials = '';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = (label.slice(0, 2) || '?').toUpperCase();
    }
    const escInitials = escapeHtml(initials);
    const login = author.trim();
    if (isGitHubLogin(login)) {
      const url = githubAvatarUrl(login, 48);
      const escUrl = url.replace(/"/g, '&quot;');
      return `<div class="md-comments-avatar" aria-hidden="true" style="position: relative;">
        <span class="md-comments-avatar-fallback">${escInitials}</span>
        <img class="md-comments-avatar-img" src="${escUrl}" alt="" decoding="async" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
      </div>`;
    }
    return `<div class="md-comments-avatar" aria-hidden="true"><span class="md-comments-avatar-fallback">${escInitials}</span></div>`;
  }

  private resolveDisplayName(author: string): string {
    const login = author.trim();
    if (isGitHubLogin(login)) {
      const key = login.toLowerCase();
      if (displayNameCache.has(key)) {
        return displayNameCache.get(key) || author;
      }
      if (!pendingFetches.has(key)) {
        this.fetchDisplayName(login);
      }
    }
    return author;
  }

  private async fetchDisplayName(login: string): Promise<void> {
    const key = login.toLowerCase();
    pendingFetches.add(key);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'MD-Comments-Obsidian',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.name === 'string') {
          const trimmed = data.name.trim();
          if (trimmed) {
            displayNameCache.set(key, trimmed);
            this.refresh().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch github display name', err);
    } finally {
      pendingFetches.delete(key);
    }
  }

  private renderMentions(body: string): string {
    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(
      /@([a-zA-Z0-9-]{1,39})/g,
      '<span class="md-comments-mention">@$1</span>'
    );
  }

  private renderReactions(
    reactions: Reaction[],
    id: string,
    rootId: string,
    type: string,
    kind: string
  ): string {
    if (!reactions || !reactions.length) return '';
    const chips = reactions
      .map(
        (r) =>
          `<button type="button" class="md-comments-reaction-chip" data-action="react" data-id="${id}" data-root="${rootId}" data-type="${type}" data-kind="${kind}" data-emoji="${r.emoji}">${r.emoji} ${r.users.length}</button>`
      )
      .join('');
    return `<div class="md-comments-reactions">${chips}</div>`;
  }

  private renderThread(
    comment: InlineComment | PageComment,
    type: 'inline' | 'page',
    quote = '',
    isOrphan = false
  ): string {
    const badge = isOrphan
      ? '<span class="md-comments-badge md-comments-badge-orphan">orphaned</span>'
      : '';
    const quoteHtml = quote
      ? `<blockquote class="md-comments-quote"><div class="md-comments-quote-text">${quote}</div></blockquote>`
      : '';
    const resolvedActions = this.renderActions(
      comment.id,
      comment.id,
      type,
      'root',
      comment.author,
      comment.resolved,
      isOrphan
    );

    let repliesHtml = '';
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isCollapsed = this.collapsedThreads.has(comment.id);

    if (hasReplies) {
      const replyList = comment.replies.map((r) => this.renderReply(r, comment.id, type)).join('');

      const hideLabel =
        comment.replies.length === 1 ? 'Hide reply' : `Hide ${comment.replies.length} replies`;
      const showLabel =
        comment.replies.length === 1 ? 'Show reply' : `Show ${comment.replies.length} replies`;

      repliesHtml = `
        <div class="md-comments-replies-block ${isCollapsed ? 'md-comments-replies-collapsed' : ''}" data-root-id="${comment.id}">
          <div class="md-comments-replies-list">${replyList}</div>
          <footer class="md-comments-thread-footer">
            <button type="button" class="md-comments-thread-footer-btn" data-action="show-reply-form" data-root-id="${comment.id}" data-type="${type}">
              ${ICON_REPLY}<span>Reply</span>
            </button>
            <button type="button" class="md-comments-thread-footer-btn" data-action="toggle-replies" data-root-id="${comment.id}">
              <span class="md-comments-toggle-hide">${hideLabel}</span>
              <span class="md-comments-toggle-show" hidden>${showLabel}</span>
            </button>
          </footer>
        </div>
      `;
    } else {
      repliesHtml = `
        <div class="md-comments-replies-block" data-root-id="${comment.id}">
          <footer class="md-comments-thread-footer" style="border:none; margin:0; padding:0;">
            <button type="button" class="md-comments-thread-footer-btn" data-action="show-reply-form" data-root-id="${comment.id}" data-type="${type}">
              ${ICON_REPLY}<span>Reply</span>
            </button>
          </footer>
        </div>
      `;
    }

    // Composer forms inline
    let inlineForm = '';
    const composerKey = `reply-${comment.id}`;
    if (this.composers[composerKey]) {
      inlineForm = this.renderComposerHtml(composerKey, 'Reply', 'Reply', type);
    }
    const editKey = `edit-${comment.id}`;
    const showBody = !this.composers[editKey];
    const bodyContent = showBody
      ? `<div class="md-comments-body">${this.renderMentions(comment.body)}</div>`
      : this.renderComposerHtml(editKey, 'Edit comment', 'Save', type);

    return `
      <article class="md-comments-sidebar-thread" data-comment-id="${comment.id}" data-type="${type}">
        ${quoteHtml}
        <div class="md-comments-card">
          <div class="md-comments-thread-row">
            ${this.renderAvatar(comment.author)}
            <div class="md-comments-thread-content">
              <div class="md-comments-meta">
                <span class="md-comments-author" title="@${escapeHtml(comment.author)}">${this.resolveDisplayName(comment.author)}</span>
                <span class="md-comments-time">${this.formatTime(comment.created_at)}</span>
                ${badge}
              </div>
              ${bodyContent}
              ${showBody ? this.renderReactions(comment.reactions, comment.id, comment.id, type, 'root') : ''}
              ${showBody ? `<div class="md-comments-actions">${resolvedActions}</div>` : ''}
            </div>
          </div>
          ${repliesHtml}
          ${inlineForm}
        </div>
      </article>
    `;
  }

  private renderReply(reply: Reply, rootId: string, type: 'inline' | 'page'): string {
    const editKey = `edit-${reply.id}`;
    const showBody = !this.composers[editKey];
    const bodyContent = showBody
      ? `<div class="md-comments-body">${this.renderMentions(reply.body)}</div>`
      : this.renderComposerHtml(editKey, 'Edit reply', 'Save', type);

    const resolvedActions = this.renderActions(reply.id, rootId, type, 'reply', reply.author);

    return `
      <div class="md-comments-reply" data-reply-id="${reply.id}">
        <div class="md-comments-thread-row">
          ${this.renderAvatar(reply.author)}
          <div class="md-comments-thread-content">
            <div class="md-comments-meta">
              <span class="md-comments-author" title="@${escapeHtml(reply.author)}">${this.resolveDisplayName(reply.author)}</span>
              <span class="md-comments-time">${this.formatTime(reply.created_at)}</span>
            </div>
            ${bodyContent}
            ${showBody ? this.renderReactions(reply.reactions, reply.id, rootId, type, 'reply') : ''}
            ${showBody ? `<div class="md-comments-actions">${resolvedActions}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderResolvedCollapse(
    comment: InlineComment | PageComment,
    type: 'inline' | 'page',
    quote = ''
  ): string {
    const threadHtml = this.renderThread(comment, type, quote);
    return `
      <details class="md-comments-resolved-collapse">
        <summary class="md-comments-resolved-summary">
          <span class="md-comments-resolved-summary-author" title="@${escapeHtml(comment.author)}">${this.resolveDisplayName(comment.author)}</span>
          <span class="md-comments-resolved-summary-time">${this.formatTime(comment.created_at)}</span>
          <span class="md-comments-resolved-summary-excerpt">${comment.body.slice(0, 45)}${comment.body.length > 45 ? '...' : ''}</span>
        </summary>
        <div class="md-comments-resolved-body">
          ${threadHtml}
        </div>
      </details>
    `;
  }

  private renderActions(
    id: string,
    rootId: string,
    type: string,
    kind: 'root' | 'reply',
    author: string,
    resolved = false,
    _isOrphan = false
  ): string {
    const currentAuthor = this.plugin.settings.authorName || 'anonymous';
    const isMe = author === currentAuthor;

    let list = '';

    if (isMe) {
      list += `<button type="button" class="md-comments-icon-btn" data-action="show-edit-form" data-id="${id}" data-root-id="${rootId}" data-type="${type}" data-kind="${kind}" title="Edit">${ICON_EDIT}</button>`;
    }

    if (kind === 'root') {
      if (resolved) {
        list += `<button type="button" class="md-comments-icon-btn" data-action="unresolve" data-id="${id}" data-type="${type}" title="Reopen">${ICON_REOPEN}</button>`;
      } else {
        list += `<button type="button" class="md-comments-icon-btn" data-action="resolve" data-id="${id}" data-type="${type}" title="Resolve">${ICON_RESOLVE}</button>`;
      }
    }

    list += `<button type="button" class="md-comments-icon-btn" data-action="react-picker" data-id="${id}" data-root-id="${rootId}" data-type="${type}" data-kind="${kind}" title="React">${ICON_REACT}</button>`;

    if (isMe) {
      list += `<button type="button" class="md-comments-icon-btn md-comments-icon-btn-danger" data-action="delete" data-id="${id}" data-root-id="${rootId}" data-type="${type}" data-kind="${kind}" title="Delete">${ICON_DELETE}</button>`;
    }

    return list;
  }

  private renderComposerHtml(
    key: string,
    title: string,
    submitLabel: string,
    type: string
  ): string {
    return `
      <div class="md-comments-composer" style="position:static; width:100%; box-shadow:none; border:none; margin-top:0.5rem;" data-composer-key="${key}">
        <div class="md-comments-composer-layout" style="padding:0;">
          <div class="md-comments-editor-shell">
            <div class="md-comments-editor-input-wrap">
              <textarea class="md-comments-editor-input" rows="3" placeholder="${title}..."></textarea>
            </div>
          </div>
          <div class="md-comments-composer-footer">
            <button type="button" class="md-comments-btn-primary" data-action="submit-composer" data-key="${key}" data-type="${type}">${submitLabel}</button>
            <button type="button" class="md-comments-btn-text" data-action="cancel-composer" data-key="${key}">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  private restoreComposers(panel: HTMLDivElement) {
    panel.querySelectorAll('.md-comments-composer').forEach((compNode) => {
      const comp = compNode as HTMLElement;
      const key = comp.dataset.composerKey;
      if (key && this.composers[key]) {
        const txt = comp.querySelector('textarea');
        if (txt) {
          txt.value = this.composers[key].value;
          // Sync changes
          txt.addEventListener('input', () => {
            if (this.composers[key]) {
              this.composers[key].value = txt.value;
            }
          });
        }
      }
    });
  }

  private async handleClicks(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Tab changes
    const tabBtn = target.closest('.md-comments-tab') as HTMLElement;
    if (tabBtn && tabBtn.dataset.tabId) {
      this.activeTab = tabBtn.dataset.tabId as 'inline' | 'page' | 'orphan' | 'resolved';
      await this.refresh();
      return;
    }

    const actionEl = target.closest('[data-action]') as HTMLElement;
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    const file = this.app.workspace.getActiveFile();
    if (!file) return;

    // Show Composer forms
    if (action === 'addPage') {
      this.composers['addPage'] = { type: 'page', value: '' };
      await this.refresh();
      const txt = this.contentEl.querySelector(
        '.md-comments-composer[data-composer-key="addPage"] textarea'
      ) as HTMLTextAreaElement;
      txt?.focus();
    }

    if (action === 'show-reply-form') {
      const rootId = actionEl.dataset.rootId!;
      this.composers[`reply-${rootId}`] = { type: 'reply', value: '' };
      await this.refresh();
      const txt = this.contentEl.querySelector(
        `.md-comments-composer[data-composer-key="reply-${rootId}"] textarea`
      ) as HTMLTextAreaElement;
      txt?.focus();
    }

    if (action === 'show-edit-form') {
      const id = actionEl.dataset.id!;
      const parentEl =
        actionEl.closest('.md-comments-thread-content') || actionEl.closest('.md-comments-reply');
      const bodyText = parentEl?.querySelector('.md-comments-body')?.textContent || '';

      this.composers[`edit-${id}`] = { type: 'edit', value: bodyText };
      await this.refresh();
      const txt = this.contentEl.querySelector(
        `.md-comments-composer[data-composer-key="edit-${id}"] textarea`
      ) as HTMLTextAreaElement;
      txt?.focus();
    }

    // Cancel Composers
    if (action === 'cancel-composer') {
      const key = actionEl.dataset.key!;
      delete this.composers[key];
      await this.refresh();
    }

    // Submit Composers
    if (action === 'submit-composer') {
      const key = actionEl.dataset.key!;
      const compEl = actionEl.closest('.md-comments-composer')!;
      const text = compEl.querySelector('textarea')?.value.trim() || '';
      if (!text) return;

      delete this.composers[key];

      try {
        if (key === 'addPage') {
          await this.plugin.store.addPageComment(file, text);
        } else if (key.startsWith('reply-')) {
          const rootId = key.substring(6);
          const type = actionEl.dataset.type as CommentRootType;
          await this.plugin.store.addReply(file, rootId, type, text);
        } else if (key.startsWith('edit-')) {
          const id = key.substring(5);
          const rootId = actionEl.dataset.rootId;
          const type = actionEl.dataset.type as CommentRootType;
          const kind = actionEl.closest('.md-comments-reply') ? 'reply' : 'root';
          await this.plugin.store.editComment(file, id, type, kind, rootId, text);
        }
      } catch (err) {
        console.error(err);
      }
      await this.refresh();
      this.plugin.triggerRefreshes();
    }

    // Toggle Replies panel collapse
    if (action === 'toggle-replies') {
      const rootId = actionEl.dataset.rootId!;
      if (this.collapsedThreads.has(rootId)) {
        this.collapsedThreads.delete(rootId);
      } else {
        this.collapsedThreads.add(rootId);
      }
      await this.refresh();
    }

    // Standard actions
    if (action === 'resolve') {
      const id = actionEl.dataset.id!;
      const type = actionEl.dataset.type as CommentRootType;
      await this.plugin.store.resolveComment(file, id, type);
      await this.refresh();
      this.plugin.triggerRefreshes();
    }

    if (action === 'unresolve') {
      const id = actionEl.dataset.id!;
      const type = actionEl.dataset.type as CommentRootType;
      await this.plugin.store.unresolveComment(file, id, type);
      await this.refresh();
      this.plugin.triggerRefreshes();
    }

    if (action === 'delete') {
      const id = actionEl.dataset.id!;
      const rootId = actionEl.dataset.rootId!;
      const type = actionEl.dataset.type as CommentRootType;
      const kind = actionEl.dataset.kind as 'root' | 'reply';

      const confirmText =
        kind === 'reply'
          ? 'Delete this reply permanently?'
          : 'Delete this comment and all its replies permanently?';
      if (window.confirm(confirmText)) {
        await this.plugin.store.deleteComment(file, id, type, kind, rootId);
        await this.refresh();
        this.plugin.triggerRefreshes();
      }
    }

    // React chip click
    if (action === 'react') {
      const id = actionEl.dataset.id!;
      const rootId = actionEl.dataset.root!;
      const type = actionEl.dataset.type as CommentRootType;
      const kind = actionEl.dataset.kind as 'root' | 'reply';
      const emoji = actionEl.dataset.emoji!;
      await this.plugin.store.toggleReaction(file, id, kind, rootId, type, emoji);
      await this.refresh();
    }

    // React picker button click
    if (action === 'react-picker') {
      const id = actionEl.dataset.id!;
      const rootId = actionEl.dataset.rootId!;
      const type = actionEl.dataset.type as CommentRootType;
      const kind = actionEl.dataset.kind as 'root' | 'reply';
      this.showEmojiPickerPopup(actionEl, id, rootId, type, kind, file);
    }
  }

  private showEmojiPickerPopup(
    anchor: HTMLElement,
    id: string,
    rootId: string,
    type: CommentRootType,
    kind: 'root' | 'reply',
    file: TFile
  ) {
    const oldPop = document.getElementById('md-comments-emoji-popover');
    if (oldPop) oldPop.remove();

    const pop = document.createElement('div');
    pop.id = 'md-comments-emoji-popover';
    pop.className = 'md-comments-emoji-popover';
    pop.innerHTML = '<div class="md-comments-emoji-row"></div>';
    const row = pop.querySelector('.md-comments-emoji-row')!;

    const emojis = this.plugin.settings.reactionEmojis || ['👍', '👀', '❤️', '🎉', '❓'];

    emojis.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-comments-emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.plugin.store.toggleReaction(file, id, kind, rootId, type, emoji);
        pop.remove();
        await this.refresh();
      });
      row.appendChild(btn);
    });

    document.body.appendChild(pop);

    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;
    pop.style.top = `${top}px`;
    pop.style.left = `${Math.min(left, window.innerWidth - pop.offsetWidth - 12)}px`;

    const outsideClick = (e: MouseEvent) => {
      if (
        !pop.contains(e.target as Node) &&
        e.target !== anchor &&
        !anchor.contains(e.target as Node)
      ) {
        pop.remove();
        document.removeEventListener('click', outsideClick, true);
      }
    };
    document.addEventListener('click', outsideClick, true);
  }

  // Force sidebar focus onto a specific inline comment
  public highlightAndScrollTo(commentId: string) {
    this.activeTab = 'inline';
    this.collapsedThreads.delete(commentId);

    this.refresh().then(() => {
      const card = this.contentEl.querySelector(
        `.md-comments-sidebar-thread[data-comment-id="${commentId}"]`
      );
      if (card) {
        card.classList.add('md-comments-card-active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          card.classList.remove('md-comments-card-active');
        }, 3000);
      }
    });
  }
}
