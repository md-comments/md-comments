/**
 * Markdown Comments - Standalone Redistributable Embed Runtime
 * Enables zero-dependency inline collaborative commenting on any static HTML page.
 * Real Git Backend: Commits comments directly to GitHub orphan ref refs/md-comments/data.
 */

(function () {
  'use strict';

  const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';
  const TOKEN_KEY = 'md_comments_oauth_token';
  const ORPHAN_REF_NAME = 'refs/md-comments/data';

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
              Authorize Markdown Comments to commit discussions directly to Git:
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
          codeUrl: 'https://proxy.cors.sh/https://github.com/login/device/code',
          pollUrl: 'https://proxy.cors.sh/https://github.com/login/oauth/access_token',
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
          /* try next candidate */
        }
      }

      if (!deviceData) {
        codeEl.textContent = 'ERROR';
        statusText.innerHTML =
          'Unable to initiate GitHub OAuth Device Flow.<br>Please check your internet connection.';
        if (spinner) spinner.style.display = 'none';
        return;
      }

      codeEl.textContent = deviceData.user_code;
      verifyBtn.disabled = false;
      verifyBtn.textContent = `Open GitHub (${deviceData.user_code})`;
      statusText.textContent = 'Code copied! Waiting for authorization on GitHub...';

      const verifyUrl =
        deviceData.verification_uri_complete ||
        (deviceData.verification_uri
          ? `${deviceData.verification_uri}?user_code=${encodeURIComponent(deviceData.user_code)}`
          : 'https://github.com/login/device');

      if (navigator.clipboard && deviceData.user_code) {
        navigator.clipboard.writeText(deviceData.user_code).catch(() => {});
      }

      try {
        window.open(verifyUrl, '_blank');
      } catch {
        /* popup blocked */
      }

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
        } catch (e) {
          /* transient network issue during poll */
        }

        if (this.isPolling) {
          setTimeout(poll, interval);
        }
      };

      setTimeout(poll, interval);
    }
  }

  // ==========================================
  // Main Comments Application (Real Git Backend)
  // ==========================================
  class CommentsApp {
    constructor() {
      this.comments = [];
      this.currentUser = null;
      this.activeThreadId = null;
      this.pendingSelection = null;
      this.isDrawerOpen = false;
      this.isSaving = false;
      this.isLoading = true;

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

    /**
     * Reads comments from GitHub orphan ref refs/md-comments/data
     */
    async loadCommentsFromGit() {
      if (!this.repoOwner || !this.repoName) {
        this.comments = [];
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
            const inlines = parsed.inline_comments || [];

            this.comments = inlines.map((c) => ({
              id: c.id,
              anchorId: c.anchor_hash || '',
              selectedText: c.anchor_text || '',
              textPrefix: c.heading_context || '',
              status: c.resolved ? 'resolved' : 'open',
              createdAt: c.created_at || new Date().toISOString(),
              author: {
                login: c.author_login || c.author || 'Anonymous',
                name: c.author || c.author_login || 'Anonymous',
                avatar_url:
                  c.author_avatar || `https://github.com/${c.author_login || 'ghost'}.png`,
              },
              body: c.body || '',
              replies: (c.replies || []).map((r) => ({
                id: r.id,
                createdAt: r.created_at || new Date().toISOString(),
                author: {
                  login: r.author_login || r.author || 'Anonymous',
                  name: r.author || r.author_login || 'Anonymous',
                  avatar_url:
                    r.author_avatar || `https://github.com/${r.author_login || 'ghost'}.png`,
                },
                body: r.body || '',
              })),
            }));
          }
        } else if (res.status === 404) {
          // Check unhashed legacy path
          const cleanFile = (options.file || 'index.html')
            .replace(/^\//, '')
            .replace(/\.html?$/i, '');
          const legacyPath = `${cleanFile}.comments.yml`;
          const legacyUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${legacyPath}?ref=${encodeURIComponent(ORPHAN_REF_NAME)}&t=${Date.now()}`;
          const legRes = await this.fetchGitHubApi(legacyUrl);
          if (legRes.ok) {
            const legData = await legRes.json();
            if (legData && legData.content) {
              const rawYaml = decodeBase64Utf8(legData.content);
              const parsed = parseYamlComments(rawYaml);
              this.comments = (parsed.inline_comments || []).map((c) => ({
                id: c.id,
                anchorId: c.anchor_hash || '',
                selectedText: c.anchor_text || '',
                textPrefix: c.heading_context || '',
                status: c.resolved ? 'resolved' : 'open',
                createdAt: c.created_at || new Date().toISOString(),
                author: {
                  login: c.author_login || c.author || 'Anonymous',
                  name: c.author || c.author_login || 'Anonymous',
                  avatar_url:
                    c.author_avatar || `https://github.com/${c.author_login || 'ghost'}.png`,
                },
                body: c.body || '',
                replies: (c.replies || []).map((r) => ({
                  id: r.id,
                  createdAt: r.created_at || new Date().toISOString(),
                  author: {
                    login: r.author_login || r.author || 'Anonymous',
                    name: r.author || r.author_login || 'Anonymous',
                    avatar_url:
                      r.author_avatar || `https://github.com/${r.author_login || 'ghost'}.png`,
                  },
                  body: r.body || '',
                })),
              }));
            }
          } else {
            this.comments = [];
          }
        }
      } catch (err) {
        console.warn('[md-comments] Error fetching comments from GitHub Git ref:', err);
        this.comments = [];
      } finally {
        this.isLoading = false;
        this.renderDrawer();
        this.renderHighlights();
        this.updateFABCount();
      }
    }

    /**
     * Commits comments directly to GitHub orphan ref refs/md-comments/data
     */
    async commitCommentsToGit() {
      const token = this.getAuthToken();
      if (!token) {
        return new Promise((resolve) => {
          const modal = new AuthModal(this);
          modal.show(async (viewer) => {
            this.currentUser = viewer;
            this.renderDrawer();
            const res = await this.commitCommentsToGit();
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
        // Convert to standard CommentsFile format
        const commentsFile = {
          inline_comments: this.comments.map((c) => ({
            id: c.id,
            anchor_hash: c.anchorId || '',
            anchor_text: c.selectedText || '',
            paragraph_index: 0,
            heading_context: c.textPrefix || '',
            body: c.body || '',
            created_at: c.createdAt || new Date().toISOString(),
            author: c.author.name || c.author.login || 'GitHub User',
            author_avatar: c.author.avatar_url || '',
            author_login: c.author.login || '',
            orphaned: false,
            resolved: c.status === 'resolved',
            reactions: [],
            replies: (c.replies || []).map((r) => ({
              id: r.id,
              body: r.body || '',
              created_at: r.createdAt || new Date().toISOString(),
              author: r.author.name || r.author.login || 'GitHub User',
              author_avatar: r.author.avatar_url || '',
              author_login: r.author.login || '',
              reactions: [],
            })),
          })),
          page_comments: [],
        };

        const yamlString = stringifyYaml(commentsFile);

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
          throw new Error(
            `Git Tree creation failed (${treeRes.status}). Verify user permissions on repository ${options.repo}. ${errText}`
          );
        }
        const treeData = await treeRes.json();

        // 3. Create Commit
        const commitUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/commits`;
        const commitBody = {
          message: `Update comments for ${options.file}`,
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
          throw new Error(`Git Commit creation failed (${commitRes.status}): ${errText}`);
        }
        const createdCommit = await commitRes.json();

        // 4. Update or Create Ref
        if (currentCommitSha) {
          const patchRefRes = await this.fetchGitHubApi(refUrl, {
            method: 'PATCH',
            body: JSON.stringify({ sha: createdCommit.sha, force: false }),
          });
          if (!patchRefRes.ok) {
            throw new Error(`Ref update failed: HTTP ${patchRefRes.status}`);
          }
        } else {
          const createRefUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs`;
          const createRefRes = await this.fetchGitHubApi(createRefUrl, {
            method: 'POST',
            body: JSON.stringify({ ref: ORPHAN_REF_NAME, sha: createdCommit.sha }),
          });
          if (!createRefRes.ok) {
            throw new Error(`Ref creation failed: HTTP ${createRefRes.status}`);
          }
        }

        return true;
      } catch (err) {
        console.error('[md-comments] Git Commit Error:', err);
        alert(
          `Failed to commit comments to Git: ${err.message || err}\n\nMake sure your GitHub account has write access to ${options.repo}.`
        );
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

      // Check stored token
      const storedToken = this.getAuthToken();
      if (storedToken) {
        this.currentUser = await fetchGitHubViewer(storedToken);
      }

      // Global shortcut Cmd/Ctrl + Shift + C
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          this.toggleDrawer();
        }
      });

      // Load real comments from Git ref
      await this.loadCommentsFromGit();
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

      // 3. Comments Drawer Container
      this.drawerEl = document.createElement('div');
      this.drawerEl.className = 'md-comments-drawer';
      this.drawerEl.innerHTML = `
        <div class="md-comments-drawer-header">
          <div class="md-comments-header-title">
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

        <div class="md-comments-drawer-content"></div>
      `;
      document.body.appendChild(this.drawerEl);

      this.drawerEl.querySelector('.md-comments-drawer-close').onclick = () => this.closeDrawer();
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
            '.md-comments-drawer, .md-comments-selection-bubble, .md-comments-auth-modal'
          )
        ) {
          this.bubbleEl.style.display = 'none';
          return;
        }

        const anchorParent = blockEl.closest('[data-md-anchor-id]');
        const anchorId = anchorParent ? anchorParent.getAttribute('data-md-anchor-id') : 'general';
        const textPrefix = anchorParent ? anchorParent.textContent.trim().slice(0, 40) : '';

        this.pendingSelection = {
          text: text,
          anchorId: anchorId,
          textPrefix: textPrefix,
          range: range.cloneRange(),
        };

        const rect = range.getBoundingClientRect();
        this.bubbleEl.style.top = `${window.scrollY + rect.top - 38}px`;
        this.bubbleEl.style.left = `${window.scrollX + rect.left + rect.width / 2 - 40}px`;
        this.bubbleEl.style.display = 'inline-flex';
      };

      document.addEventListener('mouseup', () => setTimeout(onSelectionChange, 10));
      document.addEventListener('selectionchange', onSelectionChange);
    }

    openComposerForSelection() {
      if (!this.pendingSelection) return;
      this.bubbleEl.style.display = 'none';
      this.openDrawer();

      const content = this.drawerEl.querySelector('.md-comments-drawer-content');
      const composer = document.createElement('div');
      composer.className = 'md-comments-thread-card new-composer';
      composer.innerHTML = `
        <div class="md-comments-thread-anchor">"${this.escapeHTML(this.pendingSelection.text)}"</div>
        <textarea placeholder="${this.currentUser ? 'Write a comment (commits to Git ref)...' : 'Sign in with GitHub to commit comment...'}" style="width: 100%; min-height: 70px; padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--md-comments-border); background: var(--md-comments-bg); color: var(--md-comments-text); box-sizing: border-box; resize: vertical;"></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
          <button class="md-comments-btn-sm cancel-new-btn">Cancel</button>
          <button class="md-comments-btn-primary submit-new-btn" style="font-size: 12px; padding: 6px 12px;">Commit Comment</button>
        </div>
      `;

      content.prepend(composer);
      const textarea = composer.querySelector('textarea');
      textarea.focus();

      composer.querySelector('.cancel-new-btn').onclick = () => {
        composer.remove();
        this.pendingSelection = null;
      };

      composer.querySelector('.submit-new-btn').onclick = async () => {
        const body = textarea.value.trim();
        if (!body) return;

        if (!this.currentUser) {
          const modal = new AuthModal(this);
          modal.show(async (viewer) => {
            this.currentUser = viewer;
            this.renderDrawer();
            await this.submitComment(body, composer);
          });
          return;
        }

        await this.submitComment(body, composer);
      };
    }

    async submitComment(body, composerEl) {
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
      this.pendingSelection = null;
      if (composerEl) composerEl.remove();

      this.renderDrawer();
      this.renderHighlights();
      this.updateFABCount();

      await this.commitCommentsToGit();
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

      const openThreads = this.comments.filter((c) => c.status === 'open' && c.selectedText);
      const container = document.querySelector(options.selector) || document.body;

      openThreads.forEach((th) => {
        const query = (th.selectedText || '').trim();
        if (!query) return;

        let targetEl = th.anchorId
          ? document.querySelector(`[data-md-anchor-id="${th.anchorId}"]`)
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
              anchorSpan.title = 'Click to view comment thread';

              range.surroundContents(anchorSpan);

              anchorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.activeThreadId = th.id;
                this.openDrawer();
                this.highlightThread(th.id);
              });
            } catch (e) {
              targetEl.classList.add('md-comments-text-anchor');
            }
            break;
          }
        }
      });
    }

    updateFABCount() {
      const openCount = this.comments.filter((c) => c.status === 'open').length;

      const badge = this.fabEl.querySelector('.badge-count');
      if (openCount > 0) {
        badge.textContent = openCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
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
      if (this.isLoading) {
        content.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--md-comments-text-muted);">
            <div class="md-comments-spinner" style="display: inline-block; width: 24px; height: 24px; margin-bottom: 12px;"></div>
            <p style="font-size: 13px;">Loading comments...</p>
          </div>
        `;
        return;
      }

      const filtered = this.comments.filter((c) => c.status !== 'resolved');

      if (filtered.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--md-comments-text-muted);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.6;">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p style="font-size: 14px; font-weight: 500; margin-bottom: 6px;">No comments yet</p>
            <p style="font-size: 12px;">Highlight any text on the page to leave a comment.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = filtered
        .map((th) => {
          const timeAgo = this.formatTimeAgo(th.createdAt);
          return `
          <div class="md-comments-thread-card" data-thread-id="${th.id}">
            ${th.selectedText ? `<div class="md-comments-thread-anchor">"${this.escapeHTML(th.selectedText)}"</div>` : ''}
            <div class="md-comments-thread-header">
              <div class="md-comments-user-info">
                <img class="md-comments-avatar" src="${th.author.avatar_url}" alt="${th.author.login}" />
                <div>
                  <div class="md-comments-username">${this.escapeHTML(th.author.name || th.author.login)}</div>
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
                      <span class="md-comments-username" style="font-size: 12px;">${this.escapeHTML(rep.author.name || rep.author.login)}</span>
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
              <textarea placeholder="${this.currentUser ? 'Write a reply (commits to Git)...' : 'Sign in with GitHub to reply...'}" style="width: 100%; min-height: 50px; padding: 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--md-comments-border); background: var(--md-comments-bg); color: var(--md-comments-text); box-sizing: border-box;"></textarea>
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
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const thread = this.comments.find((t) => t.id === id);
          if (thread) {
            thread.status = thread.status === 'resolved' ? 'open' : 'resolved';
            this.renderDrawer();
            this.renderHighlights();
            this.updateFABCount();
            await this.commitCommentsToGit();
          }
        });
      });

      content.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Delete this comment thread permanently from Git?')) {
            this.comments = this.comments.filter((t) => t.id !== id);
            this.renderDrawer();
            this.renderHighlights();
            this.updateFABCount();
            await this.commitCommentsToGit();
          }
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
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const box = document.getElementById(`reply-box-${id}`);
          const text = box.querySelector('textarea').value.trim();
          if (!text) return;

          if (!this.currentUser) {
            const modal = new AuthModal(this);
            modal.show(async (viewer) => {
              this.currentUser = viewer;
              this.renderDrawer();
              await this.postReply(id, text);
            });
            return;
          }

          await this.postReply(id, text);
        });
      });
    }

    async postReply(threadId, text) {
      const thread = this.comments.find((t) => t.id === threadId);
      if (thread) {
        if (!thread.replies) thread.replies = [];
        thread.replies.push({
          id: `reply-${Date.now()}`,
          createdAt: new Date().toISOString(),
          author: this.currentUser,
          body: text,
        });
        this.renderDrawer();
        this.updateFABCount();
        await this.commitCommentsToGit();
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
