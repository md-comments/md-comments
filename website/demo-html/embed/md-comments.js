/**
 * Markdown Comments - Standalone Redistributable Embed Runtime
 * Enables zero-dependency inline collaborative commenting on any static HTML page.
 * Real GitHub OAuth Device Flow authentication, text selection, and margin pins.
 */

(function () {
  'use strict';

  const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';
  const TOKEN_KEY = 'md_comments_oauth_token';

  // Extract config from script attributes or global options
  const currentScript = document.currentScript;
  const scriptOptions = currentScript
    ? {
        repo: currentScript.getAttribute('data-repo') || 'md-comments/demo-comments',
        file: currentScript.getAttribute('data-file') || window.location.pathname,
        branch: currentScript.getAttribute('data-branch') || 'main',
        theme: currentScript.getAttribute('data-theme') || 'auto',
        selector: currentScript.getAttribute('data-selector') || 'main, article, .content, body',
      }
    : {};

  const options = Object.assign(
    {
      repo: 'md-comments/demo-comments',
      file: window.location.pathname.replace(/^\//, '') || 'index.html',
      branch: 'main',
      clientId: DEFAULT_CLIENT_ID,
      selector: 'main, article, .content, body',
    },
    window.__MD_COMMENTS_OPTIONS__ || {},
    scriptOptions
  );

  const STORAGE_PREFIX = `md_comments_${options.repo}_${options.file}`;

  // Starter sample discussion threads for initial rendered demo
  const SEED_COMMENTS = [
    {
      id: 'demo-thread-1',
      anchorId: 'sec-auth-ttl',
      selectedText:
        'Should token lifetime be reduced from 60 minutes to 15 minutes for enhanced security?',
      textPrefix: 'Discussion prompt: Should token lifetime',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      author: {
        login: 'alex-rivera',
        name: 'Alex Rivera',
        avatar_url:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
      body: 'I strongly recommend 15-minute token expiry with silent background refresh via the `/auth/refresh` endpoint to minimize breach blast radius.',
      replies: [
        {
          id: 'demo-reply-1',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          author: {
            login: 'sarah-chen',
            name: 'Sarah Chen',
            avatar_url:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          },
          body: 'Agreed! Verified with our mobile clients and the refresh retry logic handles 15m intervals smoothly.',
        },
      ],
    },
    {
      id: 'demo-thread-2',
      anchorId: 'sec-failover',
      selectedText: 'autoFailover: boolean;',
      textPrefix: 'export interface ClusterConfig',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      author: {
        login: 'marcus-ops',
        name: 'Marcus Vance',
        avatar_url:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      },
      body: 'Should we add a `failoverTimeoutMs` threshold parameter to this interface for distributed quorum arbitration?',
      replies: [],
    },
  ];

  // ==========================================
  // GitHub Real Authentication Helper
  // ==========================================
  async function fetchGitHubViewer(token) {
    if (!token) return null;
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          login: data.login,
          name: data.name || data.login,
          avatar_url: data.avatar_url,
        };
      }
    } catch (e) {
      console.warn('Failed to fetch GitHub viewer profile', e);
    }
    return null;
  }

  // ==========================================
  // Auth Modal (Real GitHub OAuth Device Flow)
  // ==========================================
  class AuthModal {
    constructor(app) {
      this.app = app;
      this.modalEl = null;
      this.isPolling = false;
    }

    show(onSuccess) {
      if (this.modalEl) return;

      this.modalEl = document.createElement('div');
      this.modalEl.className = 'md-comments-auth-modal';
      this.modalEl.innerHTML = `
        <div class="md-comments-modal-backdrop"></div>
        <div class="md-comments-modal-card">
          <div class="md-comments-modal-header">
            <h3>Sign in with GitHub</h3>
            <button class="md-comments-modal-close" aria-label="Close">&times;</button>
          </div>

          <div class="md-comments-panel-oauth">
            <p class="md-comments-modal-desc">
              Authorize Markdown Comments using GitHub's secure OAuth Device Flow:
            </p>
            <div class="md-comments-code-box">
              <span class="md-comments-code-label">One-Time Device Code:</span>
              <div class="md-comments-user-code">Loading...</div>
            </div>
            <button class="md-comments-btn-primary md-comments-btn-verify" style="width: 100%; padding: 10px; font-size: 14px;" disabled>
              Open GitHub & Authorize
            </button>
            <div class="md-comments-auth-status">
              <span class="md-comments-spinner"></span>
              <span class="md-comments-status-text">Requesting authorization code from GitHub...</span>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(this.modalEl);

      const close = () => {
        this.isPolling = false;
        if (this.modalEl) {
          this.modalEl.remove();
          this.modalEl = null;
        }
      };

      this.modalEl.querySelector('.md-comments-modal-close').onclick = close;
      this.modalEl.querySelector('.md-comments-modal-backdrop').onclick = close;

      this.startRealDeviceFlow(onSuccess, close);
    }

    async startRealDeviceFlow(onSuccess, close) {
      const codeEl = this.modalEl.querySelector('.md-comments-user-code');
      const verifyBtn = this.modalEl.querySelector('.md-comments-btn-verify');
      const statusText = this.modalEl.querySelector('.md-comments-status-text');
      const spinner = this.modalEl.querySelector('.md-comments-spinner');

      const clientId = options.clientId || DEFAULT_CLIENT_ID;
      let deviceData = null;
      let pollUrl = null;

      const candidates = [
        options.authProxyUrl
          ? {
              codeUrl: `${options.authProxyUrl}/device-code`,
              pollUrl: `${options.authProxyUrl}/access-token`,
            }
          : null,
        {
          codeUrl: '/api/md-comments/auth/device-code',
          pollUrl: '/api/md-comments/auth/access-token',
        },
        {
          codeUrl: `${window.location.origin}/api/md-comments/auth/device-code`,
          pollUrl: `${window.location.origin}/api/md-comments/auth/access-token`,
        },
        {
          codeUrl: 'http://localhost:4321/api/md-comments/auth/device-code',
          pollUrl: 'http://localhost:4321/api/md-comments/auth/access-token',
        },
        {
          codeUrl: 'http://127.0.0.1:4321/api/md-comments/auth/device-code',
          pollUrl: 'http://127.0.0.1:4321/api/md-comments/auth/access-token',
        },
        {
          codeUrl: 'http://localhost:4322/api/md-comments/auth/device-code',
          pollUrl: 'http://localhost:4322/api/md-comments/auth/access-token',
        },
        {
          codeUrl: 'http://127.0.0.1:4322/api/md-comments/auth/device-code',
          pollUrl: 'http://127.0.0.1:4322/api/md-comments/auth/access-token',
        },
        {
          codeUrl: 'http://localhost:3000/api/md-comments/auth/device-code',
          pollUrl: 'http://localhost:3000/api/md-comments/auth/access-token',
        },
        {
          codeUrl: 'http://127.0.0.1:3000/api/md-comments/auth/device-code',
          pollUrl: 'http://127.0.0.1:3000/api/md-comments/auth/access-token',
        },
      ].filter(Boolean);

      for (const ep of candidates) {
        try {
          const res = await fetch(ep.codeUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: clientId,
              scope: 'public_repo repo',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.user_code && data.device_code) {
              deviceData = data;
              pollUrl = ep.pollUrl;
              break;
            }
          }
        } catch (e) {
          /* try next candidate endpoint */
        }
      }

      if (!deviceData) {
        codeEl.textContent = 'DEV-PROXY';
        statusText.innerHTML =
          'OAuth Proxy not detected on dev server.<br>Please run: <code style="color:var(--md-comments-primary); font-size:11px;">pnpm dev:website</code> or <code style="color:var(--md-comments-primary); font-size:11px;">pnpm watch:demo-astro</code>';
        if (spinner) spinner.style.display = 'none';
        return;
      }

      codeEl.textContent = deviceData.user_code;
      verifyBtn.disabled = false;
      statusText.textContent = 'Waiting for authorization on GitHub...';

      const verifyUrl =
        deviceData.verification_uri_complete ||
        deviceData.verification_uri ||
        'https://github.com/login/device';

      verifyBtn.onclick = () => {
        // Copy user code to clipboard for user convenience
        if (navigator.clipboard && deviceData.user_code) {
          navigator.clipboard.writeText(deviceData.user_code).catch(() => {});
        }
        window.open(verifyUrl, '_blank', 'noopener,noreferrer');
      };

      // Start polling for real access token
      this.isPolling = true;
      let interval = Math.max(deviceData.interval || 5, 5) * 1000;
      const startTime = Date.now();
      const expiresIn = (deviceData.expires_in || 900) * 1000;

      const poll = async () => {
        if (!this.isPolling) return;
        if (Date.now() - startTime > expiresIn) {
          statusText.textContent = 'Device code expired. Please close and try again.';
          if (spinner) spinner.style.display = 'none';
          return;
        }

        try {
          const tokenRes = await fetch(pollUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: clientId,
              device_code: deviceData.device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          });

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
              this.isPolling = false;
              localStorage.setItem(TOKEN_KEY, tokenData.access_token);
              statusText.textContent = 'Authorized! Loading profile...';

              const viewer = await fetchGitHubViewer(tokenData.access_token);
              close();
              if (onSuccess) onSuccess(viewer);
              return;
            } else if (tokenData.error === 'slow_down') {
              interval += 5000;
            } else if (tokenData.error === 'expired_token') {
              this.isPolling = false;
              statusText.textContent = 'Code expired. Please try again.';
              if (spinner) spinner.style.display = 'none';
              return;
            } else if (tokenData.error === 'access_denied') {
              this.isPolling = false;
              statusText.textContent = 'Authorization was denied on GitHub.';
              if (spinner) spinner.style.display = 'none';
              return;
            }
          }
        } catch (e) {
          /* ignore polling transient errors */
        }

        if (this.isPolling) {
          setTimeout(poll, interval);
        }
      };

      setTimeout(poll, interval);
    }
  }

  // ==========================================
  // Main Comments Application
  // ==========================================
  class CommentsApp {
    constructor() {
      this.comments = this.loadStoredComments();
      this.currentUser = null;
      this.activeTab = 'active'; // 'active' | 'resolved'
      this.activeThreadId = null;
      this.pendingSelection = null;
      this.isDrawerOpen = false;

      this.init();
    }

    loadStoredComments() {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('LocalStorage unavailable', e);
      }
      if (
        window.location.pathname.includes('sandbox') ||
        document.querySelector('[data-md-demo-seed]')
      ) {
        return [...SEED_COMMENTS];
      }
      return [];
    }

    saveComments() {
      try {
        localStorage.setItem(STORAGE_PREFIX, JSON.stringify(this.comments));
      } catch (e) {
        console.warn('Failed to save comments', e);
      }
    }

    async init() {
      this.injectDOMContainers();
      this.scanDocumentAnchors();
      this.bindSelectionListener();
      this.renderHighlights();
      this.updateFABCount();
      this.renderDrawer();

      // Check stored token
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        this.currentUser = await fetchGitHubViewer(storedToken);
        this.renderDrawer();
      }

      // Global shortcut Cmd/Ctrl + Shift + C
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          this.toggleDrawer();
        }
      });
    }

    injectDOMContainers() {
      // 1. Selection Bubble
      this.bubbleEl = document.createElement('button');
      this.bubbleEl.className = 'md-comments-selection-bubble';
      this.bubbleEl.style.display = 'none';
      this.bubbleEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
        </svg>
        <span>Comment</span>
      `;
      document.body.appendChild(this.bubbleEl);

      this.bubbleEl.addEventListener('mousedown', (e) => e.preventDefault());
      this.bubbleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openComposerForSelection();
      });

      // 2. Floating Action Button (FAB) with Official Logo
      this.fabEl = document.createElement('button');
      this.fabEl.className = 'md-comments-fab-toggle';
      this.fabEl.setAttribute('aria-label', 'Markdown Comments (Cmd/Ctrl+Shift+C)');
      this.fabEl.title = 'Markdown Comments (Cmd/Ctrl+Shift+C)';
      this.fabEl.innerHTML = `
        <svg viewBox="0 0 512 512" width="30" height="30">
          <path fill="#24292f" stroke="#ffffff" stroke-width="20" stroke-linejoin="round" d="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z"/>
          <path fill="#ffffff" d="M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"/>
        </svg>
        <span class="badge-count" style="display: none;">0</span>
      `;
      this.fabEl.addEventListener('click', () => this.toggleDrawer());
      document.body.appendChild(this.fabEl);

      // 3. Slide-over Comments Drawer
      this.drawerEl = document.createElement('div');
      this.drawerEl.className = 'md-comments-drawer';
      this.drawerEl.innerHTML = `
        <div class="md-comments-drawer-header">
          <div class="md-comments-drawer-title">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
            </svg>
            <span>Comments</span>
          </div>
          <div class="md-comments-header-actions">
            <div class="md-comments-user-badge"></div>
            <button class="md-comments-drawer-close" aria-label="Close">&times;</button>
          </div>
        </div>
        <div class="md-comments-tabs">
          <button class="md-comments-tab-btn active" data-tab="active">Active (<span class="tab-count-active">0</span>)</button>
          <button class="md-comments-tab-btn" data-tab="resolved">Resolved (<span class="tab-count-resolved">0</span>)</button>
        </div>
        <div class="md-comments-drawer-content"></div>
      `;
      document.body.appendChild(this.drawerEl);

      this.drawerEl
        .querySelector('.md-comments-drawer-close')
        .addEventListener('click', () => this.closeDrawer());

      this.drawerEl.querySelectorAll('.md-comments-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.activeTab = btn.getAttribute('data-tab');
          this.drawerEl
            .querySelectorAll('.md-comments-tab-btn')
            .forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderDrawer();
        });
      });
    }

    scanDocumentAnchors() {
      const container = document.querySelector(options.selector) || document.body;
      const blocks = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
      blocks.forEach((el, index) => {
        if (!el.getAttribute('data-md-anchor-id')) {
          const textExcerpt = (el.innerText || '')
            .trim()
            .slice(0, 20)
            .replace(/\W+/g, '-')
            .toLowerCase();
          el.setAttribute('data-md-anchor-id', `anchor-${index}-${textExcerpt}`);
        }
        if (getComputedStyle(el).position === 'static') {
          el.style.position = 'relative';
        }
      });
    }

    bindSelectionListener() {
      const handleSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          this.hideSelectionBubble();
          return;
        }

        const text = selection.toString().trim();
        if (selection.rangeCount === 0 || text.length < 2) {
          this.hideSelectionBubble();
          return;
        }

        const range = selection.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const node = ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement;

        if (!node) {
          this.hideSelectionBubble();
          return;
        }

        const block = node.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
        if (!block) {
          this.hideSelectionBubble();
          return;
        }

        const anchorId = block.getAttribute('data-md-anchor-id') || 'general';
        const textPrefix = (block.innerText || '').trim().slice(0, 40);

        this.pendingSelection = {
          text,
          anchorId,
          textPrefix,
        };

        const rect = range.getBoundingClientRect();
        this.showSelectionBubble(rect);
      };

      document.addEventListener('selectionchange', handleSelection);
      document.addEventListener('mouseup', () => setTimeout(handleSelection, 20));
    }

    showSelectionBubble(rect) {
      if (!this.bubbleEl) return;
      this.bubbleEl.style.top = `${window.scrollY + rect.top - 40}px`;
      this.bubbleEl.style.left = `${window.scrollX + rect.left + rect.width / 2 - 40}px`;
      this.bubbleEl.style.display = 'inline-flex';
    }

    hideSelectionBubble() {
      if (this.bubbleEl) {
        this.bubbleEl.style.display = 'none';
      }
    }

    openComposerForSelection() {
      this.hideSelectionBubble();
      this.openDrawer();

      const content = this.drawerEl.querySelector('.md-comments-drawer-content');
      let composer = content.querySelector('.md-comments-new-composer');

      if (!composer) {
        composer = document.createElement('div');
        composer.className = 'md-comments-composer md-comments-new-composer';
        content.insertBefore(composer, content.firstChild);
      }

      const selText = this.pendingSelection ? this.pendingSelection.text : '';

      composer.innerHTML = `
        <div class="md-comments-thread-anchor">
          "${selText.length > 60 ? selText.slice(0, 57) + '...' : selText}"
        </div>
        <textarea placeholder="${this.currentUser ? 'Write a comment or question...' : 'Sign in with GitHub to post a comment...'}"></textarea>
        <div class="md-comments-composer-actions">
          <button class="md-comments-btn-sm cancel-new-btn">Cancel</button>
          <button class="md-comments-btn-primary submit-new-btn">${this.currentUser ? 'Post Comment' : 'Sign in with GitHub'}</button>
        </div>
      `;

      const textarea = composer.querySelector('textarea');
      textarea.focus();

      composer.querySelector('.cancel-new-btn').onclick = () => {
        composer.remove();
        this.pendingSelection = null;
      };

      composer.querySelector('.submit-new-btn').onclick = () => {
        if (!this.currentUser) {
          const modal = new AuthModal(this);
          modal.show((viewer) => {
            this.currentUser = viewer;
            this.renderDrawer();
            if (textarea.value.trim()) {
              this.submitComment(textarea.value.trim(), composer);
            }
          });
          return;
        }

        const body = textarea.value.trim();
        if (!body) return;
        this.submitComment(body, composer);
      };
    }

    submitComment(body, composerEl) {
      if (!this.currentUser) return;
      const newThread = {
        id: `thread-${Date.now()}`,
        anchorId: this.pendingSelection ? this.pendingSelection.anchorId : 'general',
        selectedText: this.pendingSelection ? this.pendingSelection.text : '',
        textPrefix: this.pendingSelection ? this.pendingSelection.textPrefix : '',
        status: 'open',
        createdAt: new Date().toISOString(),
        author: this.currentUser,
        body: body,
        replies: [],
      };

      this.comments.unshift(newThread);
      this.saveComments();
      this.pendingSelection = null;
      if (composerEl) composerEl.remove();
      this.renderDrawer();
      this.renderHighlights();
      this.updateFABCount();
    }

    renderHighlights() {
      // 1. Remove existing comment anchor spans and restore original text
      const existingAnchors = document.querySelectorAll('.md-comments-text-anchor');
      existingAnchors.forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ''), el);
          parent.normalize();
        }
      });

      const openThreads = this.comments.filter((c) => c.status === 'open' && c.selectedText);
      const container = document.querySelector(options.selector) || document.body;

      openThreads.forEach((th) => {
        const query = (th.selectedText || '').trim();
        if (!query) return;

        let targetEl = th.anchorId
          ? document.querySelector(`[data-md-anchor-id="${th.anchorId}"]`)
          : null;
        if (!targetEl) targetEl = container;

        // Traverse text nodes within targetEl to find and wrap the exact string
        const walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null);
        let textNode;
        while ((textNode = walker.nextNode())) {
          const content = textNode.textContent || '';
          const idx = content.indexOf(query);
          if (idx !== -1) {
            try {
              const range = document.createRange();
              range.setStart(textNode, idx);
              range.setEnd(textNode, idx + query.length);

              const anchorSpan = document.createElement('span');
              anchorSpan.className = 'md-comments-text-anchor';
              anchorSpan.setAttribute('data-thread-id', th.id);
              anchorSpan.title = 'Click to view comment thread';

              range.surroundContents(anchorSpan);

              anchorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.activeThreadId = th.id;
                this.openDrawer();
                this.highlightThread(th.id);
              });
            } catch (e) {
              // If cross-tag, mark parent element
              targetEl.classList.add('md-comments-text-anchor');
            }
            break;
          }
        }
      });
    }

    updateFABCount() {
      const openCount = this.comments.filter((c) => c.status === 'open').length;
      const resolvedCount = this.comments.filter((c) => c.status === 'resolved').length;

      const badge = this.fabEl.querySelector('.badge-count');
      if (openCount > 0) {
        badge.textContent = openCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      const activeTabCount = this.drawerEl.querySelector('.tab-count-active');
      const resolvedTabCount = this.drawerEl.querySelector('.tab-count-resolved');
      if (activeTabCount) activeTabCount.textContent = openCount;
      if (resolvedTabCount) resolvedTabCount.textContent = resolvedCount;
    }

    toggleDrawer() {
      if (this.isDrawerOpen) {
        this.closeDrawer();
      } else {
        this.openDrawer();
      }
    }

    openDrawer() {
      this.isDrawerOpen = true;
      this.drawerEl.classList.add('md-comments-drawer-open');
      document.documentElement.classList.add('md-comments-panel-open');
      this.renderDrawer();
    }

    closeDrawer() {
      this.isDrawerOpen = false;
      this.drawerEl.classList.remove('md-comments-drawer-open');
      document.documentElement.classList.remove('md-comments-panel-open');
    }

    highlightThread(threadId) {
      setTimeout(() => {
        const card = this.drawerEl.querySelector(`[data-thread-id="${threadId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('highlighted');
          setTimeout(() => card.classList.remove('highlighted'), 2000);
        }
      }, 100);
    }

    renderDrawer() {
      const userBadge = this.drawerEl.querySelector('.md-comments-user-badge');
      if (userBadge) {
        if (this.currentUser) {
          userBadge.innerHTML = `
            <div class="md-comments-user-info">
              <img class="md-comments-avatar" src="${this.currentUser.avatar_url}" alt="${this.currentUser.login}" />
              <button class="md-comments-btn-link md-comments-logout-btn" title="Sign out (${this.currentUser.login})">Sign Out</button>
            </div>
          `;
          userBadge.querySelector('.md-comments-logout-btn').onclick = () => {
            localStorage.removeItem(TOKEN_KEY);
            this.currentUser = null;
            this.renderDrawer();
          };
        } else {
          userBadge.innerHTML = `
            <button class="md-comments-btn-primary md-comments-login-btn" style="padding: 4px 10px; font-size: 11px;">Sign In</button>
          `;
          userBadge.querySelector('.md-comments-login-btn').onclick = () => {
            const modal = new AuthModal(this);
            modal.show((viewer) => {
              this.currentUser = viewer;
              this.renderDrawer();
            });
          };
        }
      }

      const content = this.drawerEl.querySelector('.md-comments-drawer-content');
      const filtered = this.comments.filter((c) =>
        this.activeTab === 'resolved' ? c.status === 'resolved' : c.status !== 'resolved'
      );

      if (filtered.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--md-comments-text-muted);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.6;">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p style="font-size: 14px; font-weight: 500; margin-bottom: 6px;">No ${this.activeTab} discussions</p>
            <p style="font-size: 12px;">Highlight any text on the page to start a new discussion thread!</p>
          </div>
        `;
        return;
      }

      content.innerHTML = filtered
        .map((th) => {
          const timeAgo = this.formatTimeAgo(th.createdAt);
          return `
          <div class="md-comments-thread-card" data-thread-id="${th.id}">
            ${th.selectedText ? `<div class="md-comments-thread-anchor">"${th.selectedText}"</div>` : ''}
            <div class="md-comments-thread-header">
              <div class="md-comments-user-info">
                <img class="md-comments-avatar" src="${th.author.avatar_url}" alt="${th.author.login}" />
                <div>
                  <div class="md-comments-username">${th.author.name || th.author.login}</div>
                  <div class="md-comments-time">${timeAgo}</div>
                </div>
              </div>
            </div>
            <div class="md-comments-body">${this.escapeHTML(th.body)}</div>

            ${
              th.replies && th.replies.length > 0
                ? `
              <div class="md-comments-replies">
                ${th.replies
                  .map(
                    (rep) => `
                  <div class="md-comments-reply-item">
                    <div class="md-comments-user-info">
                      <img class="md-comments-avatar" style="width: 20px; height: 20px;" src="${rep.author.avatar_url}" alt="${rep.author.login}" />
                      <span class="md-comments-username" style="font-size: 12px;">${rep.author.name || rep.author.login}</span>
                      <span class="md-comments-time">${this.formatTimeAgo(rep.createdAt)}</span>
                    </div>
                    <div class="md-comments-body" style="font-size: 12px;">${this.escapeHTML(rep.body)}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <div class="md-comments-thread-actions">
              <button class="md-comments-btn-sm reply-toggle-btn" data-id="${th.id}">Reply</button>
              <button class="md-comments-btn-sm resolve-btn" data-id="${th.id}">
                ${th.status === 'resolved' ? 'Reopen' : '✓ Resolve'}
              </button>
              <button class="md-comments-btn-sm delete-btn" data-id="${th.id}">Delete</button>
            </div>

            <div class="reply-composer-container" id="reply-box-${th.id}" style="display: none; margin-top: 8px;">
              <textarea placeholder="${this.currentUser ? 'Write a reply...' : 'Sign in with GitHub to post a reply...'}" style="width: 100%; min-height: 50px; padding: 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--md-comments-border); background: var(--md-comments-bg); color: var(--md-comments-text); box-sizing: border-box;"></textarea>
              <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px;">
                <button class="md-comments-btn-sm cancel-reply-btn" data-id="${th.id}">Cancel</button>
                <button class="md-comments-btn-primary send-reply-btn" data-id="${th.id}" style="font-size: 11px; padding: 4px 10px;">Post Reply</button>
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      // Bind action listeners
      content.querySelectorAll('.resolve-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const thread = this.comments.find((t) => t.id === id);
          if (thread) {
            thread.status = thread.status === 'resolved' ? 'open' : 'resolved';
            this.saveComments();
            this.renderDrawer();
            this.renderHighlights();
            this.updateFABCount();
          }
        });
      });

      content.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.comments = this.comments.filter((t) => t.id !== id);
          this.saveComments();
          this.renderDrawer();
          this.renderHighlights();
          this.updateFABCount();
        });
      });

      content.querySelectorAll('.reply-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const box = document.getElementById(`reply-box-${id}`);
          if (box) {
            box.style.display = box.style.display === 'none' ? 'block' : 'none';
            if (box.style.display === 'block') {
              box.querySelector('textarea').focus();
            }
          }
        });
      });

      content.querySelectorAll('.cancel-reply-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const box = document.getElementById(`reply-box-${id}`);
          if (box) box.style.display = 'none';
        });
      });

      content.querySelectorAll('.send-reply-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const box = document.getElementById(`reply-box-${id}`);
          const text = box.querySelector('textarea').value.trim();
          if (!text) return;

          if (!this.currentUser) {
            const modal = new AuthModal(this);
            modal.show((viewer) => {
              this.currentUser = viewer;
              this.renderDrawer();
              this.postReply(id, text);
            });
            return;
          }

          this.postReply(id, text);
        });
      });
    }

    postReply(threadId, text) {
      const thread = this.comments.find((t) => t.id === threadId);
      if (thread) {
        if (!thread.replies) thread.replies = [];
        thread.replies.push({
          id: `reply-${Date.now()}`,
          createdAt: new Date().toISOString(),
          author: this.currentUser,
          body: text,
        });
        this.saveComments();
        this.renderDrawer();
        this.updateFABCount();
      }
    }

    formatTimeAgo(isoString) {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay}d ago`;
    }

    escapeHTML(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // Mount when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CommentsApp());
  } else {
    new CommentsApp();
  }
})();
