# Comprehensive Application Functionality Mapping & Nightly Regression Testing Suite Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## 1. Executive Summary & Objectives

### 1.1 Context

The **Markdown Comments (`md-comments`)** monorepo provides a decentralized, collaborative commenting engine for Markdown content across multiple client interfaces:

- **VS Code Extension** (`vscode-extension`)
- **Obsidian Community Plugin** (`obsidian-plugin`)
- **Cross-Browser Extension** (`chrome-extension` targeting Chrome, Firefox, Edge, and Safari)
- **Astro Starlight Documentation Plugin** (`starlight-plugin` with SSR/OAuth backend proxy)
- **Shared Core Engine & Storage Backends** (`shared`)

Because the product operates across wildly diverse execution environments (desktop IDEs, knowledge bases, browser content scripts, and static/SSR doc sites) while sharing a unified Git-based data schema (`refs/notes/md-comments` / `.comments.json`), **daily contributions and independent interface enhancements risk introducing subtle behavioral drift, schema divergence, anchor misalignment, security regressions, or broken authentication flows**.

### 1.2 Purpose of this Plan

This plan defines:

1. **A Systematic Functional Mapping Framework** to catalog and harmonize all requirements and behaviors across every interface.
2. **The 8 Quality Pillars**:
   - 📦 **Installation & Packaging**
   - 🔌 **Connections & Network**
   - 🛡️ **Consents, Permissions & Scopes**
   - ⚙️ **Core Functionality & Feature Parity**
   - 🔄 **Resilience & Fault Tolerance**
   - ⚡ **Performance & Scalability**
   - 🔒 **Security & Data Integrity**
   - 🎨 **UI/UX & Accessibility**
3. **An Automated Nightly Regression Testing Suite Architecture** that executes nightly in CI across all platforms, ensuring zero drift and catching breaking changes before release.

---

## 2. Monorepo Architecture & Interface Landscape

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  @md-comments/shared                                     │
│  - Anchor Hashing (MD5/SHA)    - Paragraph Indexing    - Heading Context Detection       │
│  - Git Ref Storage Backend     - Local File Backend    - Optimistic Store & Serializer   │
│  - Placement & Fuzzy Matching  - Author Normalization  - Comment Schema & Serialization  │
└──────────────▲───────────────────────────▲───────────────────────────▲───────────────────┘
               │                           │                           │
 ┌─────────────┴─────────────┐ ┌───────────┴───────────┐ ┌─────────────┴─────────────┐
 │     VS Code Extension     │ │    Obsidian Plugin    │ │     Browser Extension     │
 │  - CodeLens Provider      │ │  - Live Preview (CM6) │ │  - MV3 Content Script     │
 │  - Markdown-it Plugin     │ │  - Reading View Hook  │ │  - GitHub PR & Blob DOM   │
 │  - Webview Comment Panel  │ │  - Sidebar ItemView   │ │  - Background Worker      │
 │  - SecretStorage Auth     │ │  - Local Vault Sync   │ │  - Cross-Browser Adapter  │
 └───────────────────────────┘ └───────────────────────┘ └───────────────────────────┘
               │                           │                           │
 ┌─────────────┴───────────────────────────┴───────────────────────────┴───────────────────┐
 │                                   @md-comments/starlight                                │
 │  - Astro Integration Hook     - Client DOM Anchors    - Floating Badge & Sidebar Overlay│
 │  - SSR Auth Proxy Endpoint    - Device Flow / OAuth   - Responsive Mobile Drawer        │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Interface Feature Landscape

| Component              | Target Platform                                        | Storage Modes                         | Auth Flow                                     | UI Injection Points                                                                                   |
| :--------------------- | :----------------------------------------------------- | :------------------------------------ | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **`shared`**           | Universal TS (Node / Browser)                          | Git Refs (`refs/notes/*`), Local JSON | Decoupled (Tokens passed in)                  | N/A (Core Engine)                                                                                     |
| **`vscode-extension`** | VS Code (Desktop & Web)                                | Git Ref Backend, `.comments.json`     | VS Code `authentication` API / PAT            | Editor gutter, CodeLens, Markdown preview panel, Webview sidebar                                      |
| **`obsidian-plugin`**  | Obsidian (Desktop macOS/Win/Linux, Mobile iOS/Android) | Local Vault JSON, Git Ref Backend     | Vault Settings PAT / Token                    | CM6 Live Preview widgets, Reading View post-processor, Right Ribbon Sidebar                           |
| **`chrome-extension`** | Chromium, Firefox, Edge, Safari                        | GitHub Git Refs API                   | OAuth Device Flow, Personal Access Token      | Injected Floating Bubble on GitHub / GitLab markdown files & PR diffs, Collapsible Iframe/DOM Sidebar |
| **`starlight-plugin`** | Astro / Starlight Docs                                 | GitHub REST/GraphQL / Git Refs        | OAuth Proxy (`/api/auth`), GitHub Device Flow | Paragraph hover badges, Sticky Page Comments Drawer, Popover comment threads                          |

