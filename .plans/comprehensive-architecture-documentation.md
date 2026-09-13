# Comprehensive Project Architecture Documentation & Maintenance Skill Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Markdown Comments is a multi-platform, local-first documentation review and commenting system for Markdown files. It enables engineers, reviewers, and AI agents to collaborate with zero inline HTML pollution by storing comment threads outside source branches (in `refs/md-comments/data` or local sidecar stores) while rendering seamless visual commentary across:

- **VS Code Extension** (`vscode-extension`) with native preview integration, synchronous early bootstrap hooking (`earlyHook.js`), in-place DOM patching, multi-tiered authentication resolution, and resilient optimistic actions.
- **Cross-Browser Extension** (`chrome-extension` targeting Chrome, Microsoft Edge, Mozilla Firefox, Opera) with zero-PAT OAuth Device Flow (`INV-OAUTH-ONLY`).
- **macOS Safari Extension** (`safari-extension`) with native AppKit/Safari Web Extension container.
- **Obsidian Plugin** (`obsidian-plugin`) with reading view and live preview gutter anchors.
- **Astro / Starlight Theme Plugin** (`starlight-plugin` + `demo-astro`) with client-side interactive comment drawer.
- **Zero-Secret Telemetry Proxy & Terraform Cloud Infrastructure** (`infrastructure/`).
- **Core Domain Engine & Storage Abstractions** (`shared/`) including GitHub orphan ref tree-SHA resolution and three-way merging.

This plan establishes a comprehensive, living architecture documentation suite powered by:

1. **LikeC4** as the Architecture-as-Code modeling toolchain for the complete C4 model suite (System Context, Containers, Subsystem Components, Code & Data Structs, Views, and Interactive Visualization), capturing all recent native preview runtime, optimistic stores, author resolution, and storage backend changes.
2. **D2 with the ELK (Eclipse Layout Kernel) engine** (`layout-engine: elk`) for declarative, orthogonal-routed Data Flow Diagrams (DFD Level 0, Level 1, Level 2) and Component Integration topology.
3. **Mermaid & D2 Sequences** for key runtime interaction flows (Anchoring, Device Flow & Multi-Tier Auth, In-Place Optimistic Preview Sync, Sequential Deletion with In-Webview Confirmation, Base Tree SHA Git Ref Pipeline, 3-Way Merge, Telemetry Pipeline).
4. **Living Architecture Maintenance Skill & Automated Drift Defense** (`.agents/skills/architecture-docs/`, `/architecture-sync`, `scripts/verify-architecture-docs.mjs`, and `tests/architectureDocs.test.ts`) guaranteeing that architecture models stay synchronized with source code across all monorepo packages.

---

## Current State vs. Proposed Architecture

### Current State

- `docs/` contains isolated point guides (`AGENTIC_AI_WORKFLOWS.md`, `safari-extension-guide.md`, `starlight-plugin.md`).
- `README.md` at root functions primarily as an E2E test fixture.
- System models, invariants, and recent VS Code preview optimizations are dispersed across `quality/invariants/*.md`, `shared/types.ts`, `vscode-extension/media/*`, and unpushed commits (`68197eb`, `a2d8088`, `47131ac`, `d7de353`, `75a5902`, `9b76e33`, `837c3f7`, `841c562`, `fcb09a2`, `d323a03`, `cd7485a`, `effe754`, `74a9bf0`, `1e5c0da`, `c6dd5b4`, `11efb35`, `04ec294`, `9335e91`).
- No unified LikeC4 model files, no D2 with ELK dataflow models, and no automated architecture drift verification exist.

### Proposed Architecture & Diagramming Stack

