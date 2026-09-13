---
title: "Data Flow Diagrams (D2 + ELK)"
description: "Multi-level Data Flow Diagrams for processes P1-P6 and Git ref storage pipelines."
---

### DFD Level 0: System Context (D2 + ELK)
<p><img src="/architecture/architecture/d2/dfd-level-0-context.svg" alt="DFD Level 0 System Context" class="sl-diagram-clickable" loading="lazy" /></p>

### DFD Level 1: Subsystem Data Flows P1-P6 (D2 + ELK)
<p><img src="/architecture/architecture/d2/dfd-level-1-subsystems.svg" alt="DFD Level 1 Subsystems" class="sl-diagram-clickable" loading="lazy" /></p>

### DFD Level 2: Git Ref & Base Tree SHA Pipeline (D2 + ELK)
<p><img src="/architecture/architecture/d2/dfd-level-2-storage.svg" alt="DFD Level 2 Storage Pipeline" class="sl-diagram-clickable" loading="lazy" /></p>

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

This document specifies the Data Flow Diagrams across the Markdown Comments ecosystem. The authoritative D2 models configured with the Eclipse Layout Kernel (`layout-engine: elk`) are maintained in [`dfd/`](./dfd/).

---

## 1. DFD Level 0: System Context

The Level 0 Data Flow Diagram models the macro-level boundary between human contributors, AI agents, external Git/GitHub infrastructure, and the core processing engine.

```mermaid
flowchart LR
  Author[("Document Author")]
  Reviewer[("PR Reviewer")]
  Engine(("Markdown Comments\nCore Processing Engine"))
  GitHub[("GitHub REST & GraphQL API")]
  GitRemote[("Git Remote Repository\n(refs/md-comments/data)")]
  OTel[("OpenTelemetry Collector")]

  Author -->|1. Markdown selection & draft comments| Engine
  Engine -->|2. In-situ badges, cards & FAB drawer| Author

  Reviewer -->|3. Review replies & reactions| Engine
  Engine -->|4. Anchored comment threads| Reviewer

  Engine -->|5. Device Flow & Tree SHA queries| GitHub
  GitHub -->|6. Tokens, user profiles & commit metadata| Engine

  Engine -->|7. Versioned YAML commits| GitRemote
  GitRemote -->|8. Pull remote comments| Engine

  Engine -->|9. PII-scrubbed telemetry spans| OTel
```

### Source Model

- File: [`dfd-level-0-context.d2`](./dfd/dfd-level-0-context.d2)
- Engine: `layout-engine: elk`

---

## 2. DFD Level 1: Subsystems Data Flow

The Level 1 DFD decomposes the central processing engine into six discrete processes (**P1** through **P6**) interacting with three persistent and in-memory data stores (**D1**, **D2**, **D3**).

```mermaid
flowchart TD
  subgraph Entities["External Entities"]
    User["Document Author / Reviewer"]
    GitHub["GitHub REST & GraphQL API"]
    Remote["Git Remote Host"]
    OTel["OpenTelemetry Collector"]
  end

  subgraph Stores["Data Stores"]
    D1[("D1: In-Memory Optimistic Store\n(Tombstones, Staged Mutations)")]
    D2[("D2: Workspace & Local Storage\n(Cached Threads, Auth State)")]
    D3[("D3: Git Ref Object Store\n(refs/md-comments/data)")]
  end

  subgraph Processes["Core Subsystem Processes"]
    P1(("P1: Text Selection &\nAnchor Generation\n(FNV-1a Hash)"))
    P2(("P2: Comment & Thread\nLifecycle Manager\n(Modal Delete, Reply)"))
    P3(("P3: Optimistic Cache &\nIn-Place DOM Sync\n(earlyHook.js)"))
    P4(("P4: Git Ref Serialization\n& Tree SHA Pipeline\n(Base Tree SHA)"))
    P5(("P5: Multi-Tier Identity &\nDevice Flow Auth\n(RFC 8628)"))
    P6(("P6: Telemetry Sanitization\n& Proxy Ingestion\n(Killswitch)"))
  end

  User -->|Select text| P1
  P1 -->|Anchor snapshot & FNV-1a| P2
  User -->|Add / Reply / React| P2
  User -->|Confirm modal deletion| P2
  P2 -->|Stage mutation| D1
  D1 -->|State delta| P3
  P3 -->|Patch DOM in-place without reload| User

  D1 -->|Drain staged mutations| P4
  P4 -->|Query commit tree.sha| GitHub
  GitHub -->|Base tree SHA| P4
  P4 -->|Write tree & commit| D3
  D3 -->|Fast-forward push| Remote

  User -->|Trigger login| P5
  P5 -->|Device flow RFC 8628| GitHub
  GitHub -->|Auth token & profile| P5
  P5 -->|Persist auth flag| D2
  P5 -->|Auth credentials| P4

  P2 -->|User interaction events| P6
  P6 -->|Anonymized OTLP spans| OTel
```

### Process Specifications

1. **P1: Text Selection & Anchor Generation**:
   - Captures selected text range, line numbers, and context windows (preceding and trailing 3 lines).
   - Computes a deterministic 32-bit FNV-1a hash of the normalized content.