---

## 3. Comprehensive Functional Mapping Across the 8 Quality Pillars

Below is the detailed requirement decomposition across every quality pillar that each interface must fulfill and test against.

```
                  ┌───────────────────────────────────────────────────────────┐
                  │                 8 QUALITY PILLARS MAPPING                 │
                  └─────────────────────────────┬─────────────────────────────┘
          ┌─────────────────────┬───────────────┴───────────────┬─────────────────────┐
          ▼                     ▼                               ▼                     ▼
┌──────────────────┐  ┌───────────────────┐           ┌───────────────────┐  ┌───────────────────┐
│ 1. INSTALLATION  │  │   2. CONNECTIONS  │           │    3. CONSENTS    │  │ 4. FUNCTIONALITY  │
│  - Multi-target  │  │  - Git Refs / API │           │  - Permissions    │  │  - CRUD / Threads │
│  - Clean state   │  │  - OAuth / Proxy  │           │  - Token scopes   │  │  - Anchor matching│
│  - Upgrades      │  │  - Rate limits    │           │  - Privacy policy │  │  - Orphan recovery│
└──────────────────┘  └───────────────────┘           └───────────────────┘  └───────────────────┘
          ▲                     ▲                               ▲                     ▲
          │                     │                               │                     │
          ┌─────────────────────┴───────────────┬───────────────┴─────────────────────┐
          ▼                                     ▼                                     ▼
┌──────────────────┐                  ┌───────────────────┐                 ┌───────────────────┐
│  5. RESILIENCE   │                  │  6. PERFORMANCE   │                 │   7. SECURITY     │
│  - Race conflicts│                  │  - Large files    │                 │  - XSS Sanitizer  │
│  - Offline modes │                  │  - 0 Layout Shift │                 │  - Secret storage │
│  - Retries/backoff                  │  - Mem leak test  │                 │  - CSP compliance │
└──────────────────┘                  └───────────────────┘                 └───────────────────┘
                                                │
                                                ▼
                                      ┌───────────────────┐
                                      │   8. UI/UX & A11Y │
                                      │  - Theme sync     │
                                      │  - Keyboard / A11y│
                                      │  - Mobile drawers │
                                      └───────────────────┘
```

---

### Pillar 1: Installation, Packaging & Distribution (`INST`)

Every interface must have verified packaging, clean-installation, state initialization, upgrade migration, and uninstall/cleanup lifecycle guarantees.

| Requirement ID | Area                                  | Specific Requirement & Expected Behavior                                                                                                                                                   | Target Interfaces                |
| :------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- |
| `REQ-INST-01`  | **VS Code Extension Packaging**       | `vsce package` produces a valid `.vsix` bundle containing icons, manifests, and compiled bundles without extraneous node_modules. Installs cleanly in VS Code 1.80+ engines.               | `vscode-extension`               |
| `REQ-INST-02`  | **Obsidian Plugin Manifest & Layout** | `manifest.json`, `main.js`, and `styles.css` can be unzipped into `.obsidian/plugins/obsidian-md-comments/` and loaded without console errors or missing dependencies on desktop & mobile. | `obsidian-plugin`                |
| `REQ-INST-03`  | **Multi-Browser Manifests**           | Build pipeline generates store-compliant packages for: Chromium MV3 (`dist/chrome`), Firefox MV3 (`dist/firefox` with `gecko.id`), Edge (`dist/edge`), and Safari App Extension wrapper.   | `chrome-extension`               |
| `REQ-INST-04`  | **Starlight Plugin Integration**      | Integrates into Astro config via `starlightComments()` without requiring peer dependency collisions. Bundles zero-runtime SSR code and ships optimized client scripts.                     | `starlight-plugin`, `demo-astro` |
| `REQ-INST-05`  | **Clean First-Boot Initialization**   | On fresh installation, each interface initializes default configuration without creating unprompted remote branches, polluting git status, or throwing unhandled exceptions.               | All Interfaces                   |
| `REQ-INST-06`  | **Schema Migration & Upgrade**        | When upgrading from older comment schema versions (e.g., v1 without reactions to v2 with reactions/replies), stores migrate cleanly without data loss.                                     | `shared`, All Clients            |
| `REQ-INST-07`  | **Deactivation & Cleanup**            | Disabling or uninstalling removes all DOM event listeners, CodeMirror extensions, CodeLens providers, and observer mutations without memory leaks.                                         | All Interfaces                   |

