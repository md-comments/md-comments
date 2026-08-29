# Privacy Policy

**Last Updated:** August 29, 2026

Your privacy is extremely important to us. This Privacy Policy describes how the **Markdown Comments** suite of tools—including the **VS Code Extension**, **Obsidian Plugin**, **Chrome Extension**, and **Embeddable Web Component** (collectively, the "Software")—handles data and information.

---

## 1. Executive Summary

- **Local-First & Serverless:** The Software runs entirely client-side on your local machine, editor, or browser.
- **Not a PII Processor or Keeper:** Because data is stored directly in your own designated GitHub repository and we operate no backend servers or databases, Markdown Comments is neither a data processor nor a keeper/custodian of any direct or linkable Personally Identifiable Information (PII).
- **Public Demo Sites (24-Hour Maximum Retention):** For public interactive demo sites and sandboxes, any comments and associated public identifiers are retained for a maximum of 24 hours, as demo data is automatically wiped every 24 hours.
- **No Third-Party Servers or Telemetry:** We do not host central databases, tracking pixels, analytics, or telemetry scripts.
- **Direct GitHub Communication:** Network requests occur directly between your client and official GitHub endpoints (`https://api.github.com` and `https://raw.githubusercontent.com`).
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

## 4. Third-Party Services

When using GitHub integration features or public profile resolution, your computer interacts directly with GitHub. These interactions are subject to:

- [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services (including GitHub).

---

## 5. Security

We take the security of your local files and authentication credentials very seriously.

- Since the Software runs entirely locally, its security depends on the safety of your local operating system, IDE, or browser environment.
- We recommend using fine-grained GitHub Personal Access Tokens (PAT) with the minimum required scopes (read-only scopes for public browsing, or write access restricted only to necessary repositories).

---

## 6. Changes to This Policy

We may update our Privacy Policy from time to time. Any changes will be posted by updating the `PRIVACY.md` file in this repository. We encourage you to review this page periodically for any changes.

---

## 7. Contact Us

If you have any questions or suggestions about this Privacy Policy, do not hesitate to contact us:

- **Email:** info@md-comments.com
- **Project Repository:** [github.com/md-comments/md-comments](https://github.com/md-comments/md-comments)
