# GitHub Extension Authentication: Zero PAT Invariant (INV-NO-PAT)

## Strict Prohibition: Never Consider or Add PAT Authentication

When working on or discussing the GitHub browser extension (`chrome-extension`, Chrome/Firefox/Safari/Edge builds), **NEVER EVER consider, suggest, design, or implement Personal Access Token (PAT) authentication**.

### Absolute Rules

1. **No PAT Code or UI**:
   - Never introduce PAT input boxes, forms, token submission fields, or settings inputs.
   - Never add instructions telling users to visit `github.com/settings/tokens` to generate classic or fine-grained tokens.
   - Remove/deprecate any legacy references to PAT auth if encountered.

2. **No PAT Fallbacks**:
   - If an API call fails with HTTP 401, 403, or token expiration, **NEVER** fall back to or prompt the user for a PAT.
   - The ONLY allowed recovery flows are:
     - Re-triggering the **OAuth Device Flow** (`startOAuthDeviceFlow`).
     - Refreshing the OAuth token (`refreshAccessToken`).
     - Prompting the user to click "Authorize with GitHub" to restart the device flow.

3. **No PAT In Plans, Architecture, or RFCs**:
   - Plans under `.plans/` or architecture proposals must strictly enforce the `INV-NO-PAT` invariant.
   - Any proposal or step that mentions PAT as an authentication option for the GitHub extension must be rejected.

4. **No PAT In Automated Tests**:
   - Tests (Playwright E2E, integration, unit) must **never** simulate PAT entry or assert on PAT UI.
   - Test fixtures must inject mock OAuth tokens directly into `chrome.storage.local` (`oauthToken`, `refreshToken`) or mock the OAuth Device Flow HTTP responses.

### Approved Authentication Mechanism

The GitHub extension exclusively uses **Frictionless OAuth Device Flow** (via the registered GitHub App) with zero copy-pasting of tokens:

- Flow: Extension requests a user/device code -> opens `github.com/login/device` -> user approves in browser -> extension receives and stores OAuth token.
- Refresh: Automatic token refresh via background service worker.