---

### Pillar 2: Connections & Network Protocols (`CONN`)

Unified behavior for connecting to Git repositories, remote GitHub/GitLab APIs, OAuth authentication servers, and handling network state.

| Requirement ID | Area                                   | Specific Requirement & Expected Behavior                                                                                                                          | Target Interfaces                      |
| :------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `REQ-CONN-01`  | **Git Ref Storage Protocol**           | Read and write comments to custom Git references (`refs/notes/md-comments` or configurable refs) using standard Git tree/blob objects.                            | `shared`, `vscode`, `obsidian`         |
| `REQ-CONN-02`  | **GitHub REST & GraphQL Backend**      | Connects to GitHub API to fetch/update refs without requiring full repo clone in web contexts. Supports pagination and large comment file blobs.                  | `shared`, `chrome`, `starlight`        |
| `REQ-CONN-03`  | **OAuth Device Authorization Flow**    | Supports headless / browser-based GitHub OAuth Device Flow (RFC 8628) for seamless login without exposing client secrets.                                         | `chrome-extension`, `starlight-plugin` |
| `REQ-CONN-04`  | **OAuth Proxy Server**                 | Starlight auth proxy (`/api/auth`) handles token exchange securely, validates state, and returns session tokens with strict CORS policies.                        | `starlight-plugin`, `demo-astro`       |
| `REQ-CONN-05`  | **Rate Limit Handling**                | Gracefully detects GitHub 403 Rate Limit responses (`x-ratelimit-remaining: 0`), reads `x-ratelimit-reset`, and notifies user with countdown instead of crashing. | All Interfaces                         |
| `REQ-CONN-06`  | **Offline Mode & Reconnect Sync**      | When disconnected, clients switch to read-only cached mode (or queue local edits) and automatically trigger background sync once network restores.                | All Interfaces                         |
| `REQ-CONN-07`  | **Enterprise / Custom Domain Support** | Configurable base URLs for GitHub Enterprise Server or custom Git remote hosts across all interfaces.                                                             | All Interfaces                         |

---

### Pillar 3: Consents, Permissions & Scopes (`CONS`)

Adherence to the principle of least privilege, clear consent dialogs, and compliance with the project's `PRIVACY.md`.

| Requirement ID | Area                                      | Specific Requirement & Expected Behavior                                                                                                                                                                                   | Target Interfaces                |
| :------------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- |
| `REQ-CONS-01`  | **Minimal OAuth Scopes**                  | Requests only the minimal required scopes: `public_repo` (for public documentation) or `repo` (for private repos). Never requests `delete_repo`, `admin`, or `workflow` scopes.                                            | All Interfaces                   |
| `REQ-CONS-02`  | **Browser Host Permissions**              | Chrome extension manifest requests host permissions only for active tabs and specific target domains (`https://github.com/*`, `https://api.github.com/*`), avoiding blanket `<all_urls>` whenever possible.                | `chrome-extension`               |
| `REQ-CONS-03`  | **Secure Token Storage**                  | Tokens must be stored in secure platform keychains: VS Code `context.secrets` (SecretStorage), Obsidian encrypted vault data, Browser `chrome.storage.local` (never `localStorage` accessible to third-party web scripts). | All Interfaces                   |
| `REQ-CONS-04`  | **Public Reader vs Authenticated Writer** | In Starlight / web docs, public visitors can read comments without login. Creating, editing, or reacting to comments explicitly prompts for GitHub authorization consent.                                                  | `starlight-plugin`, `demo-astro` |
| `REQ-CONS-05`  | **Telemetry & Zero-Tracking Guarantee**   | Respects `PRIVACY.md`: No user comments, source code, or author email tokens are transmitted to external third-party analytics servers.                                                                                    | All Interfaces                   |
| `REQ-CONS-06`  | **Explicit Vault Access Consent**         | Obsidian plugin does not modify files outside its designated comment directory or git ref without explicit user toggle in settings.                                                                                        | `obsidian-plugin`                |

