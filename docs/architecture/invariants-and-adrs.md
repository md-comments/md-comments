# System Invariants & Architectural Decision Records (ADRs)

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

This document formalizes the **14 Core System Invariants** and key **Architectural Decision Records (ADRs)** governing the Markdown Comments codebase.

---

## Part I: The 14 System Invariants

System invariants are non-negotiable correctness rules enforced across all monorepo packages. They are cataloged under [`quality/invariants/`](../../quality/invariants/) and validated in CI.

| Invariant ID                        | Title                                        | Scope                                 | Enforcement Mechanism                                          |
| :---------------------------------- | :------------------------------------------- | :------------------------------------ | :------------------------------------------------------------- |
| **`INV-OAUTH-ONLY`**                | OAuth Only Authentication                    | Chrome, Safari, IDE                   | Static analysis, ESLint AST rules, integration tests           |
| **`INV-FAST-FORWARD-RETRY`**        | Fast-Forward Concurrent Push Retry           | Shared, Storage                       | Unit tests asserting exponential backoff on 409 Conflict       |
| **`INV-ZERO-CLIENT-SECRETS`**       | Zero Client Secrets                          | All client bundles                    | AST bundle scanning, pre-commit secret leak tests              |
| **`INV-ZERO-CUSTOMER-DATA`**        | Zero Customer Data in Telemetry              | Telemetry, Shared                     | Schema verification and automated payload PII scrub tests      |
| **`INV-TELEMETRY-KILLSWITCH`**      | Immediate Telemetry Killswitch               | Telemetry                             | Tests asserting zero network dispatch when disabled            |
| **`INV-VISUAL-PARITY`**             | Cross-Platform Visual Parity                 | VS Code, Browser, Obsidian, Starlight | Playwright visual regression tests and design token assertions |
| **`INV-XSS-SANITIZED`**             | Strict Markdown/HTML Sanitization            | Preview Webview, WebExtensions        | DOMPurify / sanitizeHtml AST assertions                        |
| **`INV-QUOTA-DEFENSE`**             | GitHub API Rate Limit Defense                | Shared Git API                        | Conditional ETag caching and Tree SHA reuse tests              |
| **`INV-IN-PLACE-PREVIEW`**          | In-Place Preview DOM Mutation                | VS Code Webview Preview               | Playwright E2E asserting zero document DOM refresh             |
| **`INV-MUTATION-GUARD`**            | MutationObserver Equality Guard              | VS Code Preview Scripts               | `tests/vscode-preview-infinite-loop.test.ts`                   |
| **`INV-BASE-TREE-SHA`**             | Base Tree SHA Resolution                     | Shared Git Ref Backend                | `tests/gitRefBackend.test.ts` checking `tree.sha` usage        |
| **`INV-AUTH-PERSISTENCE`**          | Multi-Tier Auth & GlobalState Persistence    | VS Code Auth Manager                  | `tests/vscode-github-auth-persistence.test.ts`                 |
| **`INV-MODAL-CONFIRMATION`**        | In-Preview Modal Deletion Confirmation       | VS Code Webview DOM                   | `tests/e2e/vscode-real-repo-sequential-delete.spec.ts`         |
| **`INV-SILENT-BG-REFRESH`**         | Silent Background Synchronization            | Background Polling                    | `tests/refreshBackgroundSync.test.ts`                          |
| **`INV-NO-THIRD-PARTY-AUTH-PROXY`** | No Third-Party OAuth Proxy Relays            | All auth clients, Starlight           | Vitest endpoint assertions, elimination of proxy.cors.sh       |
| **`INV-SAFE-DESERIALIZATION`**      | Strict JSON Schema on YAML Parsing           | Storage, Shared, Obsidian, Chrome     | `yaml.JSON_SCHEMA` enforcement across all `yaml.load` calls    |
| **`INV-INPUT-VALIDATION-REPO`**     | Repository Identifier Path Traversal Defense | Shared Git Ref Backend                | `/^[\w.-]+$/` validation on owner and repo in GitHub API calls |

---

### Invariant Details

### 1. `INV-OAUTH-ONLY` (No PATs)