| Documentation Layer                                             | Tool / Standard    | Engine / Layout                | Artifact Location                             | Output / Visual Embed                                        |
| :-------------------------------------------------------------- | :----------------- | :----------------------------- | :-------------------------------------------- | :----------------------------------------------------------- |
| **C4 Architecture Model** (Context, Container, Component, Code) | **LikeC4** (`.c4`) | LikeC4 Engine                  | `docs/architecture/c4/model.c4`               | Interactive LikeC4 views, SVG export, `c4-architecture.md`   |
| **Data Flow Diagrams** (DFD L0, L1, L2)                         | **D2** (`.d2`)     | **ELK** (`layout-engine: elk`) | `docs/architecture/dfd/*.d2`                  | SVG renders with orthogonal routing, `data-flow-diagrams.md` |
| **Components Integration**                                      | **D2** (`.d2`)     | **ELK** (`layout-engine: elk`) | `docs/architecture/components-integration.d2` | Package dependency & IPC matrix, `components-integration.md` |
| **Sequence Diagrams**                                           | Mermaid & D2       | Native sequence renderers      | `docs/architecture/sequence-diagrams.md`      | Interactive sequence charts embedded in markdown             |
| **Invariants & ADRs**                                           | Markdown           | GFM                            | `docs/architecture/invariants-and-adrs.md`    | Codified ADRs and 14 system invariants                       |
| **Architecture Entry Point**                                    | Markdown           | GFM                            | `docs/architecture/README.md`                 | Master index, architecture principles, and links             |

### Directory Layout

```
docs/architecture/
├── README.md                          # Master overview, principles, and index
├── c4-architecture.md                 # C4 documentation embedding LikeC4 models & views
├── components-integration.md          # Multi-package integration matrix & communication
├── sequence-diagrams.md               # Interactive sequence diagrams for all core workflows
├── data-flow-diagrams.md              # DFD documentation embedding D2 (ELK) diagrams
├── invariants-and-adrs.md             # Formal invariants (INV-*) and Architectural Decision Records
├── c4/
│   ├── model.c4                       # LikeC4 architecture model (Context, Containers, Components)
│   └── views.c4                       # LikeC4 views (Context, Container, Subsystem Component views)
└── dfd/
    ├── dfd-level-0-context.d2         # D2 (ELK) System Context Data Flow Diagram
    ├── dfd-level-1-subsystems.d2      # D2 (ELK) Subsystem Data Flow Diagram
    └── dfd-level-2-storage.d2         # D2 (ELK) Storage & Ref Pipeline Data Flow Diagram
```

---

## LikeC4 Model Specification (`docs/architecture/c4/`)

LikeC4 provides precise, type-checked architecture models covering both core subsystems and recent runtime enhancements:

1. **Specification Layer (`specification`)**:
   - Elements: `person`, `softwareSystem`, `container`, `component`, `datastore`, `webview`, `proxy`.
   - Tags: `#localFirst`, `#gitNative`, `#securitySensitive`, `#crossBrowser`, `#telemetry`, `#optimisticUi`, `#inPlaceDom`.