---

### Pillar 4: Core Functionality & Feature Parity (`FUNC`)

The core commenting engine rules, placement heuristics, anchoring stability, and thread workflows.

| Requirement ID | Area                                 | Specific Requirement & Expected Behavior                                                                                                                                                        | Target Interfaces                           |
| :------------- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| `REQ-FUNC-01`  | **Deterministic Anchor Hashing**     | Calculates stable MD5/SHA hashes for markdown paragraphs based on normalized text, heading context, and relative paragraph index (`shared/anchor.ts`).                                          | `shared`, All Clients                       |
| `REQ-FUNC-02`  | **Fuzzy Anchor Relocation**          | When a markdown document is edited (paragraphs inserted/deleted above or minor typos fixed), the placement algorithm (`shared/placement.ts`) matches comments to the correct updated paragraph. | `shared`, All Clients                       |
| `REQ-FUNC-03`  | **Orphan Detection & Recovery**      | If anchored text is completely deleted or rewritten beyond fuzzy threshold, comments are marked as `orphaned: true` and displayed in an "Orphaned Comments" tray with relocation options.       | All Interfaces                              |
| `REQ-FUNC-04`  | **Page Comments vs Inline Comments** | Full support for both whole-document comments (`PageComment`) and block-level paragraph comments (`InlineComment`).                                                                             | All Interfaces                              |
| `REQ-FUNC-05`  | **Threaded Replies & Conversations** | Support infinite or multi-level threaded replies (`Reply`) with timestamp, author metadata, and edit indicators (`updated_at`).                                                                 | All Interfaces                              |
| `REQ-FUNC-06`  | **Emoji Reactions**                  | Add and toggle emoji reactions (👍, ❤️, 🚀, 👀, 🎉, etc.) with optimistic UI counters and deduplicated user arrays per emoji.                                                                   | All Interfaces                              |
| `REQ-FUNC-07`  | **Resolve / Reopen Lifecycle**       | Mark threads as resolved (`resolved: true`, `resolved_at`, `resolved_by`), collapse resolved threads by default, and provide a toggle to view/reopen resolved comments.                         | All Interfaces                              |
| `REQ-FUNC-08`  | **Markdown Rendering in Comments**   | Comments support GitHub Flavored Markdown (bold, italic, inline code, code blocks, lists, links) with strictly sanitized output.                                                                | All Interfaces                              |
| `REQ-FUNC-09`  | **Multi-Author Attribution**         | Displays author GitHub avatar, display name, handle, and relative timestamp (`author.ts`, `githubAvatars.ts`, `githubDisplayNames.ts`).                                                         | All Interfaces                              |
| `REQ-FUNC-10`  | **Comment Filtering & Search**       | Ability to filter comments by status (open vs resolved vs orphaned), author, or free-text search across threads.                                                                                | `vscode`, `obsidian`, `chrome`, `starlight` |

---

### Pillar 5: Resilience & Fault Tolerance (`RESI`)

Handling race conditions, merge conflicts, network failures, and rapid asynchronous mutations.

| Requirement ID | Area                                    | Specific Requirement & Expected Behavior                                                                                                                                                               | Target Interfaces                      |
| :------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `REQ-RESI-01`  | **Optimistic Updates & Rollback**       | Mutations (post comment, toggle reaction) immediately update local state for snappy UX. If background write fails, state automatically rolls back and alerts the user (`optimisticStore.ts`).          | `shared`, All Clients                  |
| `REQ-RESI-02`  | **Serialized Background Writes**        | Multiple rapid comment submissions are queued and processed sequentially per file key to prevent out-of-order writes or lost updates.                                                                  | `shared`, `vscode-extension`           |
| `REQ-RESI-03`  | **Git Ref Fast-Forward Conflict Retry** | If writing to `refs/notes/md-comments` fails due to remote ref moving (HTTP 409 / non-fast-forward), fetches the latest ref, merges comment lists by comment ID, and retries with exponential backoff. | `shared`, All Clients                  |
| `REQ-RESI-04`  | **SPA Soft Navigation Stability**       | In Chrome extension on GitHub (Turbo/Pjax) and Starlight (View Transitions), navigating between pages without full reload cleanly tears down old overlays and re-anchors on the new page.              | `chrome-extension`, `starlight-plugin` |
| `REQ-RESI-05`  | **Corrupted File Self-Healing**         | If a `.comments.json` or Git ref blob contains malformed JSON or schema mismatches, parsing fails gracefully without crashing the host app, logging an error and offering recovery.                    | `shared`, All Clients                  |
| `REQ-RESI-06`  | **DOM Mutation Resistance**             | In web and browser views, changes to DOM (e.g. syntax highlighting, lazy loaded images) do not detach or misalign floating comment badges.                                                             | `chrome-extension`, `starlight-plugin` |