Browser extensions and IDE integrations must never prompt for, store, or persist raw GitHub Personal Access Tokens (PATs). All authentication must flow through OAuth Device Authorization (RFC 8628) or IDE native session providers (`vscode.authentication.getSession`).

### 2. `INV-FAST-FORWARD-RETRY`

Concurrent writes to `refs/md-comments/data` must never overwrite remote changes forcefully. When a push conflict (`409 Conflict`) occurs, the engine performs a three-way merge against the latest remote commit using jittered exponential backoff.

### 3. `INV-ZERO-CLIENT-SECRETS`

Client-side packages (`vscode-extension`, `chrome-extension`, `obsidian-plugin`, `starlight-plugin`) must never bundle client secrets or privileged credentials. Telemetry and OAuth endpoints utilize public client IDs or the dedicated proxy in `infrastructure/`.

### 4. `INV-ZERO-CUSTOMER-DATA`

Telemetry payloads must never contain raw Markdown document contents, comment text, author names, email addresses, or repository file paths. Only anonymized action counts, latency timings, and sanitized error categories are permitted.

### 5. `INV-TELEMETRY-KILLSWITCH`

When `telemetry.enabled` is false or the global environment killswitch is tripped, all telemetry collection and network dispatches must immediately cease without delay or caching.

### 6. `INV-VISUAL-PARITY`

The visual presentation of comment cards, badges, gutter markers, and sidebar drawers must maintain 100% typographic and aesthetic parity across VS Code, Chrome, Obsidian, and Starlight.

### 7. `INV-XSS-SANITIZED`

Rendered comment Markdown and user inputs must pass through strict DOM sanitization before being inserted into any webview or browser DOM tree, preventing script execution and HTML attribute injection.

### 8. `INV-QUOTA-DEFENSE`

All interactions with GitHub REST APIs must utilize conditional requests (`If-None-Match` with ETags) and reuse cached tree SHAs to prevent consuming GitHub API hourly rate limits.

### 9. `INV-IN-PLACE-PREVIEW`

Native preview comments, replies, edits, reactions, and deletions must update in-place in the preview DOM without reloading the markdown document DOM. Full document refreshes cause blank screen flashes, scroll position jumps, and tab resets.

### 10. `INV-MUTATION-GUARD`

DOM badge counter listeners and MutationObservers must verify that `element.textContent !== newContent` prior to mutating DOM nodes. Unconditional assignments cause recursive MutationObserver loops that saturate CPU cores at 100%.

### 11. `INV-BASE-TREE-SHA`

When constructing new Git trees via GitHub Git Data API (`POST /git/trees`), the `base_tree` parameter must be the 40-character SHA of a Git **Tree** object (`commitData.tree.sha`), retrieved via `GET /git/commits/:sha`. Supplying a Commit object SHA triggers an unrecoverable `422 Unprocessable Entity` error.

### 12. `INV-AUTH-PERSISTENCE`

VS Code authentication state must persist across window reloads and restarts via `context.globalState`. State modifications must fire reactive `onDidChangeAuthState` events to update webview indicators and action permissions.

### 13. `INV-MODAL-CONFIRMATION`

Destructive user actions within native preview webviews (e.g., deleting threads or replies) must display an accessible in-preview modal confirmation dialog. Native OS modal prompts block the thread and cause event propagation bugs.

### 14. `INV-SILENT-BG-REFRESH`

Background comment refresh loops and polling routines must execute silently. Extensions must never display toast notifications, steal window focus, or interrupt active typing during routine background syncs.

### 15. `INV-NO-THIRD-PARTY-AUTH-PROXY`

OAuth Device Flow authorization codes, tokens, and credentials must never transit through untrusted third-party CORS proxies (e.g., `proxy.cors.sh`). All network traffic must connect directly to official GitHub OAuth endpoints (`https://github.com/login/*`) or dedicated first-party proxy middlewares with origin verification.

### 16. `INV-SAFE-DESERIALIZATION`

Comment storage formats use YAML on custom git refs. To eliminate arbitrary object instantiation, code execution, or prototype pollution vulnerabilities, all YAML parser invocations (`yaml.load`) across the monorepo must explicitly specify `{ schema: yaml.JSON_SCHEMA }`.

