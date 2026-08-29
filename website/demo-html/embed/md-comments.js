/**
 * Markdown Comments - Standalone Redistributable Embed Runtime
 * Enables zero-dependency inline collaborative commenting on any static HTML page.
 * Real Git Backend: Commits comments directly to GitHub orphan ref refs/md-comments/data.
 * Feature & Visual parity with the GitHub Chrome Extension standard (100% match).
 */

(function () {
  'use strict';

  const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';
  const TOKEN_KEY = 'md_comments_oauth_token';
  const ORPHAN_REF_NAME = 'refs/md-comments/data';

  // SVG Icons matching GitHub Extension exactly
  const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON_DELETE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON_RESOLVE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l3.5 3.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON_REOPEN = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.5M20 12a8 8 0 0 1-13.5 5.5M16 6.5V10h-3.5M8 17.5V14H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON_REACT = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.25 10.25h.01M14.75 10.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.25 14.25c.85 1.15 2 1.75 2.75 1.75s1.9-.6 2.75-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  const displayNameCache = new Map();
  const pendingFetches = new Set();

  // Extract config from script attributes or global options
  const currentScript = document.currentScript;
  const scriptOptions = currentScript
    ? {
        repo: currentScript.getAttribute('data-repo') || 'md-comments/html-demo-comments',
        file: currentScript.getAttribute('data-file') || window.location.pathname,
        branch: currentScript.getAttribute('data-branch') || 'main',
        theme: currentScript.getAttribute('data-theme') || 'auto',
        selector: currentScript.getAttribute('data-selector') || 'main, article, .content, body',
      }
    : {};

  const options = Object.assign(
    {
      repo: 'md-comments/html-demo-comments',
      file: window.location.pathname.replace(/^\//, '') || 'index.html',
      branch: 'main',
      clientId: DEFAULT_CLIENT_ID,
      selector: 'main, article, .content, body',
    },
    window.__MD_COMMENTS_OPTIONS__ || {},
    scriptOptions
  );

  // ==========================================
  // Formatting & Display Helpers
  // ==========================================
  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatRelativeTime(dateStr) {
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

  function isGitHubLogin(name) {
    return /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test((name || '').trim());
  }

  function resolveDisplayName(author, onResolved) {
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

  function renderAuthor(author, onResolved) {
    const login = (author || '').trim();
    const displayName = resolveDisplayName(login, onResolved);
    if (isGitHubLogin(login)) {
      const title = displayName !== login ? ` title="@${escapeHtml(login)}"` : '';
      return `<a href="https://github.com/${encodeURIComponent(login)}" class="md-comments-username" target="_blank" rel="noopener noreferrer"${title}>${escapeHtml(displayName)}</a>`;
    }
    return `<span class="md-comments-username">${escapeHtml(displayName)}</span>`;
  }

  // ==========================================
  // Unicode Base64 & YAML Serialization Helpers
  // ==========================================
  function decodeBase64Utf8(base64Str) {
    const clean = (base64Str || '').replace(/\s/g, '');
    if (!clean) return '';
    try {
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return atob(clean);
    }
  }

  function parseYamlVal(val) {
    if (!val) return '';
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null' || val === '~') return null;
    if (val === '[]') return [];
    if (val === '{}') return {};
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      try {
        return JSON.parse(val);
      } catch {
        return val.slice(1, -1);
      }
    }
    return val;
  }

  function parseYamlComments(str) {
    if (!str || !str.trim()) return { inline_comments: [], page_comments: [] };
    const trimmed = str.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          inline_comments: parsed.inline_comments || [],
          page_comments: parsed.page_comments || [],
        };
      } catch {
        /* fall through to yaml parsing */
      }
    }

    const lines = str.split(/\r?\n/);
    const root = { inline_comments: [], page_comments: [] };
    let currentSection = null;
    let currentItem = null;
    let currentReplies = null;
    let currentReply = null;
    let inReplies = false;

    for (const rawLine of lines) {
      const line = rawLine.replace(/\t/g, '  ');
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const indent = line.search(/\S/);

      if (trimmedLine.startsWith('inline_comments:')) {
        currentSection = 'inline_comments';
        inReplies = false;
        currentItem = null;
        continue;
      } else if (trimmedLine.startsWith('page_comments:')) {
        currentSection = 'page_comments';
        inReplies = false;
        currentItem = null;
        continue;
      }

      if (!currentSection) continue;

      if (trimmedLine.startsWith('- ') && indent <= 4 && !inReplies) {
        currentItem = {};
        root[currentSection].push(currentItem);
        inReplies = false;
        currentReplies = null;
        currentReply = null;

        const rest = trimmedLine.slice(2).trim();
        if (rest) {
          const colonIdx = rest.indexOf(':');
          if (colonIdx !== -1) {
            const k = rest.slice(0, colonIdx).trim();
            const v = parseYamlVal(rest.slice(colonIdx + 1).trim());
            currentItem[k] = v;
          }
        }
        continue;
      }

      if (currentItem && trimmedLine.startsWith('replies:')) {
        inReplies = true;
        currentReplies = [];
        currentItem.replies = currentReplies;
        continue;
      }

      if (inReplies && trimmedLine.startsWith('- ') && indent >= 4) {
        currentReply = {};
        if (currentReplies) currentReplies.push(currentReply);
        const rest = trimmedLine.slice(2).trim();
        if (rest) {
          const colonIdx = rest.indexOf(':');
          if (colonIdx !== -1) {
            const k = rest.slice(0, colonIdx).trim();
            const v = parseYamlVal(rest.slice(colonIdx + 1).trim());
            currentReply[k] = v;
          }
        }
        continue;
      }

      const colonIdx = trimmedLine.indexOf(':');
      if (colonIdx !== -1) {
        const k = trimmedLine.slice(0, colonIdx).trim();
        const v = parseYamlVal(trimmedLine.slice(colonIdx + 1).trim());
        if (inReplies && currentReply) {
          currentReply[k] = v;
        } else if (currentItem) {
          currentItem[k] = v;
        }
      }
    }

    return root;
  }

  function stringifyYaml(obj, indent = 0) {
    const pad = ' '.repeat(indent);
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
    if (typeof obj === 'string') {
      if (
        obj.includes('\n') ||
        /[:#[\]{},"'|>&*!%@`]/.test(obj) ||
        obj.trim() !== obj ||
        obj === ''
      ) {
        return JSON.stringify(obj);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj
        .map((item) => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const entries = Object.entries(item);
            if (entries.length === 0) return `${pad}- {}`;
            const first = entries[0];
            const rest = entries.slice(1);
            let str = `${pad}- ${first[0]}: ${stringifyYaml(first[1], indent + 4).trimStart()}`;
            for (const [k, v] of rest) {
              str += `\n${pad}  ${k}: ${stringifyYaml(v, indent + 4).trimStart()}`;
            }
            return str;
          }
          return `${pad}- ${stringifyYaml(item, indent + 2).trimStart()}`;
        })
        .join('\n');
    }
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries
        .map(([k, v]) => {
          if (
            typeof v === 'object' &&
            v !== null &&
            (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)
          ) {
            return `${pad}${k}:\n${stringifyYaml(v, indent + 2)}`;
          }
          return `${pad}${k}: ${stringifyYaml(v, indent + 2)}`;
        })
        .join('\n');
    }
    return String(obj);
  }

  function getCommentsPath(rawFile) {
    const clean = (rawFile || 'index.html')
      .replace(/^\//, '')
      .replace(/\.html?$/i, '')
      .replace(/\.(?:[a-f0-9]{7,40}\.)?comments\.(?:yml|yaml)$/i, '');
    return `${clean}.0000000.comments.yml`;
  }

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
          avatar_url: data.avatar_url || `https://github.com/${data.login}.png`,
        };
      }
    } catch (e) {
      console.warn('[md-comments] Failed to fetch GitHub user viewer:', e);
    }
    return null;
  }

  // ==========================================
  // Auth Modal (No auto popup, user-driven)
  // ==========================================
  class AuthModal {
    constructor(app) {
      this.app = app;
      this.modalEl = null;
      this.isPolling = false;
    }

    show(onSuccess) {
      if (this.modalEl) this.modalEl.remove();

      this.modalEl = document.createElement('div');
      this.modalEl.className = 'md-comments-auth-modal';
      this.modalEl.innerHTML = `
        <div class="md-comments-auth-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Sign in with GitHub</h3>
            <button class="md-comments-drawer-close modal-close-btn">&times;</button>
          </div>
          <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
            Authenticate with GitHub to leave comments directly on repository <strong>${escapeHtml(options.repo)}</strong>.
          </p>
          <div class="md-comments-user-code" style="display: none;">------</div>
          <div style="display: flex; gap: 8px;">
            <button class="md-comments-btn-primary md-comments-btn-verify" style="flex: 1; justify-content: center; padding: 8px 14px; font-size: 13px;" disabled>
              Open GitHub Activation
            </button>
          </div>
          <div class="md-comments-auth-status" style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
            <div class="md-comments-spinner" style="width: 14px; height: 14px;"></div>
            <span class="md-comments-status-text">Requesting device authorization code...</span>
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

      this.modalEl.querySelector('.modal-close-btn').onclick = close;
      this.modalEl.onclick = (e) => {
        if (e.target === this.modalEl) close();
      };

      this.startDeviceFlow(onSuccess, close);
    }

    async startDeviceFlow(onSuccess, close) {
      const codeEl = this.modalEl.querySelector('.md-comments-user-code');
      const verifyBtn = this.modalEl.querySelector('.md-comments-btn-verify');
      const statusText = this.modalEl.querySelector('.md-comments-status-text');
      const spinner = this.modalEl.querySelector('.md-comments-spinner');

      const clientId = options.clientId || DEFAULT_CLIENT_ID;

      const candidates = [
        {
          codeUrl: 'https://md-comments-oauth.vercel.app/api/device/code',
          pollUrl: 'https://md-comments-oauth.vercel.app/api/device/token',
        },
        {
          codeUrl: 'https://github.com/login/device/code',
          pollUrl: 'https://github.com/login/oauth/access_token',
        },
      ];

      let deviceData = null;
      let pollUrl = '';

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
              scope: 'repo read:user',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.device_code && data.user_code) {
              deviceData = data;
              pollUrl = ep.pollUrl;
              break;
            }
          }
        } catch {
          // Fall through
        }
      }

      if (!deviceData) {
        statusText.textContent = 'Failed to obtain device code. Check network or Client ID.';
        if (spinner) spinner.style.display = 'none';
        return;
      }

      codeEl.style.display = 'block';
      codeEl.textContent = deviceData.user_code;
      verifyBtn.disabled = false;

      // Auto-copy to clipboard
      if (navigator.clipboard && deviceData.user_code) {
        navigator.clipboard.writeText(deviceData.user_code).catch(() => {});
      }

      statusText.textContent = 'Code copied! Click "Open GitHub Activation" to authorize:';

      const verifyUrl =
        deviceData.verification_uri_complete ||
        (deviceData.verification_uri
          ? `${deviceData.verification_uri}?user_code=${encodeURIComponent(deviceData.user_code)}`
          : 'https://github.com/login/device');

      verifyBtn.onclick = () => {
        if (navigator.clipboard && deviceData.user_code) {
          navigator.clipboard.writeText(deviceData.user_code).catch(() => {});
        }
        window.open(verifyUrl, '_blank', 'noopener,noreferrer');
      };

      this.isPolling = true;
      let interval = Math.max(deviceData.interval || 5, 5) * 1000;
      const startTime = Date.now();
      const expiresIn = (deviceData.expires_in || 900) * 1000;

      const poll = async () => {
        if (!this.isPolling) return;
        if (Date.now() - startTime > expiresIn) {
          statusText.textContent = 'Device code expired. Please try again.';
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
        } catch {
          // Transient network error
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
      this.comments = { inline_comments: [], page_comments: [] };
      this.currentUser = null;
      this.activeTab = 'inline'; // 'inline' | 'page'
      this.pendingSelection = null;
      this.isDrawerOpen = false;
      this.isSaving = false;
      this.isLoading = true;
      this.editingCommentId = null;
      this.editingReplyId = null;
      this.activeTooltipEl = null;

      const [owner, repo] = (options.repo || '').split('/');
      this.repoOwner = owner;
      this.repoName = repo;
      this.commentsPath = getCommentsPath(options.file);

      this.init();
    }

    getAuthToken() {
      return localStorage.getItem(TOKEN_KEY) || null;
    }

    async fetchGitHubApi(url, fetchOpts = {}) {
      const token = this.getAuthToken();
      const headers = {
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(fetchOpts.headers || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }
      return fetch(url, { ...fetchOpts, headers });
    }

    async loadCommentsFromGit() {
      if (!this.repoOwner || !this.repoName) {
        this.comments = { inline_comments: [], page_comments: [] };
        this.isLoading = false;
        return;
      }

      this.isLoading = true;
      this.renderDrawer();

      try {
        const contentUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.commentsPath}?ref=${encodeURIComponent(ORPHAN_REF_NAME)}&t=${Date.now()}`;
        const res = await this.fetchGitHubApi(contentUrl);

        if (res.ok) {
          const data = await res.json();
          if (data && data.content) {
            const rawYaml = decodeBase64Utf8(data.content);
            const parsed = parseYamlComments(rawYaml);
            this.comments = {
              inline_comments: (parsed.inline_comments || []).map((c) => ({
                id: c.id,
                anchor_hash: c.anchor_hash || '',
                anchor_text: c.anchor_text || '',
                paragraph_index: c.paragraph_index || 0,
                heading_context: c.heading_context || '',
                body: c.body || '',
                created_at: c.created_at || new Date().toISOString(),
                author: c.author || 'Anonymous',
                resolved: !!c.resolved,
                orphaned: !!c.orphaned,
                reactions: c.reactions || [],
                replies: (c.replies || []).map((r) => ({
                  id: r.id,
                  body: r.body || '',
                  created_at: r.created_at || new Date().toISOString(),
                  author: r.author || 'Anonymous',
                  reactions: r.reactions || [],
                })),
              })),
              page_comments: (parsed.page_comments || []).map((c) => ({
                id: c.id,
                body: c.body || '',
                created_at: c.created_at || new Date().toISOString(),
                author: c.author || 'Anonymous',
                resolved: !!c.resolved,
                reactions: c.reactions || [],
                replies: (c.replies || []).map((r) => ({
                  id: r.id,
                  body: r.body || '',
                  created_at: r.created_at || new Date().toISOString(),
                  author: r.author || 'Anonymous',
                  reactions: r.reactions || [],
                })),
              })),
            };
          }
        }
      } catch (err) {
        console.warn('[md-comments] Error fetching comments from Git ref:', err);
      } finally {
        this.isLoading = false;
        this.renderDrawer();
        this.renderHighlights();
        this.updateFABCount();
      }
    }

    async commitCommentsToGit(action = 'update comments') {
      const token = this.getAuthToken();
      if (!token) {
        return new Promise((resolve) => {
          const modal = new AuthModal(this);
          modal.show(async (viewer) => {
            this.currentUser = viewer;
            this.renderDrawer();
            const res = await this.commitCommentsToGit(action);
            resolve(res);
          });
        });
      }

      if (!this.repoOwner || !this.repoName) {
        alert('Repository configuration is missing (data-repo).');
        return false;
      }

      this.isSaving = true;
      this.renderDrawer();

      try {
        const yamlString = stringifyYaml(this.comments);

        // 1. Get current commit of orphan ref
        const refUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs/md-comments/data`;
        const refRes = await this.fetchGitHubApi(refUrl);
        let currentCommitSha = null;
        if (refRes.ok) {
          const refData = await refRes.json();
          currentCommitSha = refData.object?.sha || null;
        }

        // 2. Create Tree
        const treeUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees`;
        const treeBody = {
          tree: [{ path: this.commentsPath, mode: '100644', type: 'blob', content: yamlString }],
        };
        if (currentCommitSha) {
          treeBody.base_tree = currentCommitSha;
        }
        const treeRes = await this.fetchGitHubApi(treeUrl, {
          method: 'POST',
          body: JSON.stringify(treeBody),
        });

        if (!treeRes.ok) {
          const errText = await treeRes.text().catch(() => '');
          throw new Error(`Git Tree creation failed: ${errText}`);
        }
        const treeData = await treeRes.json();

        // 3. Create Commit
        const commitUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/commits`;
        const commitBody = {
          message: `${action.charAt(0).toUpperCase() + action.slice(1)} via Markdown Comments Embed`,
          tree: treeData.sha,
        };
        if (currentCommitSha) {
          commitBody.parents = [currentCommitSha];
        }
        const commitRes = await this.fetchGitHubApi(commitUrl, {
          method: 'POST',
          body: JSON.stringify(commitBody),
        });

        if (!commitRes.ok) {
          const errText = await commitRes.text().catch(() => '');
          throw new Error(`Git Commit creation failed: ${errText}`);
        }
        const createdCommit = await commitRes.json();

        // 4. Update or Create Ref
        if (currentCommitSha) {
          const patchRefRes = await this.fetchGitHubApi(refUrl, {
            method: 'PATCH',
            body: JSON.stringify({ sha: createdCommit.sha, force: false }),
          });
          if (!patchRefRes.ok) throw new Error(`Ref update failed: HTTP ${patchRefRes.status}`);
        } else {
          const createRefUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs`;
          const createRefRes = await this.fetchGitHubApi(createRefUrl, {
            method: 'POST',
            body: JSON.stringify({ ref: ORPHAN_REF_NAME, sha: createdCommit.sha }),
          });
          if (!createRefRes.ok) throw new Error(`Ref creation failed: HTTP ${createRefRes.status}`);
        }

        return true;
      } catch (err) {
        console.error('[md-comments] Git Commit Error:', err);
        alert(`Failed to commit comments to Git: ${err.message || err}`);
        return false;
      } finally {
        this.isSaving = false;
        this.renderDrawer();
        this.renderHighlights();
        this.updateFABCount();
      }
    }

    async init() {
      this.injectDOMContainers();
      this.scanDocumentAnchors();
      this.bindSelectionListener();

      const storedToken = this.getAuthToken();
      if (storedToken) {
        this.currentUser = await fetchGitHubViewer(storedToken);
      }

      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          this.toggleDrawer();
        }
      });

      await this.loadCommentsFromGit();
    }

    injectDOMContainers() {
      // 1. Selection Bubble
      this.bubbleEl = document.createElement('button');
      this.bubbleEl.className = 'md-comments-selection-bubble';
      this.bubbleEl.style.display = 'none';
      this.bubbleEl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 5v2H5v2h2v2h2V9h2V7H9V5H7z"/>
        </svg>
        <span>Comment</span>
      `;
      document.body.appendChild(this.bubbleEl);

      this.bubbleEl.addEventListener('mousedown', (e) => e.preventDefault());
      this.bubbleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openComposerForSelection();
      });

      // 2. Floating Action Button (FAB)
      this.fabEl = document.createElement('button');
      this.fabEl.className = 'md-comments-fab-toggle';
      this.fabEl.title = 'Markdown Comments (Cmd/Ctrl+Shift+C)';
      this.fabEl.innerHTML = `
        <svg viewBox="0 0 512 512" width="28" height="28">
          <path fill="#24292f" stroke="#ffffff" stroke-width="20" stroke-linejoin="round" d="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z"/>
          <path fill="#ffffff" d="M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"/>
        </svg>
        <span class="badge-count" style="display: none;">0</span>
      `;
      this.fabEl.onclick = () => this.toggleDrawer();
      document.body.appendChild(this.fabEl);

      // 3. Comments Drawer Container (Exact GitHub Chrome extension layout)
      this.drawerEl = document.createElement('div');
      this.drawerEl.className = 'md-comments-drawer';
      this.drawerEl.innerHTML = `
        <div class="md-comments-drawer-header">
          <div class="md-comments-drawer-title">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Z"/>
            </svg>
            <span>Markdown Comments</span>
          </div>
          <div class="md-comments-header-actions">
            <div class="md-comments-user-badge"></div>
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

        <div class="md-comments-tab-panel active" id="panel-inline">
          <div class="new-inline-composer-wrapper" style="display: none;">
            <div style="font-size: 11px; margin-bottom: 6px; color: var(--text-secondary);">New comment on: <em class="anchor-text-preview" style="font-style: italic;"></em></div>
            <div class="new-inline-composer-container"></div>
          </div>
          <div class="md-comments-threads-list" id="inline-threads-list"></div>
        </div>

        <div class="md-comments-tab-panel" id="panel-page">
          <div class="md-comments-threads-list" id="page-threads-list"></div>
          <div class="page-composer">
            <textarea placeholder="${this.currentUser ? 'Write a page comment...' : 'Sign in to write a page comment...'}" class="page-textarea"></textarea>
            <div style="display: flex; justify-content: flex-end;">
              <button class="md-comments-btn-primary submit-page-btn">Send</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.drawerEl);

      this.drawerEl.querySelector('.md-comments-drawer-close').onclick = () => this.closeDrawer();

      // Tab switching
      this.drawerEl.querySelectorAll('.md-comments-tab-btn').forEach((btn) => {
        btn.onclick = () => {
          this.activeTab = btn.getAttribute('data-tab');
          this.drawerEl
            .querySelectorAll('.md-comments-tab-btn')
            .forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          const panelInline = this.drawerEl.querySelector('#panel-inline');
          const panelPage = this.drawerEl.querySelector('#panel-page');
          if (panelInline) panelInline.classList.toggle('active', this.activeTab === 'inline');
          if (panelPage) panelPage.classList.toggle('active', this.activeTab === 'page');

          this.renderDrawer();
        };
      });

      // Page Composer submit button
      this.drawerEl.querySelector('.submit-page-btn').onclick = async () => {
        const textarea = this.drawerEl.querySelector('.page-textarea');
        const body = textarea?.value.trim();
        if (!body) return;
        await this.submitPageComment(body, textarea);
      };
    }

    scanDocumentAnchors() {
      const container = document.querySelector(options.selector) || document.body;
      const targetNodes = container.querySelectorAll(
        'h1, h2, h3, h4, p, pre, code, blockquote, li'
      );
      targetNodes.forEach((node, idx) => {
        if (!node.getAttribute('data-md-anchor-id')) {
          const textExcerpt = (node.textContent || '')
            .trim()
            .slice(0, 24)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          node.setAttribute('data-md-anchor-id', `anchor-${idx}-${textExcerpt || 'node'}`);
        }
      });
    }

    findHeadingContext(el) {
      let curr = el;
      while (curr && curr !== document.body) {
        let prev = curr.previousElementSibling;
        while (prev) {
          if (/^H[1-6]$/i.test(prev.tagName)) {
            return prev.textContent.trim();
          }
          prev = prev.previousElementSibling;
        }
        curr = curr.parentElement;
      }
      return 'Top level';
    }

    bindSelectionListener() {
      const onSelectionChange = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          this.bubbleEl.style.display = 'none';
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          this.bubbleEl.style.display = 'none';
          return;
        }

        const range = sel.getRangeAt(0);
        let blockEl = range.commonAncestorContainer;
        if (blockEl.nodeType === Node.TEXT_NODE) {
          blockEl = blockEl.parentElement;
        }

        if (
          blockEl.closest(
            '.md-comments-drawer, .md-comments-selection-bubble, .md-comments-auth-modal, .md-comments-tooltip'
          )
        ) {
          this.bubbleEl.style.display = 'none';
          return;
        }

        const anchorParent = blockEl.closest('[data-md-anchor-id]');
        const anchorId = anchorParent ? anchorParent.getAttribute('data-md-anchor-id') : 'general';
        const heading = anchorParent ? this.findHeadingContext(anchorParent) : 'Top level';

        this.pendingSelection = {
          text: text,
          anchorId: anchorId,
          headingContext: heading,
          range: range.cloneRange(),
        };

        const rect = range.getBoundingClientRect();
        this.bubbleEl.style.top = `${window.scrollY + rect.top - 36}px`;
        this.bubbleEl.style.left = `${window.scrollX + rect.left + rect.width / 2 - 40}px`;
        this.bubbleEl.style.display = 'inline-flex';
      };

      document.addEventListener('mouseup', () => setTimeout(onSelectionChange, 10));
      document.addEventListener('selectionchange', onSelectionChange);
    }

    openComposerForSelection() {
      if (!this.pendingSelection) return;
      this.bubbleEl.style.display = 'none';
      this.activeTab = 'inline';
      this.drawerEl
        .querySelectorAll('.md-comments-tab-btn')
        .forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'inline'));
      const panelInline = this.drawerEl.querySelector('#panel-inline');
      const panelPage = this.drawerEl.querySelector('#panel-page');
      if (panelInline) panelInline.classList.add('active');
      if (panelPage) panelPage.classList.remove('active');

      this.openDrawer();

      const composerWrapper = this.drawerEl.querySelector('.new-inline-composer-wrapper');
      const container = this.drawerEl.querySelector('.new-inline-composer-container');
      const preview = this.drawerEl.querySelector('.anchor-text-preview');
      if (!composerWrapper || !container) return;

      composerWrapper.style.display = 'block';
      if (preview) {
        preview.textContent =
          this.pendingSelection.text.length > 60
            ? this.pendingSelection.text.slice(0, 60) + '...'
            : this.pendingSelection.text;
      }

      container.innerHTML = `
        <textarea placeholder="${this.currentUser ? 'Write a comment (commits to Git)...' : 'Sign in with GitHub to commit comment...'}" class="new-inline-textarea"></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
          <button class="md-comments-btn-secondary cancel-new-btn">Cancel</button>
          <button class="md-comments-btn-primary submit-new-btn">Comment</button>
        </div>
      `;

      const textarea = container.querySelector('textarea');
      textarea?.focus();

      container.querySelector('.cancel-new-btn').onclick = () => {
        composerWrapper.style.display = 'none';
        container.innerHTML = '';
        this.pendingSelection = null;
      };

      container.querySelector('.submit-new-btn').onclick = async () => {
        const body = textarea?.value.trim();
        if (!body) return;

        if (!this.currentUser) {
          const modal = new AuthModal(this);
          modal.show(async (viewer) => {
            this.currentUser = viewer;
            this.renderDrawer();
            await this.submitInlineComment(body, composerWrapper, container);
          });
          return;
        }

        await this.submitInlineComment(body, composerWrapper, container);
      };
    }

    async submitInlineComment(body, composerWrapper, container) {
      if (!this.currentUser) return;
      const newComment = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        anchor_hash: this.pendingSelection ? this.pendingSelection.anchorId : 'general',
        anchor_text: this.pendingSelection ? this.pendingSelection.text : '',
        paragraph_index: 0,
        heading_context: this.pendingSelection ? this.pendingSelection.headingContext : 'Top level',
        body: body,
        created_at: new Date().toISOString(),
        author: this.currentUser.login,
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      };

      this.comments.inline_comments.unshift(newComment);
      this.pendingSelection = null;
      if (composerWrapper) composerWrapper.style.display = 'none';
      if (container) container.innerHTML = '';

      this.renderDrawer();
      this.renderHighlights();
      this.updateFABCount();

      await this.commitCommentsToGit('add inline comment');
    }

    async submitPageComment(body, textareaEl) {
      if (!this.currentUser) {
        const modal = new AuthModal(this);
        modal.show(async (viewer) => {
          this.currentUser = viewer;
          this.renderDrawer();
          await this.submitPageComment(body, textareaEl);
        });
        return;
      }

      const newPageComment = {
        id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        body: body,
        created_at: new Date().toISOString(),
        author: this.currentUser.login,
        resolved: false,
        reactions: [],
        replies: [],
      };

      this.comments.page_comments.unshift(newPageComment);
      if (textareaEl) textareaEl.value = '';

      this.renderDrawer();
      this.updateFABCount();

      await this.commitCommentsToGit('add page comment');
    }

    showCommentTooltip(targetEl, commentId) {
      this.hideCommentTooltip();
      const comment = (this.comments.inline_comments || []).find((c) => c.id === commentId);
      if (!comment) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'md-comments-tooltip';
      const displayName = resolveDisplayName(comment.author);

      tooltip.innerHTML = `
        <div class="tooltip-header">
          <img class="tooltip-avatar" src="https://github.com/${encodeURIComponent(comment.author)}.png?size=32" alt="${escapeHtml(comment.author)}" />
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

    hideCommentTooltip() {
      if (this.activeTooltipEl) {
        this.activeTooltipEl.remove();
        this.activeTooltipEl = null;
      }
    }

    renderHighlights() {
      const existingAnchors = document.querySelectorAll('.md-comments-text-anchor');
      existingAnchors.forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ''), el);
          parent.normalize();
        }
      });

      const openThreads = (this.comments.inline_comments || []).filter(
        (c) => !c.resolved && c.anchor_text
      );
      const container = document.querySelector(options.selector) || document.body;

      openThreads.forEach((th) => {
        const query = (th.anchor_text || '').trim();
        if (!query) return;

        let targetEl = th.anchor_hash
          ? document.querySelector(`[data-md-anchor-id="${th.anchor_hash}"]`)
          : null;
        if (!targetEl) targetEl = container;

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
              anchorSpan.title = 'Click to view comment';

              range.surroundContents(anchorSpan);

              anchorSpan.addEventListener('mouseenter', () => {
                this.showCommentTooltip(anchorSpan, th.id);
              });
              anchorSpan.addEventListener('mouseleave', () => {
                this.hideCommentTooltip();
              });

              anchorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.activeTab = 'inline';
                this.drawerEl
                  .querySelectorAll('.md-comments-tab-btn')
                  .forEach((b) =>
                    b.classList.toggle('active', b.getAttribute('data-tab') === 'inline')
                  );
                const panelInline = this.drawerEl.querySelector('#panel-inline');
                const panelPage = this.drawerEl.querySelector('#panel-page');
                if (panelInline) panelInline.classList.add('active');
                if (panelPage) panelPage.classList.remove('active');

                this.openDrawer();
                this.highlightCard(th.id);
              });
            } catch {
              targetEl.classList.add('md-comments-text-anchor');
            }
            break;
          }
        }
      });
    }

    scrollToCommentAnchor(commentId) {
      const anchorEl = document.querySelector(
        `.md-comments-text-anchor[data-thread-id="${commentId}"]`
      );
      if (anchorEl) {
        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        anchorEl.classList.add('md-comments-highlight-flash');
        setTimeout(() => anchorEl.classList.remove('md-comments-highlight-flash'), 2100);
      }
    }

    updateFABCount() {
      const inlineOpen = (this.comments.inline_comments || []).filter((c) => !c.resolved).length;
      const pageOpen = (this.comments.page_comments || []).filter((c) => !c.resolved).length;
      const totalOpen = inlineOpen + pageOpen;

      const badge = this.fabEl.querySelector('.badge-count');
      if (totalOpen > 0) {
        badge.textContent = totalOpen;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      const inlineCountEl = this.drawerEl.querySelector('.inline-tab-count');
      const pageCountEl = this.drawerEl.querySelector('.page-tab-count');
      if (inlineCountEl) inlineCountEl.textContent = inlineOpen;
      if (pageCountEl) pageCountEl.textContent = pageOpen;
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
      if (this.fabEl) this.fabEl.style.display = 'none';
      this.renderDrawer();
    }

    closeDrawer() {
      this.isDrawerOpen = false;
      this.drawerEl.classList.remove('md-comments-drawer-open');
      document.documentElement.classList.remove('md-comments-panel-open');
      if (this.fabEl) this.fabEl.style.display = 'flex';
      this.hideCommentTooltip();
    }

    highlightCard(threadId) {
      setTimeout(() => {
        const card = this.drawerEl.querySelector(`[data-id="${threadId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('highlighted');
          setTimeout(() => card.classList.remove('highlighted'), 2000);
        }
      }, 100);
    }

    renderCommentCard(comment, type) {
      const isInline = type === 'inline';
      const isAuthor =
        comment.author &&
        this.currentUser &&
        comment.author.trim().toLowerCase() === this.currentUser.login.trim().toLowerCase();

      let headerContextHtml = '';
      if (isInline) {
        headerContextHtml = `
          <div class="md-comments-context-row">
            <span class="md-comments-context-heading">${escapeHtml(comment.heading_context || 'Top level')}</span>
            ${comment.orphaned ? `<span class="md-comments-badge orphan">Orphaned</span>` : ''}
            ${comment.resolved ? `<span class="md-comments-badge resolved">Resolved</span>` : ''}
          </div>
          ${
            comment.anchor_text
              ? `<div class="md-comments-anchor-quote" title="${escapeHtml(comment.anchor_text)}">"${escapeHtml(comment.anchor_text)}"</div>`
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
            r.author &&
            this.currentUser &&
            r.author.trim().toLowerCase() === this.currentUser.login.trim().toLowerCase();
          const isEditingReply = this.editingReplyId === r.id;

          return `
            <div class="reply-item" data-reply-id="${r.id}">
              <img class="md-comments-avatar" src="https://github.com/${encodeURIComponent(r.author)}.png?size=32" alt="${escapeHtml(r.author)}" />
              <div class="reply-content">
                <div class="reply-header">
                  <div>
                    ${renderAuthor(r.author, () => this.renderDrawer())}
                    <span class="md-comments-time">${formatRelativeTime(r.created_at)}</span>
                  </div>
                  ${
                    this.currentUser && isReplyAuthor
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
              <img class="md-comments-avatar" src="https://github.com/${encodeURIComponent(comment.author)}.png?size=40" alt="${escapeHtml(comment.author)}" />
              <div class="md-comments-author-meta">
                ${renderAuthor(comment.author, () => this.renderDrawer())}
                <span class="md-comments-time">${formatRelativeTime(comment.created_at)}</span>
              </div>
            </div>
            <div class="md-comments-card-actions">
              ${
                this.currentUser
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
                    this.currentUser && (r.users || []).includes(this.currentUser.login);
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
            this.currentUser && !comment.resolved
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

    renderDrawer() {
      // 1. User Badge
      const userBadge = this.drawerEl.querySelector('.md-comments-user-badge');
      if (userBadge) {
        if (this.currentUser) {
          userBadge.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
              <img class="md-comments-avatar" style="width: 22px; height: 22px; border-radius: 50%;" src="${this.currentUser.avatar_url}" alt="${this.currentUser.login}" />
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

      this.updateFABCount();

      // 2. Render Inline list
      const inlineListEl = this.drawerEl.querySelector('#inline-threads-list');
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

      // 3. Render Page list
      const pageListEl = this.drawerEl.querySelector('#page-threads-list');
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

    bindCardEvents(container) {
      // Card click anchor jump
      container.querySelectorAll('.md-comments-card').forEach((card) => {
        const id = card.getAttribute('data-id');
        const type = card.getAttribute('data-type');
        if (type === 'inline') {
          card.onclick = (e) => {
            if (e.target.closest('button, textarea, input, a')) return;
            this.scrollToCommentAnchor(id);
          };
        }
      });

      // Emoji picker popover toggle
      container.querySelectorAll('.emoji-picker-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const popover = btn.nextElementSibling;
          if (popover) {
            popover.style.display = popover.style.display === 'none' ? 'flex' : 'none';
          }
        };
      });

      // Close emoji popovers on click outside
      document.addEventListener(
        'click',
        () => {
          container.querySelectorAll('.emoji-popover').forEach((p) => (p.style.display = 'none'));
        },
        { once: true }
      );

      // Emoji option click
      container.querySelectorAll('.emoji-opt-btn, .reaction-chip').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const type = btn.getAttribute('data-type');
          const emoji = btn.getAttribute('data-emoji');
          await this.toggleReaction(id, type, emoji);
        };
      });

      // Resolve toggle
      container.querySelectorAll('.resolve-btn').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const type = btn.getAttribute('data-type');
          const resolved = btn.getAttribute('data-resolved') === 'true';
          await this.toggleResolve(id, type, !resolved);
        };
      });

      // Delete comment
      container.querySelectorAll('.delete-comment-btn').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const type = btn.getAttribute('data-type');
          if (confirm('Delete this comment permanently from Git?')) {
            await this.deleteComment(id, type);
          }
        };
      });

      // Edit comment mode
      container.querySelectorAll('.edit-comment-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.editingCommentId = btn.getAttribute('data-id');
          this.renderDrawer();
        };
      });

      container.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.editingCommentId = null;
          this.renderDrawer();
        };
      });

      container.querySelectorAll('.save-edit-btn').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const type = btn.getAttribute('data-type');
          const card = btn.closest('.md-comments-card');
          const textarea = card.querySelector('.edit-comment-textarea');
          if (textarea && textarea.value.trim()) {
            await this.saveEditComment(id, type, textarea.value.trim());
          }
        };
      });

      // Edit reply mode
      container.querySelectorAll('.edit-reply-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.editingReplyId = btn.getAttribute('data-reply-id');
          this.renderDrawer();
        };
      });

      container.querySelectorAll('.cancel-edit-reply-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.editingReplyId = null;
          this.renderDrawer();
        };
      });

      container.querySelectorAll('.save-edit-reply-btn').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const commentId = btn.getAttribute('data-comment-id');
          const replyId = btn.getAttribute('data-reply-id');
          const replyEl = btn.closest('.reply-item');
          const textarea = replyEl.querySelector('.edit-reply-textarea');
          if (textarea && textarea.value.trim()) {
            await this.saveEditReply(commentId, replyId, textarea.value.trim());
          }
        };
      });

      // Delete reply
      container.querySelectorAll('.delete-reply-btn').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const commentId = btn.getAttribute('data-comment-id');
          const replyId = btn.getAttribute('data-reply-id');
          if (confirm('Delete this reply?')) {
            await this.deleteReply(commentId, replyId);
          }
        };
      });

      // Reply input expanding
      container.querySelectorAll('.reply-input').forEach((input) => {
        input.onfocus = () => {
          const expanded = input.nextElementSibling;
          if (expanded) {
            input.style.display = 'none';
            expanded.style.display = 'flex';
            const ta = expanded.querySelector('textarea');
            if (ta) ta.focus();
          }
        };
      });

      container.querySelectorAll('.cancel-reply-btn').forEach((btn) => {
        btn.onclick = () => {
          const expanded = btn.closest('.reply-expanded');
          const input = expanded.previousElementSibling;
          if (expanded && input) {
            expanded.style.display = 'none';
            input.style.display = 'block';
          }
        };
      });

      container.querySelectorAll('.send-reply-btn').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const type = btn.getAttribute('data-type');
          const expanded = btn.closest('.reply-expanded');
          const textarea = expanded.querySelector('textarea');
          if (textarea && textarea.value.trim()) {
            await this.submitReply(id, type, textarea.value.trim());
          }
        };
      });
    }

    async toggleReaction(commentId, type, emoji) {
      if (!this.currentUser) return;
      const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
      const comment = list.find((c) => c.id === commentId);
      if (!comment) return;

      if (!comment.reactions) comment.reactions = [];
      const user = this.currentUser.login;
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

      this.renderDrawer();
      await this.commitCommentsToGit('toggle reaction');
    }

    async toggleResolve(commentId, type, resolved) {
      const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        comment.resolved = resolved;
        comment.resolved_at = resolved ? new Date().toISOString() : undefined;
        this.renderDrawer();
        this.renderHighlights();
        this.updateFABCount();
        await this.commitCommentsToGit(resolved ? 'resolve thread' : 'reopen thread');
      }
    }

    async deleteComment(commentId, type) {
      if (type === 'inline') {
        this.comments.inline_comments = this.comments.inline_comments.filter(
          (c) => c.id !== commentId
        );
      } else {
        this.comments.page_comments = this.comments.page_comments.filter((c) => c.id !== commentId);
      }
      this.renderDrawer();
      this.renderHighlights();
      this.updateFABCount();
      await this.commitCommentsToGit('delete comment');
    }

    async saveEditComment(commentId, type, newBody) {
      const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        comment.body = newBody;
        comment.updated_at = new Date().toISOString();
        this.editingCommentId = null;
        this.renderDrawer();
        await this.commitCommentsToGit('edit comment');
      }
    }

    async submitReply(commentId, type, replyBody) {
      if (!this.currentUser) return;
      const list = type === 'inline' ? this.comments.inline_comments : this.comments.page_comments;
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        if (!comment.replies) comment.replies = [];
        comment.replies.push({
          id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          body: replyBody,
          created_at: new Date().toISOString(),
          author: this.currentUser.login,
          reactions: [],
        });
        this.renderDrawer();
        await this.commitCommentsToGit('add reply');
      }
    }

    async saveEditReply(commentId, replyId, newBody) {
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
          this.renderDrawer();
          await this.commitCommentsToGit('edit reply');
        }
      }
    }

    async deleteReply(commentId, replyId) {
      const allComments = [
        ...(this.comments.inline_comments || []),
        ...(this.comments.page_comments || []),
      ];
      const comment = allComments.find((c) => c.id === commentId);
      if (comment && comment.replies) {
        comment.replies = comment.replies.filter((r) => r.id !== replyId);
        this.renderDrawer();
        await this.commitCommentsToGit('delete reply');
      }
    }
  }

  // Mount when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CommentsApp());
  } else {
    new CommentsApp();
  }
})();