---

### Pillar 6: Performance & Scalability (`PERF`)

Strict benchmarks to prevent UI freezing, memory bloat, or excessive network bandwidth.

| Requirement ID | Area                                   | Specific Requirement & Expected Behavior                                                                                                                  | Target Interfaces                      |
| :------------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `REQ-PERF-01`  | **Anchor Calculation Latency**         | Hashing and anchoring a 1,000-paragraph markdown document must complete in under **10ms** on standard CPU.                                                | `shared`                               |
| `REQ-PERF-02`  | **Large Thread Rendering**             | Rendering a document with **500+ active comments** across 50 threads must maintain **60 FPS** scroll performance without freezing the editor or web page. | All Interfaces                         |
| `REQ-PERF-03`  | **Zero Cumulative Layout Shift (CLS)** | Loading and injecting comment badges or sidebars in Starlight / web pages must not cause sudden layout jumping (CLS score < 0.05).                        | `starlight-plugin`, `demo-astro`       |
| `REQ-PERF-04`  | **Client Bundle Size Limits**          | Injected client scripts: Chrome content script bundle < **150 KB** (unzipped); Starlight client bundle < **50 KB** (gzipped).                             | `chrome-extension`, `starlight-plugin` |
| `REQ-PERF-05`  | **Memory Leak Prevention**             | Repeatedly opening, editing, and closing 100 documents in VS Code or Obsidian must not leak detached DOM nodes or unbounded cache maps in memory.         | `vscode`, `obsidian`                   |
| `REQ-PERF-06`  | **Cache Freshness & In-Memory TTL**    | Caches remote comment reads with a configurable TTL (e.g. 60s) to minimize redundant GitHub API requests while providing instant cache hits.              | `shared`, All Clients                  |

---

### Pillar 7: Security & Data Integrity (`SECU`)

Guarantees against cross-site scripting (XSS), token leakage, and unauthorized modifications.

| Requirement ID | Area                                         | Specific Requirement & Expected Behavior                                                                                                                                                              | Target Interfaces               |
| :------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| `REQ-SECU-01`  | **XSS Sanitization on Markdown Render**      | All user-authored comment markdown is rigorously sanitized using strict allowlists (DOMPurify or equivalent). `<script>`, `onerror`, `javascript:`, `data:`, and malicious SVG payloads are stripped. | All Interfaces                  |
| `REQ-SECU-02`  | **Content Security Policy (CSP) Compliance** | Webviews and browser extension sidebars strictly enforce CSP: `default-src 'none'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`. No `eval()` or unvetted remote scripts.                  | `vscode`, `chrome`, `starlight` |
| `REQ-SECU-03`  | **Secure Credential Isolation**              | Personal Access Tokens and OAuth Bearer tokens are never written to disk unencrypted, never logged in debug outputs, and never included in Git commit messages or ref payloads.                       | All Interfaces                  |
| `REQ-SECU-04`  | **Isolated World Execution**                 | Browser extension content scripts execute in an isolated world, preventing hostile web page scripts from tampering with extension tokens or intercepting API messages.                                | `chrome-extension`              |
| `REQ-SECU-05`  | **Dependency Supply Chain Security**         | Zero high/critical vulnerabilities in `pnpm audit` / FOSSA scans (`fossa-deps.json`, `.fossa.yml`). Overrides pinned for known vulnerable transitive dependencies.                                    | Monorepo / All Packages         |

---

### Pillar 8: UI/UX, Theming & Accessibility (`UIUX`)

Visual polish, theme harmony, keyboard navigation, and accessibility standards.