2. **Model Layer (`model`)**:
   - **Actors**: `reviewer`, `author`, `aiAgent`.
   - **External Systems**: `githubApi`, `gitRemote`, `otelBackend`, `browserRegistries`.
   - **Software System (`mdComments`)**:
     - **Container `vscodeExt`**:
       - Component `authManager`: Multi-tier token resolver (Session -> `context.secrets` -> `globalState` -> `process.env` -> `gh` CLI -> RFC 8628 Device Flow) and `onDidChangeAuthState` event bus.
       - Component `authorResolver`: Git config identity extraction (`user.name`/`user.email`) + GitHub user profile resolver with display name formatting and cache.
       - Component `optimisticStore`: In-memory optimistic mutation store supporting resilient sequential deletions, inline edits, and instant toggle reactions.
       - Component `commentStore`: Workspace-level persistent comment store synchronizing local state with `refs/md-comments/data`.
       - Component `commentActions`: Action dispatch handler executing comment additions, replies, edits, reactions, and deletions without disruptive toasts.
       - Component `commentPreviewPanel` & `markdownItPlugin`: Native markdown preview decorator and custom URI handler (`vscode://...`).
     - **Container `webviewPreview`**:
       - Component `earlyHook`: Synchronous pre-bootstrap hook (`earlyHook.js`) caching `acquireVsCodeApi()`, polyfilling `poster`, and queueing action dispatches prior to module execution.
       - Component `inplaceDomUpdater`: In-place DOM patcher (`preview-webview.js`, `preview.js`) updating comment cards, badges, and threads without reloading markdown document DOM.
       - Component `confirmationModal`: In-webview confirmation modal (`showConfirmationModal`) providing resilient deletion approval without disruptive native input boxes.
       - Component `mutationGuard`: Debounced MutationObserver with strict text content equality checks guarding badge counters against recursive 100% CPU loops (`INV-MUTATION-GUARD`).
       - Component `inlineAnchors`: Document text anchor highlighter and floating MD FAB drawer widget.
     - **Container `chromeExt`**: Manifest V3 extension, background service worker, device auth (`INV-OAUTH-ONLY`), content script overlay.
     - **Container `safariExt`**: Native macOS Safari extension container.
     - **Container `obsidianPlugin`**: Obsidian Vault plugin, reading view, live preview gutters, sidebar.
     - **Container `starlightPlugin`**: Astro / Starlight documentation theme plugin, client drawer, DOM anchors.
     - **Container `sharedEngine`**:
       - Component `anchorEngine`: FNV-1a hash anchoring and normalized fuzzy search cascade.
       - Component `gitRefBackend`: Git Data API orphan ref backend with base tree SHA resolution (`GET /git/commits/:sha` -> `tree.sha`), 3-way merge, and commit comment notifications.
       - Component `localFileBackend`: Local sidecar YAML backend for non-git environments.
     - **Container `telemetryProxy`**: Zero-secret OpenTelemetry sanitization proxy (`INV-ZERO-CLIENT-SECRETS`, `INV-ZERO-CUSTOMER-DATA`).
     - **Datastore `gitRefStorage`**: `refs/md-comments/data` versioned YAML comment store.

3. **Views Layer (`views`)**:
   - `view systemContext of mdComments`: High-level system context view.
   - `view containers of mdComments`: Multi-container topology.
   - `view vscodeInternals of vscodeExt`: Components of the VS Code extension subsystem including authManager, authorResolver, optimisticStore, and previewPanel.
   - `view previewInternals of webviewPreview`: Components of the webview preview runtime including earlyHook, inplaceDomUpdater, confirmationModal, and mutationGuard.
   - `view browserInternals of chromeExt`: Components of the browser extension subsystem.
   - `view sharedInternals of sharedEngine`: Anchoring, storage, sync, base tree SHA resolution, and mention algorithms.
   - `view starlightInternals of starlightPlugin`: Astro server and client-side components.
   - `view obsidianInternals of obsidianPlugin`: Obsidian workspace integration components.

---

## D2 with ELK Engine Specification (`docs/architecture/dfd/`)

All D2 diagrams will explicitly use the Eclipse Layout Kernel (ELK) layout engine:

```d2
vars: {
  d2-config: {
    layout-engine: elk
    theme: 200
  }
}
```

1. **DFD Level 0 - System Context (`dfd-level-0-context.d2`)**:
   - External entities: Document Author, Pull Request Reviewer, Git Remote, GitHub API, OpenTelemetry Ingestion.
   - Central process: Markdown Comments Core Processing Engine.
   - Data flows: Markdown text, comment entities, multi-tier auth tokens, git refs, base tree SHAs, sanitized telemetry events.