### 17. `INV-INPUT-VALIDATION-REPO`

All methods accepting repository owner and repository name identifiers must validate them against path traversal sequences (`..`, `/`, `\`) and invalid characters before interpolating them into GitHub API URL paths. Identifiers must conform to `/^[\w.-]+$/` and reject directory navigation tokens.

---

## Part II: Architectural Decision Records (ADRs)

### ADR-001: Orphan Git Reference (`refs/md-comments/data`) for Comment Storage

- **Status**: Accepted
- **Context**: Storing comments directly inside Markdown files pollutes documents with proprietary HTML tags or anchor markers. Storing comments in an external cloud database introduces single points of failure, privacy risks, and vendor lock-in.
- **Decision**: Persist comments outside source branches using an orphan Git reference named `refs/md-comments/data`. Comments are stored as YAML documents keyed by document path and thread ID.
- **Consequences**:
  - _Positive_: Source Markdown remains 100% clean. Comment history is versioned, distributed, and decentralized via existing Git workflows.
  - _Negative_: Requires implementing Git Data API serialization and three-way merging for concurrent push resolution.

---

### ADR-002: FNV-1a Hash Anchoring with Context-Aware Fuzzy Fallback

- **Status**: Accepted
- **Context**: Line numbers alone are unstable anchors because document edits shift lines up and down.
- **Decision**: Compute a deterministic 32-bit FNV-1a hash of normalized selected text along with a 3-line leading and trailing context window. When document modifications occur, apply a cascading fuzzy search (Exact Hash $\to$ Normalized Whitespace $\to$ Contextual Levenshtein Search).
- **Consequences**:
  - _Positive_: High resilience against minor upstream document changes without losing comment attachments.
  - _Negative_: Substantial document rewrites require explicit author re-anchoring.

---

### ADR-003: Zero-PAT RFC 8628 OAuth Device Flow Architecture

- **Status**: Accepted
- **Context**: Traditional browser extensions frequently require users to generate and paste GitHub Personal Access Tokens (PATs), which pose severe security risks and poor user experience.
- **Decision**: Adopt RFC 8628 OAuth Device Authorization Flow (`INV-OAUTH-ONLY`). Users authorize via standard GitHub one-time code prompts. Tokens are stored securely in browser storage or IDE secrets without exposing secrets to client bundles.
- **Consequences**:
  - _Positive_: Zero friction for users, zero leaked PATs, aligned with modern GitHub security recommendations.
  - _Negative_: Requires polling GitHub token endpoint during the authorization handshake.

---

### ADR-004: In-Place DOM Surgery & Synchronous Early Hooking in Webview Preview

- **Status**: Accepted
- **Context**: In VS Code native Markdown preview, updating comments by re-rendering the document causes white screen flickering, loses scroll position, resets video/iframe state, and drops user focus. Furthermore, extension scripts executing after document load cannot intercept early events.
- **Decision**: Implement a synchronous bootstrap hook (`earlyHook.js`) that immediately caches `acquireVsCodeApi()` and polyfills `window.poster`. Update preview comments using targeted in-place DOM patching (`preview-webview.js`) guarded by MutationObserver equality checks (`INV-IN-PLACE-PREVIEW`, `INV-MUTATION-GUARD`).
- **Consequences**:
  - _Positive_: Instantaneous optimistic UI reactions, zero scroll jump, zero blank screen flicker, zero infinite loop CPU pegging.
  - _Negative_: Requires maintaining precise DOM element selectors and in-situ modal markup.

---

### ADR-005: Zero-Secret Telemetry Proxy Architecture

- **Status**: Accepted
- **Context**: Collecting diagnostic and performance telemetry must never leak customer intellectual property or expose private cloud credentials.
- **Decision**: Deploy a stateless proxy (`infrastructure/`) that scrubs all PII, document text, and file paths (`INV-ZERO-CUSTOMER-DATA`), authenticating against OpenTelemetry ingestion backends using server-side secrets while clients operate without embedded secrets (`INV-ZERO-CLIENT-SECRETS`).
- **Consequences**:
  - _Positive_: Guarantees client privacy and prevents credential extraction from client distribution bundles.
  - _Negative_: Incurs a minor network hop for telemetry transport.