| Requirement ID | Area                                   | Specific Requirement & Expected Behavior                                                                                                                                                           | Target Interfaces                     |
| :------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| `REQ-UIUX-01`  | **Native Theme Synchronization**       | Automatically matches host application theme variables: VS Code (`--vscode-editor-background`, etc.), Obsidian (`--background-primary`, etc.), Starlight dark/light mode, and GitHub system theme. | All Interfaces                        |
| `REQ-UIUX-02`  | **Responsive Mobile Layouts**          | On mobile screen widths (<768px in Starlight / Obsidian Mobile), comments overlay transforms into an ergonomic bottom drawer / full-screen modal with touch-friendly hit targets (min 44x44px).    | `starlight-plugin`, `obsidian-plugin` |
| `REQ-UIUX-03`  | **Keyboard Navigation & Shortcuts**    | Full keyboard support: `Ctrl+Enter` / `Cmd+Enter` to submit comment, `Escape` to close modal/sidebar, `Tab` focus management inside comment forms.                                                 | All Interfaces                        |
| `REQ-UIUX-04`  | **WCAG 2.1 AA Accessibility**          | Proper ARIA roles (`role="dialog"`, `aria-expanded`, `aria-label`), visible focus rings, and minimum 4.5:1 text color contrast across all themes.                                                  | All Interfaces                        |
| `REQ-UIUX-05`  | **Visual States & Micro-interactions** | Clear visual indicators for pending writes (optimistic spinner/opacity), error badges with retry actions, resolved thread dimming, and smooth expand/collapse transitions.                         | All Interfaces                        |

---

## 4. Requirement Traceability Matrix (RTM)

The following matrix maps every requirement ID across all monorepo packages to ensure comprehensive coverage:

| Requirement Category | Req ID            |  Shared Core  |     VS Code Ext     |  Obsidian Plugin  | Browser Ext (Chrome/FF/Safari) |   Starlight Plugin   |
| :------------------- | :---------------- | :-----------: | :-----------------: | :---------------: | :----------------------------: | :------------------: |
| **Installation**     | `REQ-INST-01..07` |    ✅ Core    |       ✅ VSIX       | ✅ Community/Zip  |         ✅ Multi-Store         |   ✅ Astro Plugin    |
| **Connections**      | `REQ-CONN-01..07` |  ✅ Ref/File  |     ✅ Git/API      |   ✅ Vault/API    |         ✅ Device/API          |    ✅ OAuth Proxy    |
| **Consents**         | `REQ-CONS-01..06` |   ✅ Schema   |     ✅ Secrets      |    ✅ Settings    |         ✅ Host Perms          |  ✅ Public vs Auth   |
| **Functionality**    | `REQ-FUNC-01..10` | ✅ Algo/Data  | ✅ CodeLens/Webview |  ✅ CM6/Sidebar   |        ✅ Injected DOM         |  ✅ Starlight Tray   |
| **Resilience**       | `REQ-RESI-01..06` | ✅ Retry/Lock |    ✅ Optimistic    | ✅ Error Recovery |        ✅ SPA Turbo Fix        |   ✅ Hydration/SSR   |
| **Performance**      | `REQ-PERF-01..06` | ✅ Fast Hash  |    ✅ Mem Watch     |  ✅ Virtual List  |        ✅ Light Bundle         |    ✅ 0 CLS / SSR    |
| **Security**         | `REQ-SECU-01..05` | ✅ Validation |    ✅ Sanitizer     |    ✅ Safe DOM    |       ✅ CSP / Isolated        | ✅ Sanitizer / Proxy |
| **UI/UX & A11y**     | `REQ-UIUX-01..05` |      N/A      |    ✅ VSCode CSS    |  ✅ Obsidian CSS  |        ✅ Native GH CSS        |  ✅ Starlight Theme  |

---

## 5. Nightly Regression Testing Suite Architecture

To prevent behavioral drift and guarantee continuous compliance across all 8 pillars, we define a **multi-tiered automated regression test harness**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               NIGHTLY TEST HARNESS MATRIX                              │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Layer 1: Unit & Crypto   │ Vitest (Shared Hashing, Placement, Ast, Git Ref Serializer) │
│ Layer 2: Headless Mock   │ MSW + In-Memory Git Server (Fast-Forward Retries, Optimism)│
│ Layer 3: VS Code E2E     │ @vscode/test-electron (CodeLens, Preview Webview, Secrets)  │
│ Layer 4: Obsidian E2E    │ Vitest JSDOM / Obsidian Mock Harness (Live Preview, Vault)  │
│ Layer 5: Browser Ext E2E │ Playwright + Chromium/Firefox (MV3 Injected DOM, Sidebar)   │
│ Layer 6: Starlight E2E   │ Playwright + Astro Dev Server (Overlay, Auth Proxy, A11y)   │
│ Layer 7: Non-Functional  │ Lighthouse CI (Perf/CLS) + axe-core (A11y) + FOSSA/SCA      │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 5.1 Test Layers Detailed Specification

#### Layer 1: Unit & Algorithmic Correctness (`vitest run`)