2. **DFD Level 1 - Subsystems Data Flow (`dfd-level-1-subsystems.d2`)**:
   - **Process 1 (P1)**: Text Selection & Anchor Generation (FNV-1a Hash + Context Window).
   - **Process 2 (P2)**: Comment & Thread Lifecycle Management (Draft, Post, Reply, Resolve, React, In-Webview Modal Confirmation, Resilient Sequential Deletion).
   - **Process 3 (P3)**: Optimistic Cache & In-Place DOM Synchronization (Synchronous `earlyHook.js` queueing, In-Place DOM patching without document reload, scroll/tab preservation, MutationObserver equality guard).
   - **Process 4 (P4)**: Git Ref Serialization & Tree SHA Pipeline (`GET /git/commits/:sha` -> `base_tree` SHA -> `POST /git/trees` -> `POST /git/commits` -> `PATCH /git/refs/...`).
   - **Process 5 (P5)**: Multi-Tier Identity & RFC 8628 OAuth Device Flow (Session -> `context.secrets` -> `globalState` -> `process.env` -> `gh` CLI -> Device Code Flow, with `onDidChangeAuthState` distribution).
   - **Process 6 (P6)**: Privacy-Preserving Telemetry Sanitization & Proxy Ingestion (`INV-ZERO-CLIENT-SECRETS`, `INV-TELEMETRY-KILLSWITCH`).
   - Data stores: `D1: In-Memory Optimistic Store`, `D2: Local Storage / Workspace Storage / Global State`, `D3: Git Ref Object (refs/md-comments/data)`.

3. **DFD Level 2 - Storage & Ref Pipeline (`dfd-level-2-storage.d2`)**:
   - Detailed data transformation: Comment Object -> In-Memory Staging -> JSON/YAML Serializer -> Ref SHA Resolution -> Base Tree SHA Resolution (`/git/commits/:sha`) -> Tree Object Creation with `base_tree` SHA -> Commit Object Creation -> Ref Update (`PATCH /refs/md-comments/data`) -> Push with Fast-Forward Retry.

---

## Sequence Diagrams Specification (`docs/architecture/sequence-diagrams.md`)

Interactive sequence diagrams covering the core lifecycles and recent runtime additions:

1. **Sequence 1: Text Selection, FNV-1a Hash Anchoring & Inline Comment Creation**:
   - User selection -> Anchor extraction -> Hash computation -> Optimistic card rendering -> Storage event.
2. **Sequence 2: Thread Reply, Reaction, Edit & In-Place Optimistic Preview Sync**:
   - Interaction -> `earlyHook.js` API interception -> Action dispatch -> Immediate in-place DOM update (zero page reload, tab/scroll preservation) -> MutationObserver equality check (`INV-MUTATION-GUARD`) -> Optimistic store dispatch -> Silent background persistence.
3. **Sequence 3: Multi-Tiered Authentication & Token Persistence Lifecycle**:
   - VS Code extension activation -> Session cache check -> `context.secrets` lookup -> `context.globalState` token flag check -> `process.env` tokens (`GITHUB_TOKEN`/`GH_TOKEN`) -> `gh auth token` fallback -> Interactive RFC 8628 Device Flow -> Global state persistence -> `onDidChangeAuthState` event emit -> Webview & TreeView update.
4. **Sequence 4: Git-Ref Tree & Commit Pipeline with Base Tree SHA Resolution** (`INV-BASE-TREE-SHA`):
   - Ref fetch -> Parent commit SHA retrieval -> Base tree SHA query (`GET /git/commits/:sha`) -> Tree creation (`POST /git/trees` with `base_tree: baseTreeSha`) -> Commit creation (`POST /git/commits`) -> Ref update (`PATCH /git/refs/...`) -> Fallback commit comment notification for @mentions.
5. **Sequence 5: Resilient Comment Deletion & In-Preview Modal Confirmation Flow** (`INV-MODAL-CONFIRMATION`):
   - User clicks delete -> Card navigation click blocked (`stopPropagation`) -> In-webview confirmation modal rendered (`showConfirmationModal`) -> User confirms -> Optimistic card removal / tombstone marking -> In-place DOM collapse without tab reset -> Backend ref deletion -> Concurrent sequential delete safety.
6. **Sequence 6: Markdown Mutation & Fuzzy Re-Anchoring Cascade**:
   - File edit -> Hash verification -> Exact match failure -> Normalized fuzzy match -> Levenshtein search -> Orphan recovery / user re-anchor alert.
