# Safari Web Extension User & Developer Guide

The **Markdown Comments Safari Web Extension** brings native, inline markdown collaboration to GitHub repositories and documentation previews directly inside Apple Safari on macOS — with zero commits, zero branches, and zero PR overhead.

---

## 1. Quick Installation (macOS)

1. Download the latest release: [`Markdown-Comments-macOS.dmg`](https://github.com/md-comments/md-comments/releases/latest/download/Markdown-Comments-macOS.dmg).
2. Open the `.dmg` and drag **Markdown Comments.app** into your `/Applications` folder (the DMG also includes `HOW TO OPEN.txt` with these instructions).
3. Launch **Markdown Comments** from `/Applications`.

> [!NOTE]
> **First Launch Gatekeeper Notice**: Because this open-source tool is self-signed without Apple's $99/year developer subscription, macOS may display _"cannot be opened because the developer cannot be verified"_.
> To open:
>
> - **Method A (Right-Click)**: Right-Click (Control-Click) the app in `/Applications` → select **Open** → click **Open**.
> - **Method B (macOS Sequoia Settings)**: If blocked, open **System Settings → Privacy & Security**, scroll to **Security**, and click **Open Anyway**.
> - **Method C (Terminal)**: Run:
>   ```bash
>   xattr -cr "/Applications/Markdown Comments.app"
>   ```

---

## 2. Enabling the Extension in Safari

Safari requires user permission before activating self-signed extensions:

1. **Step 1: Allow Unsigned Extensions**:
   - Open **Safari → Settings → Advanced** (or **Features for web developers**).
   - Check **"Show Develop menu in menu bar"**.
   - In the menu bar, open **Develop** and check **"Allow Unsigned Extensions"**. (Authenticate with your Mac password or Touch ID if prompted).
2. **Step 2: Enable Markdown Comments**:
   - Open **Safari → Settings → Extensions**.
   - Check the checkbox next to **Markdown Comments**.
3. **Step 3: One-Click Direct Load (Instant Alternative)**:
   - In Safari's menu bar: **Develop → Add Temporary Extension…** then select the extension folder (`PlugIns/Markdown Comments Extension.appex/Contents/Resources` or `chrome-extension/dist/safari`).
4. **Step 4: Grant GitHub Permissions**:
   - Navigate to any pull request or markdown file on `https://github.com`.
   - Click the **Markdown Comments** icon in the Safari toolbar / address bar and select **"Always Allow on This Website"** (or "Always Allow on Every Website").

---

## 3. Building From Source (Developers)

### Prerequisites

- macOS 12.0 or higher
- Xcode Command Line Tools (`xcode-select --install`)
- Node.js 20+ and pnpm (`npm install -g pnpm`)

### Build Commands

```bash
# Clone the repository
git clone https://github.com/md-comments/md-comments.git
cd md-comments

# Install dependencies
pnpm install

# Build the WebExtension assets and native macOS App bundle
./scripts/build-safari-app.sh

# Package into release .dmg
./scripts/package-dmg.sh
```

The compiled application bundle will be located at:
`safari-extension/build/Markdown Comments.app`

The release DMG will be located at:
`artifacts/Markdown-Comments-macOS.dmg`

---

## 4. Running Automated Tests

```bash
# Run Vitest unit tests for Safari APIs & Token storage
pnpm vitest run tests/browserApi.test.ts tests/safariAuth.test.ts

# Run Headless Playwright WebKit E2E tests
npx playwright test tests/e2e/safari-extension.spec.ts --project=webkit
```

---

## 5. Security Invariant (`INV-NO-PAT`)

The Safari extension strictly adheres to the **Zero Personal Access Token policy**:

- It **never** requests, prompts for, or persists GitHub Personal Access Tokens (PATs).
- All authentication lifecycles use the standard **OAuth Device Authorization Flow (RFC 8628)** via the official registered GitHub App (`Iv23li9t461keXDcVS0T`).
- All tokens are stored in private, sandboxed WebExtension storage (`browser.storage.local`).