- **Scope**: Core logic in `shared/` (`anchor.ts`, `placement.ts`, `gitRefBackend.ts`, `author.ts`).
- **Tests**:
  - Exact paragraph hashing across diverse line endings (`\n`, `\r\n`).
  - Fuzzy relocation when lines are inserted above, below, or inside paragraphs.
  - Multi-reaction and threaded reply data structure immutability.
  - Markdown AST extraction with nested blockquotes, tables, lists, and code fences.

#### Layer 2: Headless Backend & Concurrency Integration

- **Scope**: Simulated remote interactions without third-party network flakiness.
- **Fixture Setup**:
  - In-memory simulated Git bare repository with custom refs (`refs/notes/md-comments`).
  - Mock Service Worker (MSW) intercepting GitHub REST (`/repos/:owner/:repo/git/refs/*`, `/git/blobs/*`) and GraphQL endpoints.
- **Tests**:
  - Concurrent write simulation: 5 simultaneous workers pushing comments -> verifying fast-forward retry and zero lost comments.
  - Rate-limit simulation (403 header handling).
  - Malformed blob recovery.

#### Layer 3: VS Code Extension Integration (`@vscode/test-electron`)

- **Scope**: Extension lifecycle within an actual VS Code instance.
- **Tests**:
  - CodeLens count calculation above commented paragraphs.
  - Markdown preview panel injection and side-by-side bidirectional cursor scrolling.
  - Optimistic comment submission in webview panel.
  - SecretStorage token persistence across window reloads.

#### Layer 4: Obsidian Plugin Fixture Tests

- **Scope**: Plugin behavior inside Obsidian API environment.
- **Tests**:
  - CodeMirror 6 StateField & ViewPlugin decoration generation in Live Preview.
  - MarkdownPostProcessor gutter badge creation in Reading View.
  - Sidebar ItemView reaction counter updates.
  - Vault file rename / folder move anchor preservation.

#### Layer 5: Cross-Browser Extension E2E (Playwright)

- **Scope**: Automated browser testing with unpacked extension loaded in Chromium and Firefox.
- **Tests**:
  - Loading GitHub markdown view fixture (`http://localhost:3000/fixtures/sample-doc.html`).
  - Verification that floating comment badge appears on mouse hover over paragraph.
  - Clicking badge opens sidebar iframe/overlay.
  - Submitting comment sends message to background service worker and renders new thread.
  - Simulating GitHub Turbo soft navigation: overlay unmounts and remounts accurately.

#### Layer 6: Astro Starlight E2E (Playwright)

- **Scope**: End-to-end tests against `demo-astro` build.
- **Tests**:
  - Server-Side Rendering (SSR) output contains zero hydration errors.
  - Unauthenticated reader can view comments and see "Sign in with GitHub" prompt.
  - Mock OAuth popup flow successfully authenticates client.
  - Mobile viewport (375x667) verifies bottom drawer layout and swipe-to-dismiss.

#### Layer 7: Non-Functional Automated Audits

- **Performance & CLS**: Lighthouse CI running against Starlight and Demo pages, asserting Cumulative Layout Shift (CLS) = 0 and First Contentful Paint (FCP) degradation < 50ms.
- **Accessibility**: `@axe-core/playwright` scanning all rendered overlays and sidebars, asserting 0 violations for WCAG 2.1 AA.
- **Security & SCA**: Automated `pnpm audit --prod --audit-level high` and strict DOMPurify XSS mutation test suites passing malicious payloads (`<img src=x onerror=alert(1)>`, `<svg><script>alert(1)</script></svg>`).

---

## 6. GitHub Actions Nightly CI Workflow

Below is the specification for `.github/workflows/nightly-regression.yml` to run automatically every night at 02:00 UTC and on manual trigger:

