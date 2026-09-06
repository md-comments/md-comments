# Comprehensive Headless Playwright Regression Suite for Full Feature Catalog

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## 1. Overview & Objectives

The goal of this plan is to achieve **100% headless Playwright end-to-end browser automation** across all **34 features** cataloged in `quality/features/`.

While the baseline suite established unit tests and schema assertions, this implementation elevates the test suite into a **live browser regression harness**:

- Running Chromium in modern headless mode (`--headless=new`) with the unpacked Chrome extension loaded (`--load-extension=chrome-extension/dist`).
- Using `extensionFixture.ts` to launch isolated browser profiles with mock OAuth sessions in `chrome.storage.local`.
- Utilizing `localMockServer.ts` to serve a realistic GitHub Markdown DOM page and hermetic Git Data REST API responses.
- Driving real DOM interactions: hovering paragraphs, clicking gutter triggers, typing in the composer, using formatting toolbars, triggering collaborator mention autocomplete, reacting with emojis, resolving threads, expanding/collapsing the drawer, and verifying SPA Turbo soft navigation.

---

## 2. Current State vs. Proposed Architecture

### Current State

- `quality/features/` contains 34 feature specs, but many point to Vitest unit tests (`tests/*.test.ts`).
- `tests/e2e/` currently contains 7 high-level Playwright specs that test schema and logic contracts, without launching the real unpacked Chrome extension in a browser DOM.

### Proposed Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │       Playwright Test Runner (Headless)       │
                               │  --headless=new  --load-extension=dist/      │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │     Isolated Browser      │                                 │   Hermetic Local Mock     │
         │  Extension Context (MV3)  │◄──────────── REST / Git ────────┤     HTTP Mock Server      │
         │  - Gutter Hover Trigger   │             Data API            │  - /repos/:o/:r/git/refs  │
         │  - Composer & Formatting  │                                 │  - /repos/:o/:r/contents  │
         │  - Mentions & Reactions   │                                 │  - /user                  │
         │  - Sidebar Drawer         │                                 │  - GitHub markdown DOM    │
         └─────────────┬─────────────┘                                 └───────────────────────────┘
                       │
                       ▼
         ┌───────────────────────────────────────────────────────────────────────────┐
         │                    Allure & Monocart Reporting Pipeline                   │
         │  - Allure Results (Epic -> Feature -> Story -> Step -> Traces/Screenshots) │
         │  - Monocart V8 Unified Coverage Report                                    │
         └───────────────────────────────────────────────────────────────────────────┘
