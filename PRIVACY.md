# Privacy Policy

**Last Updated:** September 7, 2026

Your privacy is extremely important to us. This Privacy Policy describes how the **Markdown Comments** suite of tools—including the **VS Code Extension**, **Obsidian Plugin**, **Chrome Extension**, and **Embeddable Web Component** (collectively, the "Software")—handles data and information.

---

## 1. Executive Summary

- **Local-First & Serverless:** The Software runs entirely client-side on your local machine, editor, or browser.
- **Not a PII Processor or Keeper:** Because data is stored directly in your own designated GitHub repository and we operate no backend servers or databases, Markdown Comments is neither a data processor nor a keeper/custodian of any direct or linkable Personally Identifiable Information (PII).
- **Public Demo Sites (24-Hour Maximum Retention):** For public interactive demo sites and sandboxes, any comments and associated public identifiers are retained for a maximum of 24 hours, as demo data is automatically wiped every 24 hours.
- **Anonymous Technical Diagnostics (Opt-Out Guaranteed):** To troubleshoot runtime bugs and improve client stability, optional non-identifiable technical error diagnostics (crash stacks, error types) may be relayed via a zero-secret Cloudflare Worker proxy to monitoring dashboards (Grafana Cloud). Document text, comment bodies, repo paths, user IDs, and tokens are scrubbed client-side and never transmitted. End users can unconditionally disable telemetry across all interfaces with instant buffer purging and zero network egress.
- **Direct GitHub Communication:** Primary application requests occur directly between your client and official GitHub endpoints (`https://api.github.com` and `https://raw.githubusercontent.com`).
- **Local Storage:** All settings, configurations, cached profiles, and authentication credentials are saved strictly on your local device.

---

## 2. Information Collection, Storage & PII Handling

### User Repositories & Tool Usage (No PII Processing or Keeping)

When using the Software with your own GitHub repositories:

- **Zero Central Storage:** All comments, replies, reactions, and metadata are written directly to your chosen GitHub repository (using dedicated git refs `refs/md-comments/data`).
- **PII Ownership & Custody:** Any direct PII (e.g., real names) or linkable PII (e.g., GitHub usernames, user IDs, avatar URLs) reside exclusively within your GitHub repository and your local client. Markdown Comments does not collect, retain, process, or act as a keeper or processor of this PII.

### Public Demo Environments (24-Hour Ephemeral Retention)

When interacting with our public demo sites and sandboxes:

- **Temporary 24-Hour Hosting:** Any comments, public GitHub usernames, or avatars submitted on public demo instances are hosted for a **maximum of 24 hours**.
- **Automated Daily Reset:** All demo repository comments and data are automatically and completely wiped every 24 hours (daily reset at 00:00 UTC) to ensure clean environments and prevent permanent data retention.

### VS Code Extension & Obsidian Plugin

- **Comment Data:** Stored directly in your target GitHub repository via the GitHub API.
- **Local Settings:** Settings such as preferred sidebar width, emoji lists, or your custom author name are stored locally using the host application's configuration mechanism (VS Code native workspace settings or Obsidian plugin data folder).
- **GitHub Profile Lookup:** To display GitHub profile pictures (avatars) and usernames in the comment sidebar, the extensions query public GitHub endpoints (`https://api.github.com/users/*`) directly from your machine. These requests are used solely to fetch public avatar URLs and display names.

### Chrome Extension (GitHub Integration)

- **GitHub Personal Access Tokens (PAT):** If you configure a GitHub Personal Access Token (PAT) in the Extension options (required for accessing private repositories or bypassing rate limits), it is stored securely on your local device using `chrome.storage.local`. It is only sent to the official GitHub API (`https://api.github.com`) to authenticate your actions and is never sent to any third party.
- **GitHub Repository & Comment Data:** The Chrome extension reads repository structure, pull requests, files in pull requests, and commit data from GitHub repositories you visit. It reads and writes comments using the GitHub API on your behalf.

---

## 3. Browser & System Permissions Explained

The Software requests only the necessary permissions required to operate:

### Chrome Extension

- **`storage`**: Used to save settings, preferences, and your Personal Access Token locally on your machine.
- **`host_permissions` (`https://github.com/*`, `https://raw.githubusercontent.com/*`)**: Allowed to inject content scripts to display the inline comments interface on GitHub pages and query GitHub APIs for file details.

### VS Code Extension

- **File System Access**: Required for reading workspace configuration and file paths to associate comments with Markdown documents.

### Obsidian Plugin

- **Vault Access**: Required for reading vault structure and note files to associate comments with Markdown documents.

---

## 4. Telemetry, Crash Diagnostics & Kill-Switch