```yaml
name: Nightly Comprehensive Regression Suite

on:
  schedule:
    # Run every day at 02:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch:
    inputs:
      trigger_reason:
        description: 'Reason for manual trigger'
        required: false
        default: 'Manual drift verification'

jobs:
  core-and-unit:
    name: Core, Unit & Security Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: CodeGraph Sync & Health Check
        run: pnpm codegraph:status || true

      - name: Security & Dependency Audit
        run: |
          pnpm audit --prod --audit-level high
          pnpm lint

      - name: Typecheck All Packages
        run: pnpm typecheck

      - name: Run Vitest Unit & Coverage Suite
        run: pnpm test:coverage

  vscode-regression:
    name: VS Code Extension E2E
    needs: core-and-unit
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm package:vscode
      - name: Run VS Code Headless Test Suite
        run: |
          xvfb-run -a pnpm --filter md-preview-comments run test:e2e || pnpm --filter md-preview-comments run test:e2e
        if: always()

  browser-extension-regression:
    name: Cross-Browser Extension E2E
    needs: core-and-unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:chrome
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium firefox
      - name: Run Playwright Browser Extension Suite
        run: npx playwright test tests/e2e/browser-extension/

  starlight-and-web-regression:
    name: Starlight Plugin & A11y Audits
    needs: core-and-unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:starlight && pnpm build:demo-astro
      - name: Run Playwright Starlight E2E & Axe-core A11y Tests
        run: npx playwright test tests/e2e/starlight/

  drift-notification:
    name: Nightly Drift & Regression Notification
    if: failure()
    needs: [vscode-regression, browser-extension-regression, starlight-and-web-regression]
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Issue on Regression Drift
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 Nightly Regression Failure: Behavioral Drift Detected (${new Date().toISOString().split('T')[0]})`,
              body: `The nightly regression testing suite failed on run [${context.runId}](${runUrl}).\n\nPlease inspect the failed matrix jobs to resolve any behavioral or interface drift.`
            });
```

---

## 7. Implementation Roadmap & Milestones

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          PHASED IMPLEMENTATION TIMELINE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Requirements Baseline & Schema Hardening  ──► Freeze RTM, Schema Validators   │
│ Phase 2: Mock Infrastructure & Concurrency Fixtures──► In-memory Git, MSW Handlers    │
│ Phase 3: Playwright Cross-Interface E2E Suites     ──► Chrome, Firefox, Starlight E2E  │
│ Phase 4: Non-Functional Automation (Perf/A11y/XSS) ──► Axe-core, Lighthouse, XSS Fuzz │
│ Phase 5: Nightly CI Workflow & Drift Alerts        ──► Scheduled Cron, Issue Creator   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Requirements Baseline & Schema Hardening (Days 1–3)

- [ ] Establish automated schema validation for `CommentsFile` (`PageComment`, `InlineComment`, `Reply`, `Reaction`) using Zod or TypeBox in `@md-comments/shared`.
- [ ] Create shared test fixtures under `tests/fixtures/` with standardized markdown documents covering edge cases (dense tables, deep blockquotes, math blocks, HTML tags).

### Phase 2: Mock Infrastructure & Concurrency Fixtures (Days 4–7)

- [ ] Build `tests/mocks/mockGitServer.ts` and `tests/mocks/mswGithubHandlers.ts` to simulate GitHub REST/GraphQL API and Git Ref backends.
- [ ] Implement race-condition test harness in `tests/gitRefBackend.concurrency.test.ts` testing 10+ concurrent simulated clients writing to the same ref.

### Phase 3: Cross-Interface E2E Regression Suites (Days 8–14)

- [ ] Implement Playwright browser extension test runner (`tests/e2e/browser-extension/`) testing unpacked MV3 extensions on sample web markdown pages.
- [ ] Implement Starlight E2E test runner (`tests/e2e/starlight/`) testing overlay mounting, drawer sliding, and offline detection.
- [ ] Implement VS Code Extension headless test runner using `@vscode/test-electron`.

### Phase 4: Non-Functional Test Suites (Days 15–18)

- [ ] Add `@axe-core/playwright` accessibility assertions across all client UI components.
- [ ] Implement automated XSS fuzzing test suite injecting OWASP XSS cheat-sheet payloads into comments and verifying sanitized DOM.
- [ ] Configure Lighthouse CI budget assertions for CLS (<0.05) and memory footprint.

### Phase 5: CI Integration & Drift Alerting (Days 19–21)

- [ ] Create `.github/workflows/nightly-regression.yml` with matrix testing and automatic issue creation on failure.
- [ ] Document testing execution commands in `README.md` and repository contributor guidelines.

---

## 8. Verification & Acceptance Criteria

The plan execution will be considered complete when:

1. **100% of the 8 Quality Pillars** have corresponding automated test suites registered in CI.
2. **All 4 Client Interfaces** (`vscode-extension`, `obsidian-plugin`, `chrome-extension`, `starlight-plugin`) and `shared` have dedicated automated regression test jobs.
3. The nightly CI workflow runs automatically, generates test coverage and JUnit reports, and notifies developers within 5 minutes of any detected behavioral drift.