2. **P2: Comment & Thread Lifecycle Management**:
   - Handles comment authoring, thread replies, emoji reactions, resolution toggles, and thread deletions.
   - For thread deletions, coordinates with in-preview modal confirmation to prevent accidental loss (`INV-MODAL-CONFIRMATION`).
3. **P3: Optimistic Cache & In-Place DOM Synchronization**:
   - Hooks into webview lifecycle early via `earlyHook.js`, polyfilling `poster` and queuing dispatches.
   - Performs surgically targeted DOM updates in `preview-webview.js` without reloading the document DOM (`INV-IN-PLACE-PREVIEW`).
   - Applies strict text-equality checks before mutating badge counters, eliminating recursive MutationObserver loops (`INV-MUTATION-GUARD`).
4. **P4: Git Ref Serialization & Tree SHA Pipeline**:
   - Formats thread entities as human-readable YAML.
   - Queries `GET /git/commits/:sha` to retrieve the parent commit's base tree SHA (`INV-BASE-TREE-SHA`).
   - Creates Git tree and commit objects and updates `refs/md-comments/data` with 3-way merge and fast-forward retries (`INV-FAST-FORWARD-RETRY`).
5. **P5: Multi-Tier Identity & RFC 8628 Device Flow**:
   - Resolves credentials along a 6-tier fallback chain: Session $\to$ `context.secrets` $\to$ `globalState` $\to$ `process.env` $\to$ `gh` CLI $\to$ Device Code Flow.
   - Persists state in `globalState` and broadcasts `onDidChangeAuthState` (`INV-AUTH-PERSISTENCE`).
6. **P6: Telemetry Sanitization & Proxy Ingestion**:
   - Scrubs all PII, document text, and file paths (`INV-ZERO-CUSTOMER-DATA`).
   - Operates with zero client secrets (`INV-ZERO-CLIENT-SECRETS`) and halts immediately if disabled (`INV-TELEMETRY-KILLSWITCH`).

### Source Model

- File: [`dfd-level-1-subsystems.d2`](./dfd/dfd-level-1-subsystems.d2)
- Engine: `layout-engine: elk`

---

## 3. DFD Level 2: Storage & Ref Pipeline

The Level 2 DFD details the exact sequence of data transformations and GitHub Git Data API calls required to persist comment threads without corrupting orphan commit trees.

```mermaid
sequenceDiagram
  autonumber
  participant Caller as Comment Store / Optimistic Store
  participant Serializer as P4.1: YAML Serializer & Filter
  participant RefLookup as P4.2: Ref Head Resolver
  participant TreeResolver as P4.3: Base Tree SHA Resolver
  participant TreeBuilder as P4.4: Git Tree Builder
  participant CommitCreator as P4.5: Commit Creator
  participant RefUpdater as P4.6: Ref Head Updater
  participant GitHub as GitHub Git Data API
  participant Store as refs/md-comments/data

  Caller->>Serializer: 1. Raw thread or tombstone
  Serializer->>TreeBuilder: 2. Formatted YAML blobs

  Caller->>RefLookup: 3. Target repository & branch ref
  RefLookup->>GitHub: 4. GET /git/ref/heads/refs/md-comments/data
  GitHub-->>RefLookup: 5. Parent Commit SHA (or 404)

  RefLookup->>TreeResolver: 6. Parent Commit SHA
  TreeResolver->>GitHub: 7. GET /git/commits/:parent_sha (INV-BASE-TREE-SHA)
  GitHub-->>TreeResolver: 8. commitData.tree.sha (Base Tree SHA)

  TreeResolver->>TreeBuilder: 9. base_tree = commitData.tree.sha
  TreeBuilder->>GitHub: 10. POST /git/trees { base_tree, tree: [blobs] }
  GitHub-->>TreeBuilder: 11. Created Tree SHA

  TreeBuilder->>CommitCreator: 12. Tree SHA + Parent Commit SHA
  CommitCreator->>GitHub: 13. POST /git/commits { tree, parents: [parentSha], message }
  GitHub-->>CommitCreator: 14. Created Commit SHA

  CommitCreator->>RefUpdater: 15. New Commit SHA
  RefUpdater->>GitHub: 16. PATCH /git/refs/heads/... { sha, force: false }
  GitHub-->>RefUpdater: 17. 200 OK (or 409 Conflict -> Retry with 3-Way Merge)
  RefUpdater->>Store: 18. Updated ref pointing to latest commit
```

### Critical Storage Invariants

- **Base Tree SHA Resolution (`INV-BASE-TREE-SHA`)**: The GitHub Git Data API requires `base_tree` to be the SHA of a **Tree** object, not a Commit object. Passing a commit SHA generates an unrecoverable `422 Unprocessable Entity`. The pipeline queries `GET /git/commits/:sha` and extracts `data.tree.sha`.
- **Fast-Forward Conflict Resolution (`INV-FAST-FORWARD-RETRY`)**: If concurrent updates produce a `409 Conflict` during `PATCH /git/refs/...`, the system performs a three-way merge against the newly advanced remote ref with exponential jittered backoff.

### Source Model

- File: [`dfd-level-2-storage.d2`](./dfd/dfd-level-2-storage.d2)
- Engine: `layout-engine: elk`