Markdown Comments includes an OpenTelemetry-compatible diagnostic subsystem to monitor unhandled runtime exceptions and improve software reliability across platforms.

### What Is Collected

- **Sanitized Exception Type & Stack Traces**: Normalized error class names and function call frames (V8 and JavaScriptCore compatible).
- **Platform Metadata**: Client interface name (e.g., `vscode-extension`, `obsidian-plugin`, `chrome-extension`), operating system family (e.g., macOS, Windows, Linux), and extension version.
- **Strict Data Scrubbing (`INV-ZERO-CUSTOMER-DATA`):** All repository names, local file system directory paths (such as `/Users/username/...`), authorization headers, GitHub tokens, and markdown document contents are stripped client-side before any diagnostic record is constructed.
- **Zero Client Secrets (`INV-ZERO-CLIENT-SECRETS`):** Client interfaces hold no API keys or upstream monitoring tokens. Diagnostics are dispatched to a stateless Cloudflare Worker reverse proxy that verifies request structure and applies strict rate limiting before relaying to upstream APM backends (Grafana Cloud / SigNoz).

### Universal Kill-Switch Guarantee (`INV-TELEMETRY-KILLSWITCH`)

Whenever telemetry is disabled, the Software guarantees:

1. Immediate cessation of all diagnostic network transmissions.
2. Immediate termination of background flush timers and workers.
3. Immediate local memory and persistent storage queue purging (`md_telemetry_queue`).
4. Total runtime no-op behavior for error handlers.

### How to Disable Telemetry Across Interfaces

Users can unconditionally opt out of diagnostic telemetry at any time:

#### 1. Desktop IDEs (VS Code, Cursor, Google Antigravity)

The desktop extension automatically respects your IDE's global telemetry preferences:

- **Via Settings UI:** Open Settings (`Cmd+,` or `Ctrl+,`), search for **"Telemetry: Telemetry Level"**, and select **`off`** (or uncheck **"Telemetry: Enable Telemetry"**).
- **Via `settings.json`:** Add `"telemetry.telemetryLevel": "off"`.
- The extension listens for runtime changes to this setting and disables error logging immediately.

#### 2. Obsidian Plugin

- Open Obsidian **Settings** (`Cmd+,` or `Ctrl+,`).
- Under **Community Plugins**, select **Markdown Comments**.
- Scroll to **Anonymous Technical Diagnostics** and toggle it **OFF**.
- Telemetry shuts down instantly and buffered logs are cleared.

#### 3. Browser Extensions (Chrome & Safari MV3)

- **Browser Privacy Signal (Do Not Track):** Turn on **"Send a 'Do Not Track' request with your browsing traffic"** (or Global Privacy Control) in your browser privacy settings. The extension checks `navigator.doNotTrack`; if active (`'1'` or `'yes'`), telemetry is completely disabled.
- **Storage Setting:** Setting the extension storage key `md_telemetry_enabled` to `false` (via extension preferences or runtime message `{ type: "OTEL_SET_ENABLED", enabled: false }`) permanently disables dispatch and purges all queued records.

#### 4. Environment Variables (CLI, Embeds, Node.js & Headless Environments)

Set either of the following standard environment variables:

```bash
export DO_NOT_TRACK=1
# or
export MD_COMMENTS_TELEMETRY_DISABLED=1
```

The client runtime checks these variables at startup and disables telemetry immediately.

---

## 5. Third-Party Services

When using GitHub integration features or public profile resolution, your computer interacts directly with GitHub. These interactions are subject to:

- [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

When anonymous diagnostics are enabled, sanitized crash stack traces are routed through a Cloudflare Worker proxy to monitoring infrastructure. These transmissions do not contain personal identifiers, account names, or repository files.

We have no control over, and assume no responsibility for, the content, privacy policies, or practices of third-party platforms.

---

## 6. Security

We take the security of your local files and authentication credentials very seriously.

- Since the Software runs entirely locally, its security depends on the safety of your local operating system, IDE, or browser environment.
- We recommend using fine-grained GitHub Personal Access Tokens (PAT) with the minimum required scopes (read-only scopes for public browsing, or write access restricted only to necessary repositories).

---

## 7. Changes to This Policy

We may update our Privacy Policy from time to time. Any changes will be posted by updating the `PRIVACY.md` file in this repository. We encourage you to review this page periodically for any changes.

---

## 8. Contact Us

If you have any questions or suggestions about this Privacy Policy, do not hesitate to contact us:

- **Email:** info@md-comments.com
- **Project Repository:** [github.com/md-comments/md-comments](https://github.com/md-comments/md-comments)
