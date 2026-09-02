import {
  GitHubOrphanRefBackend,
  type CommentsFile,
  type InlineComment,
  type PageComment,
} from '@md-comments/shared';
import { scanArticleAnchors, type ScannedElement } from '../domAnchors.js';
import { resolveElementForAnchor } from '../placement.js';
import {
  getStoredToken,
  clearOAuthToken,
  getViewer,
  type GitHubViewer,
  DEFAULT_CLIENT_ID,
} from '../githubAuth.js';
import { AuthModal } from './AuthModal.js';
import type { MdCommentsPluginOptions } from '../../types.js';

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_DELETE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_RESOLVE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l3.5 3.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_REOPEN = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.5M20 12a8 8 0 0 1-13.5 5.5M16 6.5V10h-3.5M8 17.5V14H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_REACT = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.25 10.25h.01M14.75 10.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.25 14.25c.85 1.15 2 1.75 2.75 1.75s1.9-.6 2.75-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const displayNameCache = new Map<string, string>();
const pendingFetches = new Set<string>();

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return date.toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function isGitHubLogin(name: string): boolean {
  return /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test((name || '').trim());
}

function resolveDisplayName(author: string, onResolved?: () => void): string {
  const login = (author || '').trim();
  if (!login) return 'Anonymous';
  if (isGitHubLogin(login)) {
    const key = login.toLowerCase();
    if (displayNameCache.has(key)) {
      return displayNameCache.get(key) || login;
    }
    if (!pendingFetches.has(key)) {
      pendingFetches.add(key);
      fetch(`https://api.github.com/users/${encodeURIComponent(login)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.name === 'string' && data.name.trim()) {
            displayNameCache.set(key, data.name.trim());
            if (onResolved) onResolved();
          }
        })
        .catch(() => {})
        .finally(() => pendingFetches.delete(key));
    }
  }
  return login;
}

function renderAuthor(author: string, onResolved?: () => void): string {
  const login = (author || '').trim();
  const displayName = resolveDisplayName(login, onResolved);
  if (isGitHubLogin(login)) {
    const title = displayName !== login ? ` title="@${escapeHtml(login)}"` : '';
    return `<a href="https://github.com/${encodeURIComponent(login)}" class="md-comments-username" target="_blank" rel="noopener noreferrer"${title}>${escapeHtml(displayName)}</a>`;
  }
  return `<span class="md-comments-username">${escapeHtml(displayName)}</span>`;
}

function renderAvatar(authorOrUrl: string, size = 32, alt = ''): string {
  const val = (authorOrUrl || '').trim();
  const isUrl = val.startsWith('http://') || val.startsWith('https://');
  const src = isUrl
    ? val
    : isGitHubLogin(val)
      ? `https://avatars.githubusercontent.com/${encodeURIComponent(val)}?s=${size}`
      : `https://github.com/${encodeURIComponent(val || 'Anonymous')}.png?size=${size}`;
  const initial = (val || 'A').replace(/^https?:\/\/.*\/|\.png.*$/i, '')[0]?.toUpperCase() || 'A';

  return `<span class="md-comments-avatar-wrap" style="width: ${size}px; height: ${size}px; position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: var(--accent-color, #6366f1);"><span class="md-comments-avatar-fallback" style="font-size: ${Math.max(10, Math.floor(size * 0.4))}px; font-weight: 700; color: #ffffff; text-transform: uppercase; line-height: 1;">${escapeHtml(initial)}</span><img class="md-comments-avatar" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; margin: 0; padding: 0;" src="${src}" alt="${escapeHtml(alt || val)}" onerror="this.style.display='none'" /></span>`;
}

export class CommentsOverlay {
  private container: HTMLElement;
  private options: MdCommentsPluginOptions;
  private backend: GitHubOrphanRefBackend;
  private comments: CommentsFile = { inline_comments: [], page_comments: [] };
  private scanned: ScannedElement[] = [];
  private currentViewer: GitHubViewer | null = null;

  private drawerEl: HTMLElement | null = null;
  private selectionBubbleEl: HTMLElement | null = null;
  private fabEl: HTMLElement | null = null;
  private activeTab: 'inline' | 'page' = 'inline';
  private editingCommentId: string | null = null;
  private editingReplyId: string | null = null;
  private activeTooltipEl: HTMLElement | null = null;

  private pendingSelection: {
    text: string;
    anchorId: string;
    lineIndex: number;
    textPrefix: string;
    headingContext: string;
  } | null = null;

  constructor(container: HTMLElement, options: MdCommentsPluginOptions = {}) {
    this.container = container;
    this.options = {
      clientId: DEFAULT_CLIENT_ID,
      branch: 'main',
      ...options,
    };

    this.backend = new GitHubOrphanRefBackend(() => getStoredToken());
  }

  public async init(): Promise<void> {
    this.initDOM();
    this.scanned = scanArticleAnchors(this.container);
    this.bindSelectionEvents();

    const token = getStoredToken();
    if (token) {
      this.currentViewer = await getViewer(token);
      this.updateAuthUserUI();
    }

    await this.loadComments();
    this.updateFABCount();
  }

  private initDOM(): void {
    // 1. Selection Bubble
    this.selectionBubbleEl = document.createElement('button');
    this.selectionBubbleEl.className = 'md-comments-selection-bubble';
    this.selectionBubbleEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 5v2H5v2h2v2h2V9h2V7H9V5H7z"/>
      </svg>
      <span>Comment</span>
    `;
    this.selectionBubbleEl.style.display = 'none';
    document.body.appendChild(this.selectionBubbleEl);

    this.selectionBubbleEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    this.selectionBubbleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openComposerForSelection();
    });

    // 2. Floating Action Button (Bottom Right)
    this.fabEl = document.createElement('button');
    this.fabEl.id = 'md-comments-fab-toggle';
    this.fabEl.className = 'md-comments-fab-toggle';
    this.fabEl.title = 'Markdown Comments (Cmd/Ctrl+Shift+C)';
    this.fabEl.setAttribute('aria-label', 'Markdown Comments');
    this.fabEl.innerHTML = `
      <svg viewBox="0 0 512 512" width="30" height="30">
        <path fill="#24292f" stroke="#ffffff" stroke-width="20" stroke-linejoin="round" d="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z"/>
        <path fill="#ffffff" d="M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"/>
      </svg>
      <span class="badge-count" style="display: none;">0</span>
    `;
    this.fabEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    document.body.appendChild(this.fabEl);

    // Global keyboard shortcut: Cmd/Ctrl+Shift+C
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.toggleDrawer();
      }
    });

    // 3. Comments Drawer (Matching GitHub Extension 100%)
    this.drawerEl = document.createElement('div');
    this.drawerEl.className = 'md-comments-drawer';
    const drawerWidth = this.options.ui?.drawerWidth || 380;
    this.drawerEl.style.width = `${drawerWidth}px`;
    this.drawerEl.innerHTML = `
      <div class="md-comments-drawer-header">
        <div class="md-comments-drawer-title">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
          </svg>
          <span>Markdown Comments</span>
        </div>
        <div class="md-comments-header-actions">
          <div class="md-comments-auth-user"></div>
          <button class="md-comments-drawer-close" aria-label="Close">&times;</button>
        </div>
      </div>

      <div class="md-comments-tab-header">
        <button class="md-comments-tab-btn active" data-tab="inline">
          <span>Inline</span>
          <span class="md-comments-tab-count inline-tab-count">0</span>
        </button>
        <button class="md-comments-tab-btn" data-tab="page">
          <span>Document</span>
          <span class="md-comments-tab-count page-tab-count">0</span>
        </button>
      </div>

      <div class="md-comments-tab-panel active" id="starlight-panel-inline">
        <div class="new-inline-composer-wrapper" style="display: none;">
          <div style="font-size: 11px; margin-bottom: 6px; color: var(--text-secondary);">New comment on: <em class="anchor-text-preview" style="font-style: italic;"></em></div>
          <div class="new-inline-composer-container"></div>
        </div>
        <div class="md-comments-threads-list" id="starlight-inline-threads"></div>
      </div>

      <div class="md-comments-tab-panel" id="starlight-panel-page">
        <div class="md-comments-threads-list" id="starlight-page-threads"></div>
        <div class="page-composer">
          <textarea placeholder="${this.currentViewer ? 'Write a page comment...' : 'Sign in to write a page comment...'}" class="page-textarea"></textarea>
          <div style="display: flex; justify-content: flex-end;">
            <button class="md-comments-btn-primary submit-page-btn">Send</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.drawerEl);

    const closeBtn = this.drawerEl.querySelector('.md-comments-drawer-close');
    closeBtn?.addEventListener('click', () => this.closeDrawer());

    // Tab switching
    this.drawerEl.querySelectorAll('.md-comments-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn.getAttribute('data-tab') as 'inline' | 'page') || 'inline';
        this.drawerEl
          ?.querySelectorAll('.md-comments-tab-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const panelInline = this.drawerEl?.querySelector('#starlight-panel-inline');
        const panelPage = this.drawerEl?.querySelector('#starlight-panel-page');
        if (panelInline) panelInline.classList.toggle('active', this.activeTab === 'inline');
        if (panelPage) panelPage.classList.toggle('active', this.activeTab === 'page');

        this.renderDrawerContent();
      });
    });

    // Page Composer submit button
    const pageSendBtn = this.drawerEl.querySelector('.submit-page-btn');
    pageSendBtn?.addEventListener('click', async () => {
      const textarea = this.drawerEl?.querySelector<HTMLTextAreaElement>('.page-textarea');
      const body = textarea?.value.trim();
      if (!body || !textarea) return;
      await this.submitPageComment(body, textarea);
    });

    this.updateAuthUserUI();
  }

  private updateAuthUserUI(): void {
    if (!this.drawerEl) return;
    const authContainer = this.drawerEl.querySelector('.md-comments-auth-user');
    if (!authContainer) return;

    if (this.currentViewer) {
      authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          ${renderAvatar(this.currentViewer.avatar_url || this.currentViewer.login, 22, this.currentViewer.login)}
          <button class="md-comments-btn-link md-comments-logout-btn" title="Sign out (${this.currentViewer.login})">Sign Out</button>
        </div>
      `;
      authContainer.querySelector('.md-comments-logout-btn')?.addEventListener('click', () => {
        clearOAuthToken();
        this.currentViewer = null;
        this.updateAuthUserUI();
        this.renderDrawerContent();
      });
    } else {
      authContainer.innerHTML = `
        <button class="md-comments-btn-primary md-comments-login-btn" style="padding: 4px 10px; font-size: 11px;">Sign In</button>
      `;
      authContainer.querySelector('.md-comments-login-btn')?.addEventListener('click', () => {
        const modal = new AuthModal(this.options);
        modal.show(async (token: string) => {
          this.currentViewer = await getViewer(token);
          this.updateAuthUserUI();
          this.renderDrawerContent();
        });
      });
    }
  }

  private findHeadingContext(el: HTMLElement): string {
    let curr: HTMLElement | null = el;
    while (curr && curr !== document.body) {
      let prev = curr.previousElementSibling as HTMLElement | null;
      while (prev) {
        if (/^H[1-6]$/i.test(prev.tagName)) {
          return prev.textContent?.trim() || 'Top level';
        }
        prev = prev.previousElementSibling as HTMLElement | null;
      }
      curr = curr.parentElement;
    }
    return 'Top level';
  }

  private bindSelectionEvents(): void {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        this.hideSelectionBubble();
        return;
      }

      const text = selection.toString().trim();
      if (!text || selection.rangeCount === 0) {
        this.hideSelectionBubble();
        return;
      }

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const elementNode =
        commonAncestor instanceof HTMLElement ? commonAncestor : commonAncestor.parentElement;

      if (!elementNode || (this.container && !this.container.contains(elementNode))) {
        this.hideSelectionBubble();
        return;
      }

      if (
        elementNode.closest(
          '.md-comments-drawer, .md-comments-selection-bubble, .md-comments-auth-modal, .md-comments-tooltip'
        )
      ) {
        this.hideSelectionBubble();
        return;
      }

      const blockEl = elementNode.closest<HTMLElement>(
        'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre'
      );
      if (!blockEl) {
        this.hideSelectionBubble();
        return;
      }

      const anchorId = blockEl.getAttribute('data-md-anchor-id') || '';
      const lineIndex = parseInt(blockEl.getAttribute('data-md-line-index') || '0', 10);
      const textPrefix = (blockEl.innerText || '').trim().slice(0, 40);
      const headingContext = this.findHeadingContext(blockEl);

      this.pendingSelection = { text, anchorId, lineIndex, textPrefix, headingContext };

      let rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const rects = range.getClientRects();
        if (rects.length > 0) rect = rects[0];
      }
      this.showSelectionBubble(rect);
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mouseup', () => setTimeout(handleSelection, 10));
  }

  private showSelectionBubble(rect: DOMRect): void {
    if (!this.selectionBubbleEl) return;
    this.selectionBubbleEl.style.top = `${window.scrollY + rect.top - 36}px`;
    this.selectionBubbleEl.style.left = `${window.scrollX + rect.left + rect.width / 2 - 40}px`;
    this.selectionBubbleEl.style.display = 'inline-flex';
  }

  private hideSelectionBubble(): void {
    if (this.selectionBubbleEl) {
      this.selectionBubbleEl.style.display = 'none';
    }
  }

  private async loadComments(): Promise<void> {
    if (!this.options.repo) return;
    const [owner, repo] = this.options.repo.split('/');
    if (!owner || !repo) return;

    const filePath = this.getDocumentFilePath();
    try {
      this.comments = await this.backend.read({
        owner,
        repo,
        filePath,
      });
    } catch {
      this.comments = { inline_comments: [], page_comments: [] };
    }
    this.renderInlineHighlights();
    this.updateFABCount();
  }

  private updateFABCount(): void {
    if (!this.fabEl) return;
    const inlineOpen = (this.comments.inline_comments || []).filter((c) => !c.resolved).length;
    const pageOpen = (this.comments.page_comments || []).filter((c) => !c.resolved).length;
    const totalOpen = inlineOpen + pageOpen;

    const badge = this.fabEl.querySelector<HTMLElement>('.badge-count');
    if (badge) {
      badge.textContent = String(totalOpen);
      badge.style.display = totalOpen > 0 ? 'inline-block' : 'none';
    }

    if (this.drawerEl) {
      const inlineCountEl = this.drawerEl.querySelector('.inline-tab-count');
      const pageCountEl = this.drawerEl.querySelector('.page-tab-count');
      if (inlineCountEl) inlineCountEl.textContent = String(inlineOpen);
      if (pageCountEl) pageCountEl.textContent = String(pageOpen);
    }
  }

  private getDocumentFilePath(): string {
    const basePath = this.options.docBasePath || 'src/content/docs';
    let path = window.location.pathname;

    const base = this.options.base || '';
    if (base && path.startsWith(base)) {
      path = path.slice(base.length);
    }

    path = path.replace(/^\/|\/$/g, '');

    const basePathFirstSegment = basePath.split('/')[0];
    if (basePathFirstSegment && path.startsWith(basePathFirstSegment + '/')) {
      path = path.slice(basePathFirstSegment.length + 1);
    } else if (path === basePathFirstSegment) {
      path = '';
    }

    if (!path) path = 'index';
    if (path.endsWith('/')) path += 'index';
    return `${basePath}/${path}.md`;
  }

  public toggleDrawer(): void {
    if (this.drawerEl?.classList.contains('md-comments-drawer-open')) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  public openDrawer(): void {
    if (!this.drawerEl) return;
    const drawerWidth = this.options.ui?.drawerWidth || 380;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style?.setProperty?.(
        '--md-comments-drawer-width',
        `${drawerWidth}px`
      );
      document.documentElement.classList?.add?.('md-comments-panel-open');
    }
    if (this.fabEl) this.fabEl.style.display = 'none';
    this.drawerEl.classList.add('md-comments-drawer-open');
    this.renderDrawerContent();
  }

  public closeDrawer(): void {
    if (!this.drawerEl) return;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList?.remove?.('md-comments-panel-open');
    }
    if (this.fabEl) this.fabEl.style.display = 'flex';
    this.clearPendingSelectionHighlight();
    this.clearActiveHighlight();
    this.drawerEl.classList.remove('md-comments-drawer-open');
    this.pendingSelection = null;
    this.hideCommentTooltip();
  }

  private openComposerForSelection(): void {
    if (!this.pendingSelection) return;
    this.hideSelectionBubble();
    this.activeTab = 'inline';
    this.drawerEl
      ?.querySelectorAll('.md-comments-tab-btn')
      .forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'inline'));

    const panelInline = this.drawerEl?.querySelector('#starlight-panel-inline');
    const panelPage = this.drawerEl?.querySelector('#starlight-panel-page');
    if (panelInline) panelInline.classList.add('active');
    if (panelPage) panelPage.classList.remove('active');

    this.openDrawer();

    const composerWrapper = this.drawerEl?.querySelector<HTMLElement>(
      '.new-inline-composer-wrapper'
    );
    const container = this.drawerEl?.querySelector<HTMLElement>('.new-inline-composer-container');
    const preview = this.drawerEl?.querySelector<HTMLElement>('.anchor-text-preview');
    if (!composerWrapper || !container) return;

    composerWrapper.style.display = 'block';
    if (preview) {
      preview.textContent =
        this.pendingSelection.text.length > 60
          ? this.pendingSelection.text.slice(0, 60) + '...'
          : this.pendingSelection.text;
    }

    container.innerHTML = `
      <textarea placeholder="${this.currentViewer ? 'Write a comment (commits to Git)...' : 'Sign in with GitHub to commit comment...'}" class="new-inline-textarea" style="width: 100%; box-sizing: border-box; min-height: 70px; padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--sidebar-border); background: var(--composer-bg); color: var(--text-primary);"></textarea>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
        <button class="md-comments-btn-secondary cancel-new-btn">Cancel</button>
        <button class="md-comments-btn-primary submit-new-btn">Comment</button>
      </div>
    `;

    const textarea = container.querySelector('textarea');
    textarea?.focus();

    container.querySelector('.cancel-new-btn')?.addEventListener('click', () => {
      composerWrapper.style.display = 'none';
      container.innerHTML = '';
      this.pendingSelection = null;
    });

    container.querySelector('.submit-new-btn')?.addEventListener('click', async () => {
      const text = textarea?.value.trim();
      if (!text) return;

      if (!this.currentViewer) {
        const modal = new AuthModal(this.options);
        modal.show(async (token: string) => {
          this.currentViewer = await getViewer(token);
          this.updateAuthUserUI();
          await this.submitComment(text, composerWrapper, container);
        });
        return;
      }

      await this.submitComment(text, composerWrapper, container);
    });
  }

  private renderCommentCard(comment: InlineComment | PageComment, type: 'inline' | 'page'): string {
    const isInline = type === 'inline';
    const inlineC = comment as InlineComment;
    const isAuthor =
      this.currentViewer &&
      (!comment.author ||
        comment.author === 'Anonymous' ||
        comment.author.trim().toLowerCase() === this.currentViewer.login.trim().toLowerCase() ||
        (this.currentViewer.name &&
          comment.author.trim().toLowerCase() === this.currentViewer.name.trim().toLowerCase()) ||
        (displayNameCache.get(comment.author.trim().toLowerCase()) &&
          this.currentViewer.name &&
          displayNameCache.get(comment.author.trim().toLowerCase())?.toLowerCase() ===
            this.currentViewer.name.trim().toLowerCase()));

    let headerContextHtml = '';
    if (isInline) {
      headerContextHtml = `
        <div class="md-comments-context-row">
          <span class="md-comments-context-heading">${escapeHtml(inlineC.heading_context || 'Top level')}</span>
          ${inlineC.orphaned ? `<span class="md-comments-badge orphan">Orphaned</span>` : ''}
          ${inlineC.resolved ? `<span class="md-comments-badge resolved">Resolved</span>` : ''}
        </div>
        ${
          inlineC.anchor_text
            ? `<div class="md-comments-anchor-quote" title="${escapeHtml(inlineC.anchor_text)}">"${escapeHtml(inlineC.anchor_text)}"</div>`
            : ''
        }
      `;
    } else {
      headerContextHtml = `
        <div class="md-comments-context-row">
          ${comment.resolved ? `<span class="md-comments-badge resolved">Resolved</span>` : ''}
        </div>
      `;
    }

    const isEditing = this.editingCommentId === comment.id;

    const repliesHtml = (comment.replies || [])
      .map((r) => {
        const isReplyAuthor =
          this.currentViewer &&
          (!r.author ||
            r.author === 'Anonymous' ||
            r.author.trim().toLowerCase() === this.currentViewer.login.trim().toLowerCase() ||
            (this.currentViewer.name &&
              r.author.trim().toLowerCase() === this.currentViewer.name.trim().toLowerCase()));
        const isEditingReply = this.editingReplyId === r.id;

        return `
          <div class="reply-item" data-reply-id="${r.id}">
            ${renderAvatar(r.author, 32, r.author)}
            <div class="reply-content">
              <div class="reply-header">
                <div>
                  ${renderAuthor(r.author, () => this.renderDrawerContent())}
                  <span class="md-comments-time">${formatRelativeTime(r.created_at)}</span>
                </div>
                ${
                  this.currentViewer && isReplyAuthor
                    ? `
                  <div style="display: flex; gap: 2px;">
                    <button class="icon-action-btn edit-reply-btn" data-comment-id="${comment.id}" data-reply-id="${r.id}" title="Edit Reply">${ICON_EDIT}</button>
                    <button class="icon-action-btn delete-reply-btn" data-comment-id="${comment.id}" data-reply-id="${r.id}" title="Delete Reply">${ICON_DELETE}</button>
                  </div>
                `
                    : ''
                }
              </div>
              ${
                isEditingReply
                  ? `
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                  <textarea class="edit-reply-textarea" style="width: 100%; box-sizing: border-box; min-height: 50px; padding: 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--sidebar-border); background: var(--composer-bg); color: var(--text-primary);">${escapeHtml(r.body)}</textarea>
                  <div style="display: flex; justify-content: flex-end; gap: 6px;">
                    <button class="md-comments-btn-secondary cancel-edit-reply-btn" data-reply-id="${r.id}">Cancel</button>
                    <button class="md-comments-btn-primary save-edit-reply-btn" data-comment-id="${comment.id}" data-reply-id="${r.id}">Save</button>
                  </div>
                </div>
              `
                  : `<div class="reply-body">${escapeHtml(r.body)}</div>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="md-comments-card" data-id="${comment.id}" data-type="${type}">
        ${headerContextHtml}
        <div class="md-comments-card-header">
          <div class="md-comments-author-section">
            ${renderAvatar(comment.author, 40, comment.author)}
            <div class="md-comments-author-meta">
              ${renderAuthor(comment.author, () => this.renderDrawerContent())}
              <span class="md-comments-time">${formatRelativeTime(comment.created_at)}</span>
            </div>
          </div>
          <div class="md-comments-card-actions">
            ${
              this.currentViewer
                ? `
              <div class="emoji-picker-container">
                <button class="icon-action-btn emoji-picker-btn" title="Add Reaction">${ICON_REACT}</button>
                <div class="emoji-popover" style="display: none;">
                  ${['👍', '👀', '❤️', '🎉', '❓']
                    .map(
                      (e) =>
                        `<button class="emoji-opt-btn" data-id="${comment.id}" data-type="${type}" data-emoji="${e}">${e}</button>`
                    )
                    .join('')}
                </div>
              </div>
              ${
                isAuthor
                  ? `
                <button class="icon-action-btn edit-comment-btn" data-id="${comment.id}" title="Edit Comment">${ICON_EDIT}</button>
                <button class="icon-action-btn delete-comment-btn" data-id="${comment.id}" data-type="${type}" title="Delete Comment">${ICON_DELETE}</button>
              `
                  : ''
              }
              <button class="icon-action-btn resolve-btn" data-id="${comment.id}" data-type="${type}" data-resolved="${comment.resolved}" title="${comment.resolved ? 'Reopen Thread' : 'Resolve Thread'}">
                ${comment.resolved ? ICON_REOPEN : ICON_RESOLVE}
              </button>
            `
                : ''
            }
          </div>
        </div>

        ${
          isEditing
            ? `
          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
            <textarea class="edit-comment-textarea" style="width: 100%; box-sizing: border-box; min-height: 60px; padding: 8px; font-size: 13px; border-radius: 4px; border: 1px solid var(--sidebar-border); background: var(--composer-bg); color: var(--text-primary); font-family: var(--font-family);">${escapeHtml(comment.body)}</textarea>
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              <button class="md-comments-btn-secondary cancel-edit-btn" data-id="${comment.id}">Cancel</button>
              <button class="md-comments-btn-primary save-edit-btn" data-id="${comment.id}" data-type="${type}">Save</button>
            </div>
          </div>
        `
            : `<div class="md-comments-card-body">${escapeHtml(comment.body)}</div>`
        }

        ${
          comment.reactions && comment.reactions.length > 0
            ? `
          <div class="reactions-row">
            ${comment.reactions
              .map((r) => {
                const hasReacted =
                  this.currentViewer && (r.users || []).includes(this.currentViewer.login);
                return `
                <button class="reaction-chip ${hasReacted ? 'active' : ''}" data-id="${comment.id}" data-type="${type}" data-emoji="${escapeHtml(r.emoji)}">
                  ${escapeHtml(r.emoji)} <span>${(r.users || []).length}</span>
                </button>
              `;
              })
              .join('')}
          </div>
        `
            : ''
        }

        ${(comment.replies || []).length > 0 ? `<div class="replies-section">${repliesHtml}</div>` : ''}

        ${
          this.currentViewer && !comment.resolved
            ? `
          <div class="reply-composer">
            <input type="text" placeholder="Reply..." class="reply-input" data-id="${comment.id}">
            <div class="reply-expanded" style="display: none; flex-direction: column; gap: 6px;">
              <textarea placeholder="Write a reply..." style="width: 100%; box-sizing: border-box; min-height: 50px; padding: 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--sidebar-border); background: var(--composer-bg); color: var(--text-primary);"></textarea>
              <div style="display: flex; justify-content: flex-end; gap: 6px;">
                <button class="md-comments-btn-secondary cancel-reply-btn" data-id="${comment.id}">Cancel</button>
                <button class="md-comments-btn-primary send-reply-btn" data-id="${comment.id}" data-type="${type}">Reply</button>
              </div>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  private renderDrawerContent(): void {
    if (!this.drawerEl) return;
    this.updateFABCount();

    // 1. Render Inline comments
    const inlineListEl = this.drawerEl.querySelector('#starlight-inline-threads');
    if (inlineListEl) {
      const inlines = this.comments.inline_comments || [];
      if (inlines.length === 0) {
        inlineListEl.innerHTML = `
          <div style="text-align: center; padding: 36px 12px; color: var(--text-secondary);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 10px; opacity: 0.5;">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p style="font-size: 13px; font-weight: 500; margin: 0 0 4px;">No inline comments yet</p>
            <p style="font-size: 11px; margin: 0;">Highlight any text on the page to leave an inline comment.</p>
          </div>
        `;
      } else {
        inlineListEl.innerHTML = inlines.map((c) => this.renderCommentCard(c, 'inline')).join('');
      }
      this.bindCardEvents(inlineListEl);
    }

    // 2. Render Page comments
    const pageListEl = this.drawerEl.querySelector('#starlight-page-threads');
    if (pageListEl) {
      const pages = this.comments.page_comments || [];
      if (pages.length === 0) {
        pageListEl.innerHTML = `
          <div style="text-align: center; padding: 36px 12px; color: var(--text-secondary);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 10px; opacity: 0.5;">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p style="font-size: 13px; font-weight: 500; margin: 0 0 4px;">No document discussion yet</p>
            <p style="font-size: 11px; margin: 0;">Use the composer below to start a discussion.</p>
          </div>
        `;
      } else {
        pageListEl.innerHTML = pages.map((c) => this.renderCommentCard(c, 'page')).join('');
      }
      this.bindCardEvents(pageListEl);
    }
  }

  private bindCardEvents(container: Element): void {
    // Anchor jump on click
    container.querySelectorAll('.md-comments-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const type = card.getAttribute('data-type');
      if (type === 'inline' && id) {
        card.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('button, textarea, input, a')) return;
          this.scrollToCommentAnchor(id);
        });
      }
    });

    // Emoji picker popover toggle
    container.querySelectorAll('.emoji-picker-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const popover = btn.nextElementSibling as HTMLElement | null;
        if (popover) {
          popover.style.display = popover.style.display === 'none' ? 'flex' : 'none';
        }
      });
    });

    // Close emoji popovers on outside click
    document.addEventListener(
      'click',
      () => {
        container.querySelectorAll<HTMLElement>('.emoji-popover').forEach((p) => {
          p.style.display = 'none';
        });
      },
      { once: true }
    );

    // Emoji click
    container.querySelectorAll('.emoji-opt-btn, .reaction-chip').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type') as 'inline' | 'page';
        const emoji = btn.getAttribute('data-emoji');
        if (id && type && emoji) {
          await this.toggleReaction(id, type, emoji);
        }
      });
    });

    // Resolve toggle
    container.querySelectorAll('.resolve-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type') as 'inline' | 'page';
        const resolved = btn.getAttribute('data-resolved') === 'true';
        if (id && type) {
          await this.toggleResolve(id, type, !resolved);
        }
      });
    });

    // Delete comment
    container.querySelectorAll('.delete-comment-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type') as 'inline' | 'page';
        if (id && type && confirm('Delete this comment permanently from Git?')) {
          await this.deleteComment(id, type);
        }
      });
    });

    // Edit comment
    container.querySelectorAll('.edit-comment-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingCommentId = btn.getAttribute('data-id');
        this.renderDrawerContent();
      });
    });

    container.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingCommentId = null;
        this.renderDrawerContent();
      });
    });

    container.querySelectorAll('.save-edit-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type') as 'inline' | 'page';
        const card = btn.closest('.md-comments-card');
        const textarea = card?.querySelector<HTMLTextAreaElement>('.edit-comment-textarea');
        if (id && type && textarea && textarea.value.trim()) {
          await this.saveEditComment(id, type, textarea.value.trim());
        }
      });
    });

    // Edit reply
    container.querySelectorAll('.edit-reply-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingReplyId = btn.getAttribute('data-reply-id');
        this.renderDrawerContent();
      });
    });

    container.querySelectorAll('.cancel-edit-reply-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingReplyId = null;
        this.renderDrawerContent();
      });
    });

    container.querySelectorAll('.save-edit-reply-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const commentId = btn.getAttribute('data-comment-id');
        const replyId = btn.getAttribute('data-reply-id');
        const replyEl = btn.closest('.reply-item');
        const textarea = replyEl?.querySelector<HTMLTextAreaElement>('.edit-reply-textarea');
        if (commentId && replyId && textarea && textarea.value.trim()) {
          await this.saveEditReply(commentId, replyId, textarea.value.trim());
        }
      });
    });

    // Delete reply
    container.querySelectorAll('.delete-reply-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const commentId = btn.getAttribute('data-comment-id');
        const replyId = btn.getAttribute('data-reply-id');
        if (commentId && replyId && confirm('Delete this reply?')) {
          await this.deleteReply(commentId, replyId);
        }
      });
    });

    // Reply input expand
    container.querySelectorAll<HTMLInputElement>('.reply-input').forEach((input) => {
      input.addEventListener('focus', () => {
        const expanded = input.nextElementSibling as HTMLElement | null;
        if (expanded) {
          input.style.display = 'none';
          expanded.style.display = 'flex';
          const ta = expanded.querySelector('textarea');
          ta?.focus();
        }
      });
    });

    container.querySelectorAll('.cancel-reply-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const expanded = btn.closest('.reply-expanded') as HTMLElement | null;
        const input = expanded?.previousElementSibling as HTMLElement | null;
        if (expanded && input) {
          expanded.style.display = 'none';
          input.style.display = 'block';
        }
      });
    });

    container.querySelectorAll('.send-reply-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type') as 'inline' | 'page';
        const expanded = btn.closest('.reply-expanded');
        const textarea = expanded?.querySelector<HTMLTextAreaElement>('textarea');
        if (id && type && textarea && textarea.value.trim()) {
          await this.submitReply(id, type, textarea.value.trim());
        }
      });
    });
  }

  private showCommentTooltip(targetEl: HTMLElement, commentId: string): void {
    this.hideCommentTooltip();
    const comment = (this.comments.inline_comments || []).find((c) => c.id === commentId);
    if (!comment) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'md-comments-tooltip';
    const displayName = resolveDisplayName(comment.author);

    tooltip.innerHTML = `
      <div class="tooltip-header">
        ${renderAvatar(comment.author, 32, comment.author)}
        <div>
          <div class="tooltip-author">${escapeHtml(displayName)}</div>
          <div class="tooltip-time">${formatRelativeTime(comment.created_at)}</div>
        </div>
      </div>
      <div class="tooltip-body">${escapeHtml(comment.body.length > 120 ? comment.body.slice(0, 120) + '...' : comment.body)}</div>
    `;

    document.body.appendChild(tooltip);
    this.activeTooltipEl = tooltip;

    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = window.scrollY + rect.top - tooltipRect.height - 8;
    let arrowClass = 'arrow-bottom';
    if (rect.top - tooltipRect.height - 8 < 10) {
      top = window.scrollY + rect.bottom + 8;
      arrowClass = 'arrow-top';
    }

    const left = window.scrollX + rect.left + rect.width / 2;
    tooltip.classList.add(arrowClass);
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left - tooltipRect.width / 2}px`;

    requestAnimationFrame(() => tooltip.classList.add('visible'));
  }

  private hideCommentTooltip(): void {
    if (this.activeTooltipEl) {
      this.activeTooltipEl.remove();
      this.activeTooltipEl = null;
    }
  }

  private scrollToCommentAnchor(commentId: string): void {
    const anchorEl = this.container?.querySelector(
      `.md-comments-text-anchor[data-md-comment-id="${commentId}"], [data-md-comment-id~="${commentId}"]`
    ) as HTMLElement | null;

    if (anchorEl) {
      anchorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      anchorEl.classList.add('md-comments-highlight-flash');
      setTimeout(() => anchorEl.classList.remove('md-comments-highlight-flash'), 2100);
    }
  }

  private async toggleReaction(
    commentId: string,
    type: 'inline' | 'page',
    emoji: string
  ): Promise<void> {
    if (!this.currentViewer) return;
    const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
    const comment = list.find((c) => c.id === commentId);
    if (!comment) return;

    if (!comment.reactions) comment.reactions = [];
    const user = this.currentViewer.login;
    const existing = comment.reactions.find((r) => r.emoji === emoji);

    if (existing) {
      if (existing.users.includes(user)) {
        existing.users = existing.users.filter((u) => u !== user);
      } else {
        existing.users.push(user);
      }
      comment.reactions = comment.reactions.filter((r) => r.users.length > 0);
    } else {
      comment.reactions.push({ emoji, users: [user] });
    }

    this.renderDrawerContent();
    await this.saveCommentsFile();
  }

  private async toggleResolve(
    commentId: string,
    type: 'inline' | 'page',
    resolved: boolean
  ): Promise<void> {
    const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
    const comment = list.find((c) => c.id === commentId);
    if (comment) {
      comment.resolved = resolved;
      comment.resolved_at = resolved ? new Date().toISOString() : undefined;
      this.renderDrawerContent();
      this.renderInlineHighlights();
      this.updateFABCount();
      await this.saveCommentsFile();
    }
  }

  private async deleteComment(commentId: string, type: 'inline' | 'page'): Promise<void> {
    if (type === 'inline') {
      this.comments.inline_comments = this.comments.inline_comments.filter(
        (c) => c.id !== commentId
      );
    } else {
      this.comments.page_comments = this.comments.page_comments.filter((c) => c.id !== commentId);
    }
    this.renderDrawerContent();
    this.renderInlineHighlights();
    this.updateFABCount();
    await this.saveCommentsFile();
  }

  private async saveEditComment(
    commentId: string,
    type: 'inline' | 'page',
    newBody: string
  ): Promise<void> {
    const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
    const comment = list.find((c) => c.id === commentId);
    if (comment) {
      comment.body = newBody;
      comment.updated_at = new Date().toISOString();
      this.editingCommentId = null;
      this.renderDrawerContent();
      await this.saveCommentsFile();
    }
  }

  private async submitReply(
    commentId: string,
    type: 'inline' | 'page',
    replyBody: string
  ): Promise<void> {
    if (!this.currentViewer) return;
    const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
    const comment = list.find((c) => c.id === commentId);
    if (comment) {
      if (!comment.replies) comment.replies = [];
      comment.replies.push({
        id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        body: replyBody,
        created_at: new Date().toISOString(),
        author: this.currentViewer.login,
        reactions: [],
      });
      this.renderDrawerContent();
      await this.saveCommentsFile();
    }
  }

  private async saveEditReply(commentId: string, replyId: string, newBody: string): Promise<void> {
    const allComments = [
      ...(this.comments.inline_comments || []),
      ...(this.comments.page_comments || []),
    ];
    const comment = allComments.find((c) => c.id === commentId);
    if (comment && comment.replies) {
      const reply = comment.replies.find((r) => r.id === replyId);
      if (reply) {
        reply.body = newBody;
        reply.updated_at = new Date().toISOString();
        this.editingReplyId = null;
        this.renderDrawerContent();
        await this.saveCommentsFile();
      }
    }
  }

  private async deleteReply(commentId: string, replyId: string): Promise<void> {
    const allComments = [
      ...(this.comments.inline_comments || []),
      ...(this.comments.page_comments || []),
    ];
    const comment = allComments.find((c) => c.id === commentId);
    if (comment && comment.replies) {
      comment.replies = comment.replies.filter((r) => r.id !== replyId);
      this.renderDrawerContent();
      await this.saveCommentsFile();
    }
  }

  private async submitPageComment(body: string, textareaEl: HTMLTextAreaElement): Promise<void> {
    if (!this.currentViewer) {
      const modal = new AuthModal(this.options);
      modal.show(async (token: string) => {
        this.currentViewer = await getViewer(token);
        this.updateAuthUserUI();
        await this.submitPageComment(body, textareaEl);
      });
      return;
    }

    const newPageComment: PageComment = {
      id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      body,
      created_at: new Date().toISOString(),
      author: this.currentViewer.login,
      resolved: false,
      reactions: [],
      replies: [],
    };

    if (!this.comments.page_comments) this.comments.page_comments = [];
    this.comments.page_comments.unshift(newPageComment);
    textareaEl.value = '';

    this.renderDrawerContent();
    this.updateFABCount();
    await this.saveCommentsFile();
  }

  private async submitComment(
    text: string,
    composerWrapper?: HTMLElement,
    containerEl?: HTMLElement
  ): Promise<void> {
    const token = getStoredToken();
    if (!token) {
      const modal = new AuthModal(this.options);
      modal.show(async (t: string) => {
        this.currentViewer = await getViewer(t);
        this.updateAuthUserUI();
        await this.submitComment(text, composerWrapper, containerEl);
      });
      return;
    }

    if (!this.pendingSelection || !this.options.repo) return;
    const authorName = this.currentViewer?.login || 'Anonymous';

    const newComment: InlineComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      anchor_hash: this.pendingSelection.anchorId,
      anchor_text: this.pendingSelection.text,
      paragraph_index: this.pendingSelection.lineIndex,
      heading_context: this.pendingSelection.headingContext || 'Top level',
      body: text,
      created_at: new Date().toISOString(),
      author: authorName,
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    this.clearPendingSelectionHighlight();
    this.comments.inline_comments.unshift(newComment);

    if (composerWrapper) composerWrapper.style.display = 'none';
    if (containerEl) containerEl.innerHTML = '';
    this.pendingSelection = null;

    this.renderInlineHighlights();
    this.renderDrawerContent();
    this.updateFABCount();

    await this.saveCommentsFile();
  }

  private async saveCommentsFile(): Promise<void> {
    if (!this.options.repo) return;
    const [owner, repo] = this.options.repo.split('/');
    if (!owner || !repo) return;

    const filePath = this.getDocumentFilePath();
    try {
      await this.backend.write(
        {
          owner,
          repo,
          filePath,
        },
        this.comments
      );
    } catch (e) {
      console.error('[md-comments] Failed to save comments:', e);
    }
  }

  // ==========================================================================
  // Inline Document Highlighting & Text Anchors
  // ==========================================================================
  public renderInlineHighlights(): void {
    this.clearInlineHighlights();

    if (!this.container) return;
    if (!this.scanned || this.scanned.length === 0) {
      this.scanned = scanArticleAnchors(this.container);
    }

    const inlineComments = this.comments.inline_comments || [];
    for (const comment of inlineComments) {
      if (comment.resolved) continue;

      const target = resolveElementForAnchor(
        this.scanned,
        comment.anchor_hash,
        comment.anchor_text?.slice(0, 40) || '',
        comment.paragraph_index || 0
      );

      if (!target?.element) continue;

      const element = target.element;
      const anchorText = comment.anchor_text?.trim();

      if (anchorText && !this.isFullParagraphText(element, anchorText)) {
        const wrapped = this.wrapAnchorTextInElement(element, anchorText, comment.id);
        if (wrapped) continue;
      }

      this.markFullParagraph(element, comment.id);
    }
  }

  private clearInlineHighlights(): void {
    if (!this.container) return;

    const anchors = this.container.querySelectorAll<HTMLElement>(
      '.md-comments-text-anchor:not(.pending)'
    );
    anchors.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });

    const paragraphs = this.container.querySelectorAll<HTMLElement>(
      '.md-comments-paragraph-marked'
    );
    paragraphs.forEach((p) => {
      p.classList.remove('md-comments-paragraph-marked', 'md-comments-text-active');
      p.removeAttribute('data-md-comment-id');
      p.removeAttribute('title');
    });

    try {
      this.container.normalize();
    } catch {
      // Container normalize
    }
  }

  private isFullParagraphText(container: HTMLElement, anchorText: string): boolean {
    const normContainer = (container.innerText || container.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
    const normAnchor = anchorText.replace(/\s+/g, ' ').trim();
    return normContainer === normAnchor;
  }

  private markFullParagraph(container: HTMLElement, commentId: string): void {
    const existing = (container.getAttribute('data-md-comment-id') || '')
      .split(/\s+/)
      .filter(Boolean);
    if (!existing.includes(commentId)) {
      existing.push(commentId);
      container.setAttribute('data-md-comment-id', existing.join(' '));
    }
    container.classList.add('md-comments-paragraph-marked');
    container.title = 'Click to view comment';

    if (container.getAttribute('data-md-events-bound') !== 'true') {
      container.setAttribute('data-md-events-bound', 'true');
      container.addEventListener('mouseenter', () => {
        const ids = (container.getAttribute('data-md-comment-id') || '')
          .split(/\s+/)
          .filter(Boolean);
        if (ids[0]) {
          this.activateCommentHighlight(ids[0]);
          this.showCommentTooltip(container, ids[0]);
        }
      });
      container.addEventListener('mouseleave', () => {
        this.clearActiveHighlight();
        this.hideCommentTooltip();
      });
      container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' || target.tagName === 'BUTTON') return;
        const ids = (container.getAttribute('data-md-comment-id') || '')
          .split(/\s+/)
          .filter(Boolean);
        if (ids[0]) {
          e.stopPropagation();
          this.activeTab = 'inline';
          this.drawerEl
            ?.querySelectorAll('.md-comments-tab-btn')
            .forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'inline'));
          const panelInline = this.drawerEl?.querySelector('#starlight-panel-inline');
          const panelPage = this.drawerEl?.querySelector('#starlight-panel-page');
          if (panelInline) panelInline.classList.add('active');
          if (panelPage) panelPage.classList.remove('active');

          this.openDrawer();
          this.scrollToCommentAnchor(ids[0]);
        }
      });
    }
  }

  private wrapAnchorTextInElement(
    container: HTMLElement,
    anchorText: string,
    commentId: string
  ): boolean {
    if (container.querySelector(`.md-comments-text-anchor[data-md-comment-id="${commentId}"]`)) {
      return true;
    }

    const raw = container.textContent || '';
    const match = this.findNeedleRange(raw, anchorText);
    if (!match) return false;

    const range = this.createDomRange(container, match.start, match.length);
    if (!range) return false;

    const span = document.createElement('span');
    span.className = 'md-comments-text-anchor';
    span.setAttribute('data-md-comment-id', commentId);
    span.title = 'Click to view comment';

    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch {
      return false;
    }

    span.addEventListener('mouseenter', () => {
      this.activateCommentHighlight(commentId);
      this.showCommentTooltip(span, commentId);
    });
    span.addEventListener('mouseleave', () => {
      this.clearActiveHighlight();
      this.hideCommentTooltip();
    });
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      this.activeTab = 'inline';
      this.drawerEl
        ?.querySelectorAll('.md-comments-tab-btn')
        .forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'inline'));
      const panelInline = this.drawerEl?.querySelector('#starlight-panel-inline');
      const panelPage = this.drawerEl?.querySelector('#starlight-panel-page');
      if (panelInline) panelInline.classList.add('active');
      if (panelPage) panelPage.classList.remove('active');

      this.openDrawer();
      this.scrollToCommentAnchor(commentId);
    });

    return true;
  }

  private findNeedleRange(raw: string, needle: string): { start: number; length: number } | null {
    if (!needle) return null;
    const normalize = (t: string) => (t || '').replace(/\s+/g, ' ').trim();
    const n = normalize(needle);
    if (!n) return null;

    const exactIdx = raw.indexOf(needle);
    if (exactIdx >= 0) {
      return { start: exactIdx, length: needle.length };
    }

    // eslint-disable-next-line security/detect-non-literal-regexp
    const flexible = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    try {
      // eslint-disable-next-line security/detect-non-literal-regexp
      const re = new RegExp(flexible);
      const m = raw.match(re);
      if (m && m.index !== undefined) {
        return { start: m.index, length: m[0].length };
      }
    } catch {
      // Fallback
    }

    const normRaw = normalize(raw);
    const normIdx = normRaw.indexOf(n);
    if (normIdx >= 0) {
      const start = this.mapNormIndexToRaw(raw, normIdx);
      const endNorm = normIdx + n.length;
      let normCount = 0;
      let rawEnd = 0;
      let lastWasSpace = false;
      while (rawEnd < raw.length && normCount < endNorm) {
        const ch = raw[rawEnd];
        if (/\s/.test(ch)) {
          if (!lastWasSpace) {
            normCount++;
            lastWasSpace = true;
          }
        } else {
          normCount++;
          lastWasSpace = false;
        }
        rawEnd++;
      }
      return { start, length: Math.max(1, rawEnd - start) };
    }

    return null;
  }

  private mapNormIndexToRaw(raw: string, normIndex: number): number {
    let normCount = 0;
    let rawIndex = 0;
    let lastWasSpace = false;
    while (rawIndex < raw.length && normCount < normIndex) {
      const ch = raw[rawIndex];
      if (/\s/.test(ch)) {
        if (!lastWasSpace) {
          normCount++;
          lastWasSpace = true;
        }
      } else {
        normCount++;
        lastWasSpace = false;
      }
      rawIndex++;
    }
    while (rawIndex < raw.length && /\s/.test(raw[rawIndex])) {
      rawIndex++;
    }
    return rawIndex;
  }

  private createDomRange(container: HTMLElement, start: number, length: number): Range | null {
    if (typeof document === 'undefined' || !document.createRange) return null;
    const range = document.createRange();
    let offset = 0;
    let startNode: Node | null = null;
    let startOff = 0;
    let endNode: Node | null = null;
    let endOff = 0;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (
          parent.closest(
            '.md-comments-drawer, .md-comments-selection-bubble, .md-comments-fab-toggle, .md-comments-auth-modal, .md-comments-tooltip'
          ) ||
          parent.classList.contains('md-comments-text-anchor')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const len = text.length;
      if (startNode === null && offset + len > start) {
        startNode = node;
        startOff = start - offset;
      }
      if (startNode !== null && offset + len >= start + length) {
        endNode = node;
        endOff = start + length - offset;
        break;
      }
      offset += len;
    }

    if (!startNode || !endNode) {
      return null;
    }

    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    return range;
  }

  public activateCommentHighlight(commentId: string): void {
    this.clearActiveHighlight();
    if (!this.container) return;

    const textAnchors = this.container.querySelectorAll<HTMLElement>(
      `.md-comments-text-anchor[data-md-comment-id="${commentId}"]`
    );
    textAnchors.forEach((el) => el.classList.add('md-comments-text-active'));

    const markedParagraphs = this.container.querySelectorAll<HTMLElement>(
      `.md-comments-paragraph-marked[data-md-comment-id~="${commentId}"]`
    );
    markedParagraphs.forEach((el) => el.classList.add('md-comments-text-active'));
  }

  public clearActiveHighlight(): void {
    if (this.container) {
      const activeText = this.container.querySelectorAll('.md-comments-text-active');
      activeText.forEach((el) => el.classList.remove('md-comments-text-active'));
    }
  }

  private applyPendingSelectionHighlight(): void {
    this.clearPendingSelectionHighlight();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'md-comments-text-anchor pending';
    span.title = 'New comment';

    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      selection.removeAllRanges();
    } catch {
      // Ignore
    }
  }

  private clearPendingSelectionHighlight(): void {
    if (!this.container) return;
    const pendingSpans = this.container.querySelectorAll<HTMLElement>(
      '.md-comments-text-anchor.pending'
    );
    pendingSpans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    try {
      this.container.normalize();
    } catch {
      // Ignore
    }
  }
}