7. **Sequence 7: Author Identity Resolution & Display Name Formatting**:
   - Comment author detection -> Git config extraction (`user.name`/`user.email`) -> GitHub API user resolution -> In-memory/workspace caching -> Formatted display name rendering aligned with VS Code typography.
8. **Sequence 8: Privacy-Preserving Telemetry Event Pipeline** (`INV-ZERO-CLIENT-SECRETS`, `INV-ZERO-CUSTOMER-DATA`, `INV-TELEMETRY-KILLSWITCH`):
   - Event trigger -> Client-side PII scrubbing -> Stack trace normalizer -> Telemetry Proxy relay -> OpenTelemetry Collector.

---

## Invariants & Architectural Decision Records (`docs/architecture/invariants-and-adrs.md`)

Codified system invariants including those established by recent optimizations:

1. **`INV-OAUTH-ONLY` / `INV-NO-PAT`**: The GitHub browser extension (`chrome-extension`) MUST NEVER permit Personal Access Tokens (PAT). Only frictionless OAuth Device Flow is permitted.
2. **`INV-FAST-FORWARD-RETRY`**: Concurrent updates to `refs/md-comments/data` must perform three-way merges with exponential backoff on push conflicts.
3. **`INV-ZERO-CLIENT-SECRETS`**: No client package may bundle client secrets. Telemetry and OAuth rely on proxy or public client IDs.
4. **`INV-ZERO-CUSTOMER-DATA`**: Telemetry payloads must never contain markdown contents, comment bodies, author names, or file paths.
5. **`INV-TELEMETRY-KILLSWITCH`**: Telemetry must respect `telemetry.enabled: false` and the global killswitch immediately.
6. **`INV-VISUAL-PARITY`**: Visual elements across VS Code preview, Chrome extension, Obsidian, and Starlight must maintain 100% aesthetic and typographic parity.
7. **`INV-XSS-SANITIZED`**: Comment bodies and rendered markdown tokens must be strictly sanitized before DOM injection.
8. **`INV-QUOTA-DEFENSE`**: Git API interactions must leverage cached tree lookups and conditional requests to protect GitHub rate limits.
9. **`INV-IN-PLACE-PREVIEW`**: Native preview comments must update in-place without reloading document DOM, preventing blank screen flicker, tab resets, and scroll jumping.
10. **`INV-MUTATION-GUARD`**: DOM badge and counter updates in preview must guard text assignments by equality to prevent MutationObserver recursive loops pegging the renderer.
11. **`INV-BASE-TREE-SHA`**: Git Data API tree creation must resolve and supply commit base tree SHA (`commitData.tree.sha`), not the commit object SHA.
12. **`INV-AUTH-PERSISTENCE`**: VS Code extension auth state persists across reloads via `context.globalState` and emits reactive `onDidChangeAuthState` events.
13. **`INV-MODAL-CONFIRMATION`**: High-impact actions like thread deletion in native preview use resilient in-preview modal confirmation rather than disruptive/blocking system prompts.
14. **`INV-SILENT-BG-REFRESH`**: Background synchronization must execute silently without disruptive toasts or UI focus stealing.

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### 1. New Tests to Create

- **`tests/architectureDocs.test.ts`**:
  - `it('verifies all monorepo packages in pnpm-workspace.yaml are modeled in LikeC4')`: Ensures no package is missing from `docs/architecture/c4/model.c4`.
  - `it('validates LikeC4 model and views syntax')`: Runs LikeC4 validation or parses `.c4` AST ensuring zero model errors.
  - `it('validates D2 diagrams and verifies layout-engine is set to elk')`: Parses all `.d2` files in `docs/architecture/dfd/` and `docs/architecture/components-integration.d2`, asserting `layout-engine: elk` is configured on each.
  - `it('verifies all 14 quality invariants are documented in invariants-and-adrs.md')`: Checks files in `quality/invariants/*.md` plus unpushed invariants against `docs/architecture/invariants-and-adrs.md`.
  - `it('verifies architecture maintenance skill and workflow exist and are registered')`: Validates `.agents/skills/architecture-docs/SKILL.md` and `.agents/workflows/architecture-sync.md`.
  - `it('verifies unpushed preview and auth components are covered in LikeC4 model')`: Asserts `earlyHook`, `inplaceDomUpdater`, `authorResolver`, `authManager`, and `optimisticStore` are defined in `model.c4`.

