---
name: architecture-docs
description: >
  Living Architecture Maintenance Skill. Instructs agents on how to maintain, update, and synchronize LikeC4 models, D2 (ELK) diagrams, invariants, and architecture documentation whenever codebase features or structures change.
  Triggers on "architecture", "update architecture", "likec4", "d2 diagram", "document architecture", "/architecture-sync", or when adding new packages, components, or invariants.
---

# Living Architecture Documentation & Drift Defense Skill

This skill guides agents and engineers on maintaining the Living Architecture Documentation suite for Markdown Comments. Whenever codebase architecture, monorepo packages, preview runtime mechanics, authentication flows, or invariants evolve, this skill ensures that the architectural models remain 100% synchronized with source code.

---

## 1. Architecture Files & Responsibilities

| Path                                          | Format / Tool          | Purpose & Maintenance Rules                                                                           |
| :-------------------------------------------- | :--------------------- | :---------------------------------------------------------------------------------------------------- |
| `docs/architecture/README.md`                 | Markdown               | Master architectural principles, layer overview, index                                                |
| `docs/architecture/c4/model.c4`               | LikeC4                 | Complete C4 model (Context, Containers, Components). Must model all packages in `pnpm-workspace.yaml` |
| `docs/architecture/c4/views.c4`               | LikeC4                 | C4 views (System Context, Container, Component drill-downs)                                           |
| `docs/architecture/c4-architecture.md`        | Markdown               | C4 guide explaining the 4 levels and embedding model excerpts                                         |
| `docs/architecture/dfd/*.d2`                  | D2 (ELK)               | DFD Level 0, Level 1, Level 2. **Must specify `layout-engine: elk`**                                  |
| `docs/architecture/components-integration.d2` | D2 (ELK)               | Package communication topology. **Must specify `layout-engine: elk`**                                 |
| `docs/architecture/data-flow-diagrams.md`     | Markdown               | DFD guide embedding diagrams and process specs                                                        |
| `docs/architecture/components-integration.md` | Markdown               | Monorepo package communication matrix & webview IPC protocol                                          |
| `docs/architecture/sequence-diagrams.md`      | Markdown / Mermaid     | Runtime sequences (Anchoring, In-Place DOM, Auth, Git Tree SHA, Modal Deletion, etc.)                 |
| `docs/architecture/invariants-and-adrs.md`    | Markdown               | Codification of the 14 system invariants and Architectural Decision Records                           |
| `quality/invariants/INV-*.md`                 | Markdown / Frontmatter | Authoritative invariant definitions for Velite quality graph                                          |

---

## 2. Maintenance Rules

### Rule 1: Monorepo Package & Component Parity

Whenever a package is added, renamed, or modified in `pnpm-workspace.yaml`:

1. Update `docs/architecture/c4/model.c4` to include the container with appropriate `#tags` and technology attributes.
2. Update `docs/architecture/c4/views.c4` to include the container in `view containers of mdComments` and provide a subsystem component view if relevant.
3. Update `docs/architecture/components-integration.d2` and `docs/architecture/components-integration.md`.

### Rule 2: Strict ELK Layout Engine Configuration in D2

All `.d2` diagram files MUST declare the Eclipse Layout Kernel configuration at the top:

```d2
vars: {
  d2-config: {
    layout-engine: elk
    theme: 200
  }
}
```

### Rule 3: Quality Invariant Co-Evolution

Whenever an invariant is added or amended:

1. Create or update `quality/invariants/INV-NAME.md` with required frontmatter (`id`, `description`, `enforcementMechanism`).
2. Update `docs/architecture/invariants-and-adrs.md` with description and enforcement details.
3. Run `pnpm quality:build` to regenerate the Velite quality graph.

### Rule 4: Preview Runtime & In-Place DOM Synchronization

When modifying webview preview runtime scripts (`vscode-extension/media/earlyHook.js`, `preview-webview.js`, `preview.js`):

1. Ensure `earlyHook`, `inplaceDomUpdater`, `confirmationModal`, `mutationGuard`, and `inlineAnchors` remain accurately represented in `docs/architecture/c4/model.c4`.
2. Ensure sequences in `docs/architecture/sequence-diagrams.md` reflect any new message types or DOM guard behaviors.

---

## 3. Verification Commands

Run the automated verification suite before submitting changes:

```bash
# 1. Verify architecture models, D2 syntax (ELK engine), package parity, and invariants:
pnpm verify:arch

# 2. Validate LikeC4 syntax and semantic references offline:
pnpm likec4 validate --no-layout docs/architecture/c4

# 3. Rebuild quality graph:
pnpm quality:build

# 4. Run Vitest architecture documentation test suite:
pnpm test tests/architectureDocs.test.ts
```
