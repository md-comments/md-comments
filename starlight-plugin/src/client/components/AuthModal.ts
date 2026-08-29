import { requestDeviceCode, pollForAccessToken, DEFAULT_CLIENT_ID } from '../githubAuth.js';
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
          <div class="md-comments-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>Sign in with GitHub</span>
          </div>
          <button class="md-comments-modal-close" aria-label="Close">&times;</button>
        </div>

        <div class="md-comments-auth-panel">
          <p class="md-comments-modal-desc">
            Authorize Markdown Comments using GitHub Device Flow to leave comments:
          </p>
          <div class="md-comments-code-container">
            <span class="md-comments-code-label">One-Time Activation Code</span>
            <div class="md-comments-user-code">Loading...</div>
          </div>
          <button class="md-comments-btn-primary md-comments-btn-verify" style="width: 100%; justify-content: center; padding: 10px 16px; font-size: 13px; font-weight: 600;" disabled>
            Open GitHub Activation
          </button>
          <div class="md-comments-auth-status">
            <span class="md-comments-spinner"></span>
            <span class="md-comments-status-text">Requesting authorization code...</span>
          </div>
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

        if (statusText)
          statusText.textContent =
            'Code copied to clipboard! Click below to open GitHub and verify:';
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