### 2. Existing Tests to Update & Coordinate

- **`tests/precommitConfig.test.ts`**:
  - Add test assertion verifying that architecture verification is included in repository quality checks.
- **Verification of Recent Unpushed Test Suites**:
  - Ensure all 8 new test suites introduced in recent commits are explicitly referenced in architecture documentation and knowledge graph mappings:
    - `tests/vscode-optimistic-actions.test.ts` (Optimistic additions, edits, reactions, deletes)
    - `tests/vscode-github-auth-persistence.test.ts` (GlobalState persistence, token fallback chain, event emitter)
    - `tests/vscode-author-display.test.ts` (Author resolution, Git config, GitHub API, formatting)
    - `tests/vscode-document-comments.test.ts` (Document-level comment rendering)
    - `tests/vscode-preview-infinite-loop.test.ts` (MutationObserver equality guard)
    - `tests/vscode-native-preview-actions.test.ts` (Native preview action dispatch)
    - `tests/gitRefBackend.test.ts` (Base tree SHA resolution)
    - `tests/e2e/vscode-real-repo-sequential-delete.spec.ts` (Real repository sequential delete resilience)
    - `tests/e2e/vscode-native-preview.spec.ts` & `tests/e2e/vscode-comment-preview.spec.ts` (In-place DOM updates & reload persistence)
    - `tests/e2e/fixtures/vscodeFixture.ts` (Pre-seeded confirmedExtensions & earlyHook)

### 3. Knowledge Graph & Velite Synchronization

- Add / update feature entries in `quality/features/`:
  - **`quality/features/architecture-documentation.md`**:
    - ID: `feat-architecture-documentation`
    - Flow: `FLOW-ARCH-DOCS-MAINTENANCE`
    - Invariants: `INV-VISUAL-PARITY`, `INV-ZERO-CLIENT-SECRETS`, `INV-OAUTH-ONLY`, `INV-IN-PLACE-PREVIEW`, `INV-MUTATION-GUARD`, `INV-BASE-TREE-SHA`, `INV-AUTH-PERSISTENCE`, `INV-MODAL-CONFIRMATION`
    - Interfaces: `["docs/architecture/*", "docs/architecture/c4/*", "docs/architecture/dfd/*", "scripts/verify-architecture-docs.mjs", ".agents/skills/architecture-docs/SKILL.md"]`
    - VerifiedIn: `["tests/architectureDocs.test.ts"]`
    - MinCoverage: 100
  - Update **`quality/features/ide/FEAT-IDE-PREVIEW.md`** to include `earlyHook.js`, `inlineAnchors.js`, `vscode-optimistic-actions.test.ts`, and `vscode-real-repo-sequential-delete.spec.ts`.
  - Update **`quality/features/auth/FEAT-AUTH-IDE.md`** to include `vscode-github-auth-persistence.test.ts` and `INV-AUTH-PERSISTENCE`.

---

## Milestones & Action Items

### Milestone 1: LikeC4 Architecture Model & Views Creation

- [ ] **Task 1.1**: Create `docs/architecture/c4/model.c4`
  - Define full specification (elements, tags, relationships).
  - Model actors, external systems, and software system `mdComments`.
  - Model container `vscodeExt` with components (`authManager`, `authorResolver`, `optimisticStore`, `commentStore`, `commentActions`, `commentPreviewPanel`, `markdownItPlugin`).
  - Model container `webviewPreview` with components (`earlyHook`, `inplaceDomUpdater`, `confirmationModal`, `mutationGuard`, `inlineAnchors`).
  - Model containers `chromeExt`, `safariExt`, `obsidianPlugin`, `starlightPlugin`, `telemetryProxy`.
  - Model container `sharedEngine` with components (`anchorEngine`, `gitRefBackend` with base tree SHA resolver, `localFileBackend`).
  - Model datastore `gitRefStorage` (`refs/md-comments/data`).
