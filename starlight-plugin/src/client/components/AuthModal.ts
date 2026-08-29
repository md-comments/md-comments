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
          <h3>Sign in with GitHub</h3>
          <button class="md-comments-modal-close" aria-label="Close">&times;</button>
        </div>

        <div class="md-comments-auth-panel md-comments-panel-oauth">
          <p class="md-comments-modal-desc">
            Authorize Markdown Comments using GitHub's secure OAuth Device Flow:
          </p>
          <div class="md-comments-code-box">
            <span class="md-comments-code-label">One-Time Device Code:</span>
            <div class="md-comments-user-code">Loading...</div>
          </div>
          <button class="md-comments-btn-primary md-comments-btn-verify" style="width: 100%;" disabled>
            Open GitHub & Authorize
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
