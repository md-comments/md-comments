import {
  requestDeviceCode,
  pollForAccessToken,
  getViewer,
  saveOAuthToken,
  DEFAULT_CLIENT_ID,
} from '../githubAuth.js';
import type { MdCommentsPluginOptions } from '../../types.js';

export class AuthModal {
  private modalEl: HTMLElement | null = null;
  private isPolling = false;
  private clientId: string;
  private authProxyUrl?: string;

  constructor(options: MdCommentsPluginOptions | string = {}) {
    if (typeof options === 'string') {
      this.clientId = options || DEFAULT_CLIENT_ID;
    } else {
      this.clientId = options.clientId || DEFAULT_CLIENT_ID;
      this.authProxyUrl = options.authProxyUrl;
    }
  }

  public show(onSuccess: (token: string) => void): void {
    if (this.modalEl) return;

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'md-comments-auth-modal';
    this.modalEl.innerHTML = `
      <div class="md-comments-modal-backdrop"></div>
      <div class="md-comments-modal-card">
        <div class="md-comments-modal-header">
          <h3>Sign in to Markdown Comments</h3>
          <button class="md-comments-modal-close" aria-label="Close">&times;</button>
        </div>

        <div class="md-comments-auth-tabs">
          <button class="md-comments-auth-tab md-comments-tab-active" data-tab="oauth">OAuth Code</button>
          <button class="md-comments-auth-tab" data-tab="pat">Personal Token</button>
        </div>

        <div class="md-comments-auth-panel md-comments-panel-oauth">
          <p class="md-comments-modal-desc">
            Authorize Markdown Comments using GitHub OAuth Device Flow:
          </p>
          <div class="md-comments-code-box">
            <span class="md-comments-code-label">One-Time Code:</span>
            <div class="md-comments-user-code">Loading...</div>
          </div>
          <button class="md-comments-btn-primary md-comments-btn-verify" disabled>
            Open GitHub & Authorize
          </button>
          <div class="md-comments-auth-status">
            <span class="md-comments-spinner"></span>
            <span class="md-comments-status-text">Requesting authorization code...</span>
          </div>
          <div class="md-comments-oauth-fallback" style="display: none; margin-top: 12px; text-align: center;">
            <button class="md-comments-btn-link md-comments-switch-pat-btn">Sign in with Personal Access Token instead</button>
          </div>
        </div>

        <div class="md-comments-auth-panel md-comments-panel-pat" style="display: none;">
          <p class="md-comments-modal-desc">
            Sign in with a GitHub Personal Access Token (classic with <code>public_repo</code> / <code>repo</code> or fine-grained):
          </p>
          <div class="md-comments-pat-field" style="margin: 12px 0;">
            <input type="password" class="md-comments-input md-comments-pat-input" placeholder="ghp_... or github_pat_..." style="min-height: 36px; padding: 8px 10px;" />
          </div>
          <div style="margin-bottom: 12px; font-size: 11px;">
            <a href="https://github.com/settings/tokens/new?scopes=public_repo,repo&description=Markdown+Comments" target="_blank" rel="noopener noreferrer" style="color: var(--md-comments-primary); text-decoration: underline;">Create new GitHub token &rarr;</a>
          </div>
          <div class="md-comments-pat-actions" style="display: flex; gap: 8px;">
            <button class="md-comments-btn-primary md-comments-pat-submit-btn" style="flex: 1;">Save & Sign In</button>
          </div>
          <div class="md-comments-pat-status" style="margin-top: 8px; font-size: 12px; color: var(--md-comments-text-muted); display: none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    const closeBtn = this.modalEl.querySelector('.md-comments-modal-close');
    const backdrop = this.modalEl.querySelector('.md-comments-modal-backdrop');
    const verifyBtn = this.modalEl.querySelector<HTMLButtonElement>('.md-comments-btn-verify');
    const codeEl = this.modalEl.querySelector('.md-comments-user-code');
    const statusText = this.modalEl.querySelector('.md-comments-status-text');
    const spinner = this.modalEl.querySelector('.md-comments-spinner') as HTMLElement;
    const oauthFallback = this.modalEl.querySelector('.md-comments-oauth-fallback') as HTMLElement;
    const switchPatBtn = this.modalEl.querySelector('.md-comments-switch-pat-btn');

    const tabs = this.modalEl.querySelectorAll('.md-comments-auth-tab');
    const oauthPanel = this.modalEl.querySelector('.md-comments-panel-oauth') as HTMLElement;
    const patPanel = this.modalEl.querySelector('.md-comments-panel-pat') as HTMLElement;
    const patInput = this.modalEl.querySelector<HTMLInputElement>('.md-comments-pat-input');
    const patSubmitBtn = this.modalEl.querySelector<HTMLButtonElement>(
      '.md-comments-pat-submit-btn'
    );
    const patStatus = this.modalEl.querySelector('.md-comments-pat-status') as HTMLElement;

    const switchTab = (tabName: string) => {
      tabs.forEach((t) => {
        if (t.getAttribute('data-tab') === tabName) {
          t.classList.add('md-comments-tab-active');
        } else {
          t.classList.remove('md-comments-tab-active');
        }
      });
      if (tabName === 'oauth') {
        oauthPanel.style.display = 'block';
        patPanel.style.display = 'none';
      } else {
        oauthPanel.style.display = 'none';
        patPanel.style.display = 'block';
        patInput?.focus();
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const name = tab.getAttribute('data-tab') || 'oauth';
        switchTab(name);
      });
    });

    switchPatBtn?.addEventListener('click', () => switchTab('pat'));

    // PAT Submit Handler
    patSubmitBtn?.addEventListener('click', async () => {
      const val = (patInput?.value || '').trim();
      if (!val) {
        if (patStatus) {
          patStatus.style.display = 'block';
          patStatus.style.color = '#e5534b';
          patStatus.textContent = 'Please enter a GitHub token.';
        }
        return;
      }
      if (patStatus) {
        patStatus.style.display = 'block';
        patStatus.style.color = 'var(--md-comments-text-muted)';
        patStatus.textContent = 'Validating token with GitHub...';
      }
      patSubmitBtn.disabled = true;

      try {
        const viewer = await getViewer(val);
        if (!viewer) {
          throw new Error('Invalid token or GitHub API rate limit reached.');
        }
        saveOAuthToken(val);
        this.close();
        onSuccess(val);
      } catch (err: any) {
        patSubmitBtn.disabled = false;
        if (patStatus) {
          patStatus.style.display = 'block';
          patStatus.style.color = '#e5534b';
          patStatus.textContent = `Token validation failed: ${err?.message || err}`;
        }
      }
    });

    const handleClose = () => {
      this.close();
    };

    closeBtn?.addEventListener('click', handleClose);
    backdrop?.addEventListener('click', handleClose);

    // Start OAuth Device Flow
    this.isPolling = true;

    requestDeviceCode(this.clientId, this.authProxyUrl)
      .then(({ data, pollUrl }) => {
        if (!this.isPolling) return;
        if (codeEl) codeEl.textContent = data.user_code;

        // Auto copy code to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(data.user_code).catch(() => {});
        }

        const verificationUrl =
          data.verification_uri_complete ||
          (data.verification_uri.includes('?')
            ? `${data.verification_uri}&user_code=${encodeURIComponent(data.user_code)}`
            : `${data.verification_uri}?user_code=${encodeURIComponent(data.user_code)}`);

        // Auto open GitHub device authorization page with prefilled user_code
        try {
          window.open(verificationUrl, '_blank');
        } catch {
          /* browser blocked auto popup */
        }

        if (statusText)
          statusText.textContent = 'Code copied to clipboard! Waiting for GitHub approval...';
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = `Open GitHub (${data.user_code})`;
          verifyBtn.onclick = () => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(data.user_code).catch(() => {});
            }
            window.open(verificationUrl, '_blank');
          };
        }

        return pollForAccessToken(
          data.device_code,
          this.clientId,
          data.interval || 5,
          (status: string) => {
            if (!this.isPolling) return;
            if (statusText) {
              if (status === 'authorized') {
                statusText.textContent = 'Successfully authorized! Syncing comments...';
              } else if (status === 'slow_down') {
                statusText.textContent = 'Rate limited by GitHub, backing off polling interval...';
              } else if (status === 'pending') {
                statusText.textContent = 'Waiting for your approval on GitHub...';
              }
            }
          },
          pollUrl,
          () => !this.isPolling
        );
      })
      .then((token: string | undefined) => {
        if (!this.isPolling || !token) return;
        this.close();
        onSuccess(token);
      })
      .catch((err: Error | any) => {
        if (!this.isPolling) return;
        if (spinner) spinner.style.display = 'none';
        if (statusText) {
          statusText.textContent = `Authorization error: ${err?.message || err}`;
        }
        if (oauthFallback) {
          oauthFallback.style.display = 'block';
        }
      });
  }

  public close(): void {
    this.isPolling = false;
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
  }
}
