# Plan: Mock Mode for Comments Panel JS Embed & Dedicated Mock Demo Subsite

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Provide a frictionless **Mock Mode** for the standalone JavaScript comments panel embed (`md-comments.js`), a dedicated zero-friction **Mock Demo Subsite** (`website/demo-mock/`), and a new **Live Demo Showcase Card** on the main website landing page (`website/index.html`).

### Goals

- **Zero GitHub Sign-In**: Eliminates OAuth Device Code flow and GitHub App authorization prompts.
- **Zero Repository Write Permissions**: Removes the requirement for users to open a GitHub issue or join the `@md-comments/demo-commenters` team to obtain collaborator write access.
- **Generic Fake User / Multi-Persona Simulation**: Auto-logs in as a configurable demo persona (e.g. `Demo Reviewer (@demo-user)`) with avatar, and allows switching personas (`Alice Reviewer`, `Bob Architect`, `Charlie Maintainer`).
- **Local Storage Persistence & Rich Seeding**: Persists mock edits in browser `localStorage` (`md_comments_mock_v1:<repo>:<filePath>`), pre-seeds realistic interactive comment threads, and provides a one-click "Reset Demo State" action.
- **Dedicated Demo Subsite (`website/demo-mock/`)**: Static subsite structurally identical to `website/demo-html/` (`index.html`, `sandbox.html`, `how-it-works.html`, `architecture.html`), but pre-configured with `data-mock="true"`.
- **Main Landing Page Showcase Tile (`website/index.html`)**: New demo tile in the `#demos` grid highlighting the instant, zero-auth interactive demo.

---

## Current State vs. Proposed Architecture

### Current Flow (Production Git Mode)

- Requires visitors to authenticate via GitHub Device Code flow.
- Requires write collaborator permissions on the repository orphan branch `refs/md-comments/data`.
- If permissions are absent, prompts opening a GitHub issue on `md-comments/demo-access`.

### Proposed Flow (Mock Mode & Subsite)

- **Subsite**: `website/demo-mock/` runs with `data-mock="true"`.
- **Main Tile**: Links visitors directly to `demo-mock/` for instant evaluation.
- **Identity**: Auto-assigns a mock persona (`Demo Reviewer (@demo-user)`).
- **Backend Storage**: Intercepts read/write operations and stores YAML comments in browser `localStorage` under `md_comments_mock_v1:<repo>:<filePath>`.
- **Pre-seeding**: Auto-populates sample comments if storage is empty so the demo is immediately rich with content.
- **UI Adjustments**: Suppresses GitHub permission alerts and access request banners; displays a clean mock status badge and reset button.

---

## Milestones & Action Items

### Milestone 1: Embed Runtime Mock Engine

- Add mock mode detection in `website/demo-html/embed/md-comments.js` (`data-mock`, URL search param `?mock=true`, `window.__MD_COMMENTS_OPTIONS__`).
- Initialize default mock persona (`Demo Reviewer (@demo-user)`).
- Implement `localStorage` read/write backend and sample comment seeding.
- Suppress write permission callouts and OAuth modals in mock mode.

### Milestone 2: Create Dedicated Mock Demo Subsite (`website/demo-mock/`)

- Create `website/demo-mock/` mirroring `website/demo-html/` (`index.html`, `sandbox.html`, `how-it-works.html`, `architecture.html`, `demo.css`, `demo.js`).
- Enable `data-mock="true"` on all pages in `website/demo-mock/`.
- Replace collaborator access warnings with interactive mock playground notices.

### Milestone 3: Main Website Showcase & Navigation

- Add new "Instant Interactive Demo (Zero Auth)" card in `website/index.html` within `#demos`.
- Update `scripts/serve-website.js` to log the mock demo endpoint `http://localhost:4321/demo-mock/`.

### Milestone 4: Verification & Quality Checks

- Verify end-to-end commenting lifecycle (inline comments, replies, reactions, resolves, deletes, resets) in clean incognito browser sessions.
- Run project linting and formatting validation (`pnpm lint`, `pnpm format:check`).

---

## Verification Plan

### Manual Verification

1. Launch the dev server via `pnpm serve:website`.
2. Open `http://localhost:4321/` and click the new "Instant Interactive Demo" card.
3. In `http://localhost:4321/demo-mock/index.html` (in incognito, without GitHub sign-in):
   - Confirm user is logged in as `Demo Reviewer (@demo-user)`.
   - Confirm sample inline comments and page threads appear.
   - Select text, add comments, reply, add emoji reactions, resolve threads.
   - Refresh page to verify `localStorage` persistence.
   - Click "Reset Demo State" to verify re-seeding.