- [ ] **Task 1.2**: Create `docs/architecture/c4/views.c4`
  - Define Context View, Container View, Subsystem Component Views (`vscodeInternals`, `previewInternals`, `browserInternals`, `sharedInternals`, `starlightInternals`, `obsidianInternals`).
- [ ] **Task 1.3**: Create `docs/architecture/c4-architecture.md`
  - C4 documentation guide explaining the 4 levels, modeling decisions, and embedding LikeC4 models and views.

### Milestone 2: D2 (ELK Engine) Data Flow & Component Integration Diagrams

- [ ] **Task 2.1**: Create `docs/architecture/dfd/dfd-level-0-context.d2`
  - D2 Level 0 DFD with `layout-engine: elk`.
- [ ] **Task 2.2**: Create `docs/architecture/dfd/dfd-level-1-subsystems.d2`
  - D2 Level 1 DFD covering P1 through P6 with `layout-engine: elk`, incorporating in-place DOM patching, modal confirmation, sequential deletion resilience, multi-tier auth, and tree SHA querying.
- [ ] **Task 2.3**: Create `docs/architecture/dfd/dfd-level-2-storage.d2`
  - D2 Level 2 DFD showing the Git Ref storage serialization pipeline with base tree SHA resolution (`/git/commits/:sha`) and fast-forward retry with `layout-engine: elk`.
- [ ] **Task 2.4**: Create `docs/architecture/components-integration.d2`
  - D2 Component Integration topology diagram with `layout-engine: elk`, mapping IPC, webview messaging, earlyHook bridging, and git ref sync.
- [ ] **Task 2.5**: Create `docs/architecture/data-flow-diagrams.md` and `docs/architecture/components-integration.md`
  - Markdown documents detailing the DFDs and component integration with rendered diagrams and descriptions.

### Milestone 3: High-Level Architecture, Sequences & Invariants Documentation

- [ ] **Task 3.1**: Create `docs/architecture/README.md`
  - Master architecture overview, decentralization principles, clean markdown guarantee, and index.
- [ ] **Task 3.2**: Create `docs/architecture/sequence-diagrams.md`
  - 8 comprehensive sequence diagrams (Anchoring, In-Place Optimistic Preview Sync, Multi-Tier Auth & Persistence, Base Tree SHA Git Ref Pipeline, Resilient Deletion & In-Preview Modal, Markdown Mutation, Author Identity Resolution, Telemetry).
- [ ] **Task 3.3**: Create `docs/architecture/invariants-and-adrs.md`
  - Codify the 14 system invariants and key Architectural Decision Records.

### Milestone 4: Living Architecture Maintenance Agent Skill & Workflow

- [ ] **Task 4.1**: Create `.agents/skills/architecture-docs/SKILL.md`
  - Agent skill instructing coding agents on how to maintain LikeC4 models, D2 diagrams, and architecture docs.
- [ ] **Task 4.2**: Create `.agents/workflows/architecture-sync.md`
  - Slash command `/architecture-sync` workflow.
- [ ] **Task 4.3**: Update `.agents/skills/pre-commit-checks/SKILL.md`
  - Add architecture documentation verification step.

### Milestone 5: Automated Verification Harness & Test Verification

- [ ] **Task 5.1**: Create `scripts/verify-architecture-docs.mjs`
  - Validates LikeC4 model files, D2 files (confirming ELK layout engine), package parity, component parity (including preview runtime and auth), and invariant coverage.
- [ ] **Task 5.2**: Create `tests/architectureDocs.test.ts`
  - Vitest test suite executing doc checks and verification scripts.
- [ ] **Task 5.3**: Register features in `quality/features/` and rebuild quality graph (`pnpm quality:build`).
- [ ] **Task 5.4**: Run `pnpm test` and `pnpm lint` to confirm 100% green status and no regressions across all unit and E2E suites.
