import { GitHubOrphanRefBackend, type CommentsFile, type InlineComment } from '@md-comments/shared';
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
  private activeThreadId: string | null = null;
  private pendingSelection: {
    text: string;
    anchorId: string;
    lineIndex: number;
    textPrefix: string;
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
    }

    await this.loadComments();
    this.updateFABCount();
  }

  private initDOM(): void {
    // 2. Selection Bubble
    this.selectionBubbleEl = document.createElement('button');
    this.selectionBubbleEl.className = 'md-comments-selection-bubble';
    this.selectionBubbleEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
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
      this.openNewCommentDrawer();
    });

    // 3. Floating Action Button (Bottom Right)
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

    // 4. Comments Drawer
    this.drawerEl = document.createElement('div');
    this.drawerEl.className = 'md-comments-drawer';
    const drawerWidth = this.options.ui?.drawerWidth || 360;
    this.drawerEl.style.width = `${drawerWidth}px`;
    this.drawerEl.innerHTML = `
      <div class="md-comments-drawer-header">
        <div class="md-comments-drawer-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
          </svg>
          <span>Comments</span>
        </div>
        <div class="md-comments-header-actions">
          <div class="md-comments-auth-user"></div>
          <button class="md-comments-drawer-close" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="md-comments-drawer-content"></div>
    `;
    document.body.appendChild(this.drawerEl);

    const closeBtn = this.drawerEl.querySelector('.md-comments-drawer-close');
    closeBtn?.addEventListener('click', () => this.closeDrawer());

    this.updateAuthUserUI();
  }

  private updateAuthUserUI(): void {
    if (!this.drawerEl) return;
    const authContainer = this.drawerEl.querySelector('.md-comments-auth-user');
    if (!authContainer) return;

    if (this.currentViewer) {
      authContainer.innerHTML = `
        <img class="md-comments-avatar" src="${this.currentViewer.avatar_url}" alt="${this.currentViewer.login}" />
        <button class="md-comments-btn-link md-comments-logout-btn" title="Sign out (${this.currentViewer.login})">Sign Out</button>
      `;
      authContainer.querySelector('.md-comments-logout-btn')?.addEventListener('click', () => {
        clearOAuthToken();
        this.currentViewer = null;
        this.updateAuthUserUI();
        this.renderDrawerContent();
      });
    } else {
      authContainer.innerHTML = `
        <button class="md-comments-btn-primary md-comments-login-btn">Sign In</button>
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

      this.pendingSelection = { text, anchorId, lineIndex, textPrefix };

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
    this.selectionBubbleEl.style.display = 'flex';
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
    this.updateFABCount();
  }

  private updateFABCount(): void {
    if (!this.fabEl) return;
    const count =
      (this.comments.inline_comments || []).length + (this.comments.page_comments || []).length;
    const badge = this.fabEl.querySelector<HTMLElement>('.badge-count');
    if (badge) {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  private getDocumentFilePath(): string {
    const basePath = this.options.docBasePath || 'src/content/docs';
    let path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (!path) path = 'index';
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
    const drawerWidth = this.options.ui?.drawerWidth || 360;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style?.setProperty?.(
        '--md-comments-drawer-width',
        `${drawerWidth}px`
      );
      document.documentElement.classList?.add?.('md-comments-panel-open');
    }
    this.drawerEl.classList.add('md-comments-drawer-open');
    this.renderDrawerContent();
  }

  public closeDrawer(): void {
    if (!this.drawerEl) return;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList?.remove?.('md-comments-panel-open');
    }
    this.drawerEl.classList.remove('md-comments-drawer-open');
    this.activeThreadId = null;
    this.pendingSelection = null;
  }

  private openNewCommentDrawer(): void {
    this.activeThreadId = null;
    this.openDrawer();
  }

  public openThreadDrawer(threadId: string): void {
    this.pendingSelection = null;
    this.activeThreadId = threadId;
    this.openDrawer();
  }

  private renderDrawerContent(): void {
    if (!this.drawerEl) return;
    const contentEl = this.drawerEl.querySelector('.md-comments-drawer-content');
    if (!contentEl) return;

    if (this.pendingSelection) {
      contentEl.innerHTML = `
        <div class="md-comments-thread md-comments-new-thread">
          <div class="md-comments-quote-box">
            "${this.pendingSelection.text}"
          </div>
          <div class="md-comments-form">
            <textarea class="md-comments-input" placeholder="Leave a comment on selected text..."></textarea>
            <div class="md-comments-form-actions">
              <button class="md-comments-btn-secondary md-comments-btn-cancel">Cancel</button>
              <button class="md-comments-btn-primary md-comments-btn-submit">Comment</button>
            </div>
          </div>
        </div>
      `;

      const submitBtn = contentEl.querySelector('.md-comments-btn-submit');
      const cancelBtn = contentEl.querySelector('.md-comments-btn-cancel');
      const textarea = contentEl.querySelector<HTMLTextAreaElement>('.md-comments-input');

      cancelBtn?.addEventListener('click', () => {
        this.pendingSelection = null;
        this.renderDrawerContent();
      });

      submitBtn?.addEventListener('click', async () => {
        const text = textarea?.value.trim();
        if (!text) return;
        await this.submitComment(text);
      });
      return;
    }

    const inlineComments = this.comments.inline_comments || [];
    const activeComment = inlineComments.find((c) => c.id === this.activeThreadId);

    if (activeComment) {
      contentEl.innerHTML = `
        <div class="md-comments-thread-view">
          <div class="md-comments-thread-toolbar">
            <button class="md-comments-back-btn">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h8.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/>
              </svg>
              <span>All Comments</span>
            </button>
          </div>
          <div class="md-comments-thread">
            <div class="md-comments-quote-box">
              "${activeComment.anchor_text || ''}"
            </div>
            <div class="md-comments-card">
              <div class="md-comments-card-header">
                <strong>${activeComment.author || 'Anonymous'}</strong>
                <span class="md-comments-time">${new Date(activeComment.created_at).toLocaleDateString()}</span>
              </div>
              <div class="md-comments-card-body">${activeComment.body}</div>
            </div>
            ${(activeComment.replies || [])
              .map(
                (r) => `
              <div class="md-comments-card md-comments-reply-card">
                <div class="md-comments-card-header">
                  <strong>${r.author || 'Anonymous'}</strong>
                  <span class="md-comments-time">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div class="md-comments-card-body">${r.body}</div>
              </div>
            `
              )
              .join('')}
            <div class="md-comments-form">
              <textarea class="md-comments-input" placeholder="Write a reply..."></textarea>
              <div class="md-comments-form-actions">
                <button class="md-comments-btn-primary md-comments-btn-reply">Reply</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const backBtn = contentEl.querySelector('.md-comments-back-btn');
      backBtn?.addEventListener('click', () => {
        this.activeThreadId = null;
        this.renderDrawerContent();
      });

      const replyBtn = contentEl.querySelector('.md-comments-btn-reply');
      const replyTextarea = contentEl.querySelector<HTMLTextAreaElement>('.md-comments-input');
      replyBtn?.addEventListener('click', async () => {
        const text = replyTextarea?.value.trim();
        if (!text) return;
        await this.submitReply(activeComment.id, text);
      });
      return;
    }

    // Default: Show all comments summary or list
    const allComments = this.comments.inline_comments || [];
    if (allComments.length === 0) {
      contentEl.innerHTML = `
        <div class="md-comments-empty-state">
          <svg width="36" height="36" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
          </svg>
          <h4>No comments yet</h4>
          <p>Highlight any text in the document to leave an inline comment.</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="md-comments-list-view">
        <div class="md-comments-list-header">
          <span>${allComments.length} ${allComments.length === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        <div class="md-comments-list">
          ${allComments
            .map(
              (c) => `
            <div class="md-comments-list-item" data-thread-id="${c.id}">
              ${
                c.anchor_text
                  ? `<div class="md-comments-list-quote">"${c.anchor_text.length > 70 ? c.anchor_text.slice(0, 70) + '...' : c.anchor_text}"</div>`
                  : ''
              }
              <div class="md-comments-card-header">
                <strong>${c.author || 'Anonymous'}</strong>
                <span class="md-comments-time">${new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div class="md-comments-list-body">${c.body}</div>
              ${
                c.replies && c.replies.length > 0
                  ? `<div class="md-comments-reply-badge">${c.replies.length} ${c.replies.length === 1 ? 'reply' : 'replies'}</div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const itemEls = contentEl.querySelectorAll('.md-comments-list-item');
    itemEls.forEach((el) => {
      el.addEventListener('click', () => {
        const threadId = el.getAttribute('data-thread-id');
        if (!threadId) return;

        const comment = allComments.find((c) => c.id === threadId);
        if (comment) {
          const match = resolveElementForAnchor(
            this.scanned,
            comment.anchor_hash,
            comment.anchor_text?.slice(0, 40) || '',
            comment.paragraph_index || 0
          );
          if (match?.element) {
            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        this.openThreadDrawer(threadId);
      });
    });
  }

  private async submitComment(text: string): Promise<void> {
    const token = getStoredToken();
    if (!token) {
      const modal = new AuthModal(this.options);
      modal.show(async (t: string) => {
        this.currentViewer = await getViewer(t);
        this.updateAuthUserUI();
        await this.submitComment(text);
      });
      return;
    }

    if (!this.pendingSelection || !this.options.repo) return;
    const [owner, repo] = this.options.repo.split('/');
    if (!owner || !repo) return;

    const authorName = this.currentViewer?.name || this.currentViewer?.login || 'GitHub User';

    const newComment: InlineComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      anchor_hash: this.pendingSelection.anchorId,
      anchor_text: this.pendingSelection.text,
      paragraph_index: this.pendingSelection.lineIndex,
      heading_context: '',
      body: text,
      created_at: new Date().toISOString(),
      author: authorName,
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const filePath = this.getDocumentFilePath();
    this.comments.inline_comments.push(newComment);

    await this.backend.write(
      {
        owner,
        repo,
        filePath,
      },
      this.comments
    );

    this.pendingSelection = null;
    this.activeThreadId = newComment.id;
    this.renderDrawerContent();
    this.updateFABCount();
  }

  private async submitReply(threadId: string, text: string): Promise<void> {
    const token = getStoredToken();
    if (!token) {
      const modal = new AuthModal(this.options);
      modal.show(async (t: string) => {
        this.currentViewer = await getViewer(t);
        this.updateAuthUserUI();
        await this.submitReply(threadId, text);
      });
      return;
    }

    if (!this.options.repo) return;
    const [owner, repo] = this.options.repo.split('/');
    if (!owner || !repo) return;

    const comment = this.comments.inline_comments.find((c) => c.id === threadId);
    if (!comment) return;

    const authorName = this.currentViewer?.name || this.currentViewer?.login || 'GitHub User';

    if (!comment.replies) comment.replies = [];
    comment.replies.push({
      id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      body: text,
      created_at: new Date().toISOString(),
      author: authorName,
      reactions: [],
    });

    const filePath = this.getDocumentFilePath();
    await this.backend.write(
      {
        owner,
        repo,
        filePath,
      },
      this.comments
    );

    this.renderDrawerContent();
    this.updateFABCount();
  }
}