```

1. **Local Test Harness Page (`tests/fixtures/github-markdown-page.html`)**:
   - A hermetic, standalone HTML test document served by `localMockServer.ts` mimicking GitHub's `.markdown-body` container and paragraph layout (`github.com/md-comments/md-test/blob/main/README.md`).
2. **Dedicated Playwright Specs (1:1 per Feature Category)**:
   - Grouped into 10 structured, granular spec suites covering all 34 features with Allure annotations (`allure.epic`, `allure.feature`, `allure.story`, `test.step()`).
3. **Docs-as-Code Knowledge Graph Sync**:
   - Every feature in `quality/features/**/*.md` will update its `verifiedIn` array to point directly to its corresponding `tests/e2e/<category>.spec.ts` suite.
   - Verified by `tests/qualityGraph.test.ts`.

---

## 3. Where and How to Review Results & Details After Execution

After running the suites, you can inspect the full execution results, traces, and coverage across multiple interactive dashboards:

### 1. Interactive Allure HTML Drill-Down Dashboard

- **File Path**: `coverage/allure-report/index.html`
- **How to Generate & Open**:
  ```bash
  pnpm test:report
  npx serve coverage/allure-report
  ```
- **What You Can Review**:
  - **Hierarchical Drill-Down**: Categorized by Pillar / Epic (Auth, Anchoring, Comments, etc.) -> Feature (`FEAT-COMM-INLINE`, etc.) -> Story -> Test Steps.
  - **Step Timeline**: Precise timestamps and pass/fail status for each `test.step()` action (e.g. "Hover over paragraph gutter", "Type markdown in textarea").
  - **Attachments**: Error stack traces, console messages, and auto-captured failure screenshots.

### 2. Playwright Interactive Trace Viewer & HTML Report

- **File Path**: `playwright-report/index.html`
- **How to Open**:
  ```bash
  npx playwright show-report
  ```
- **Trace Viewer**:
  ```bash
  npx playwright show-trace test-results/<test-dir>/trace.zip
  ```
- **What You Can Review**:
  - Full DOM snapshot recording for every user action.
  - Step-by-step playback with visual screencasts of the browser extension in action.
  - Network request logs, console outputs, and element selector inspection.

### 3. Consolidated 100% Code Coverage Dashboard

- **File Path**: `coverage/consolidated/index.html`
- **Console Summary**: Printed in terminal via `pnpm coverage:consolidate`
- **Markdown Report**: `coverage/consolidated/summary.md`
- **What You Can Review**:
  - Unified coverage across statements, branches, functions, and lines.
  - Granular line-by-line coverage for `shared/` core modules and `chrome-extension/src/` content scripts.

### 4. Docs-as-Code Quality Knowledge Graph Validation

- **Command**: `pnpm test tests/qualityGraph.test.ts`
- **JSON Dataset**: `.velite/features.json`
- **What You Can Review**:
  - Asserts that 100% of the 34 features are mapped to valid, existing test files.
  - Verifies dependency graph consistency and architectural invariant enforcement.

---

## 4. Feature Coverage Matrix (All 34 Features)

| Category          | Feature ID            | Feature Title                         | Dedicated Playwright Test Suite   |
| ----------------- | --------------------- | ------------------------------------- | --------------------------------- |
| **Auth**          | `FEAT-AUTH-DEVICE`    | OAuth Device Flow RFC 8628            | `tests/e2e/auth.spec.ts`          |
|                   | `FEAT-AUTH-IDE`       | IDE Native Session Provider           | `tests/e2e/auth.spec.ts`          |
|                   | `FEAT-AUTH-HYDRATE`   | User Profile & Permission Hydration   | `tests/e2e/auth.spec.ts`          |
|                   | `FEAT-AUTH-RATELIMIT` | Rate Limit 403 Countdown              | `tests/e2e/auth.spec.ts`          |
|                   | `FEAT-AUTH-SIGNOUT`   | Credential Purge & State Reset        | `tests/e2e/auth.spec.ts`          |
| **Anchoring**     | `FEAT-ANCH-HASH`      | Deterministic Paragraph Hashing       | `tests/e2e/anchoring.spec.ts`     |
|                   | `FEAT-ANCH-RELOCATE`  | Fuzzy Anchor Relocation               | `tests/e2e/anchoring.spec.ts`     |
|                   | `FEAT-ANCH-ORPHAN`    | Orphan Comment Tray & Relocation      | `tests/e2e/anchoring.spec.ts`     |
|                   | `FEAT-ANCH-COMPLEX`   | Tables, Fences, Quotes Anchoring      | `tests/e2e/anchoring.spec.ts`     |
| **Comments**      | `FEAT-COMM-INLINE`    | Inline Gutter Comment Creation        | `tests/e2e/comments.spec.ts`      |
|                   | `FEAT-COMM-PAGE`      | Whole-Document Page Comments          | `tests/e2e/comments.spec.ts`      |
|                   | `FEAT-COMM-EDIT`      | In-Place Comment Editing & Versions   | `tests/e2e/comments.spec.ts`      |
|                   | `FEAT-COMM-DELETE`    | Comment Deletion & Schema Update      | `tests/e2e/comments.spec.ts`      |
|                   | `FEAT-COMM-TOOLBAR`   | Bold/Italic/Code Toolbar Formatting   | `tests/e2e/comments.spec.ts`      |
|                   | `FEAT-COMM-PREVIEW`   | Live Markdown Preview Rendering       | `tests/e2e/comments.spec.ts`      |
| **Threads**       | `FEAT-THRD-REPLY`     | Threaded Replies Hierarchy            | `tests/e2e/threads.spec.ts`       |
|                   | `FEAT-THRD-RESOLVE`   | Thread Resolve & Reopen Lifecycle     | `tests/e2e/threads.spec.ts`       |
|                   | `FEAT-THRD-FILTER`    | Filter Open vs Resolved Threads       | `tests/e2e/threads.spec.ts`       |
| **Reactions**     | `FEAT-REAC-TOGGLE`    | Emoji Reactions Optimistic UI         | `tests/e2e/reactions.spec.ts`     |
|                   | `FEAT-REAC-TOOLTIP`   | Reaction Tooltip & Deduplication      | `tests/e2e/reactions.spec.ts`     |
| **Mentions**      | `FEAT-MENT-DROPDOWN`  | @ Collaborator Autocomplete           | `tests/e2e/mentions.spec.ts`      |
|                   | `FEAT-MENT-KEYBOARD`  | Keyboard Arrows & Tab Insertion       | `tests/e2e/mentions.spec.ts`      |
| **Notifications** | `FEAT-NOTF-POLL`      | Notification Sync & Tray Count        | `tests/e2e/notifications.spec.ts` |
|                   | `FEAT-NOTF-JUMP`      | Anchor Deep-Linking & Jump Scroll     | `tests/e2e/notifications.spec.ts` |
| **DOM**           | `FEAT-DOMI-BLOB`      | GitHub Markdown Blob Injection        | `tests/e2e/dom.spec.ts`           |
|                   | `FEAT-DOMI-PRDIFF`    | GitHub PR Diff View Mounting          | `tests/e2e/dom.spec.ts`           |
|                   | `FEAT-DOMI-FAB`       | Persistent Floating Action Button     | `tests/e2e/dom.spec.ts`           |
|                   | `FEAT-DOMI-DRAWER`    | Responsive Collapsible Comment Drawer | `tests/e2e/dom.spec.ts`           |
|                   | `FEAT-DOMI-TURBO`     | SPA Turbo Soft Navigation Re-bind     | `tests/e2e/dom.spec.ts`           |
| **Storage**       | `FEAT-STOR-GITREF`    | refs/md-comments/data Git Storage     | `tests/e2e/storage.spec.ts`       |
|                   | `FEAT-STOR-RETRY`     | 3-Way Merge Auto-Retry on Conflict    | `tests/e2e/storage.spec.ts`       |
|                   | `FEAT-STOR-LOCAL`     | .comments.json Local File Fallback    | `tests/e2e/storage.spec.ts`       |
| **Security**      | `FEAT-SECU-XSS`       | DOMPurify XSS Sanitization            | `tests/e2e/security.spec.ts`      |
|                   | `FEAT-SECU-CSP`       | Content Security Policy Compliance    | `tests/e2e/security.spec.ts`      |

---

## 5. Mandatory Authentication Invariant (`INV-NO-PAT`)

In accordance with project security standards:

- All browser extension tests operate strictly via OAuth mock sessions (`chrome.storage.local.set({ oauth_token, github_user })`) or OAuth Device Authorization endpoints.
- No test may configure or prompt for Personal Access Tokens (PAT).

---

## 6. Implementation Milestones

### Milestone 1: Local Test Harness Page & Mock Server Routing

- Create `tests/fixtures/github-markdown-page.html` with realistic `.markdown-body`, paragraph elements, code fences, and tables.
- Update `tests/mocks/localMockServer.ts` to serve this page and mock GitHub asset routes.

### Milestone 2: Auth & Anchoring Playwright Suites

- Implement `tests/e2e/auth.spec.ts` covering `FEAT-AUTH-DEVICE`, `FEAT-AUTH-IDE`, `FEAT-AUTH-HYDRATE`, `FEAT-AUTH-RATELIMIT`, `FEAT-AUTH-SIGNOUT`.
- Implement `tests/e2e/anchoring.spec.ts` covering `FEAT-ANCH-HASH`, `FEAT-ANCH-RELOCATE`, `FEAT-ANCH-ORPHAN`, `FEAT-ANCH-COMPLEX`.

### Milestone 3: Comments & Threads Playwright Suites

- Implement `tests/e2e/comments.spec.ts` covering `FEAT-COMM-INLINE`, `FEAT-COMM-PAGE`, `FEAT-COMM-EDIT`, `FEAT-COMM-DELETE`, `FEAT-COMM-TOOLBAR`, `FEAT-COMM-PREVIEW`.
- Implement `tests/e2e/threads.spec.ts` covering `FEAT-THRD-REPLY`, `FEAT-THRD-RESOLVE`, `FEAT-THRD-FILTER`.

### Milestone 4: Reactions, Mentions & Notifications Suites

- Implement `tests/e2e/reactions.spec.ts` covering `FEAT-REAC-TOGGLE`, `FEAT-REAC-TOOLTIP`.
- Implement `tests/e2e/mentions.spec.ts` covering `FEAT-MENT-DROPDOWN`, `FEAT-MENT-KEYBOARD`.
- Implement `tests/e2e/notifications.spec.ts` covering `FEAT-NOTF-POLL`, `FEAT-NOTF-JUMP`.

### Milestone 5: DOM Injection, Storage & Security Suites

- Implement `tests/e2e/dom.spec.ts` covering `FEAT-DOMI-BLOB`, `FEAT-DOMI-PRDIFF`, `FEAT-DOMI-FAB`, `FEAT-DOMI-DRAWER`, `FEAT-DOMI-TURBO`.
- Implement `tests/e2e/storage.spec.ts` covering `FEAT-STOR-GITREF`, `FEAT-STOR-RETRY`, `FEAT-STOR-LOCAL`.
- Implement `tests/e2e/security.spec.ts` covering `FEAT-SECU-XSS`, `FEAT-SECU-CSP`.

### Milestone 6: Docs-as-Code Feature Graph Alignment & Verification

- Update `verifiedIn` mappings in all 34 `quality/features/**/*.md` files.
- Run `pnpm quality:build && pnpm test tests/qualityGraph.test.ts` to assert 100% test file mapping.
- Execute full test suite `pnpm test && pnpm test:e2e && pnpm test:report && pnpm coverage:consolidate`.
