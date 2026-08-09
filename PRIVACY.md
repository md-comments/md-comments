# Privacy Policy

**Last Updated:** July 30, 2026

Your privacy is extremely important to us. This Privacy Policy describes how the **Markdown Comments** suite of tools—including the **VS Code Extension**, **Obsidian Plugin**, and **Chrome Extension** (collectively, the "Software")—collects, stores, uses, and shares information.

---

## 1. Executive Summary

- **Local-First Operation:** The Software runs entirely client-side and locally on your machine or browser.
- **No Third-Party Servers:** We do not host any remote servers, databases, or tracking systems.
- **No Analytics or Telemetry:** There are no analytics, tracking pixels, or telemetry scripts included in any version of the Software.
- **Direct GitHub Communication:** Network requests are limited to direct, secure communication with GitHub APIs (`https://api.github.com` and `https://raw.githubusercontent.com`) to resolve author names, fetch avatars, or manage comment commits.
- **Local Storage:** All settings, configurations, cached profiles, and authentication credentials are stored locally in your editor's or browser's native storage.

---

## 2. Information Collection and Handling

### VS Code Extension & Obsidian Plugin

- **Comment Data:** All comments, replies, and reactions are stored directly on GitHub as the primary backend (via GitHub API using dedicated orphan git references `refs/md-comments/data`). When working offline or in local non-GitHub repositories, comments seamlessly fall back to local companion `<filename>.comments.yml` files right next to your markdown documents.
- **Local Settings:** Settings such as preferred sidebar width, emoji lists, or your custom author name are stored locally using the host application's configuration mechanism (VS Code native workspace settings or Obsidian plugin data folder).
- **GitHub Profile Lookup:** To display GitHub profile pictures (avatars) and usernames in the comment sidebar, the VS Code extension and Obsidian plugin query public GitHub endpoints (`https://api.github.com/users/*`). These requests do not transmit personal data and are used solely to fetch public avatar URLs and display names.

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

- **File System Access**: Required to read and write companion `.comments.yml` files when working in local offline mode.

### Obsidian Plugin

- **Vault Access**: Required to read and write companion `.comments.yml` files when working in local offline mode.

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
