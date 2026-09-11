# Cross-Interface UI Consistency & 100% Visual Parity Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Markdown Comments provides collaborative contextual review of Markdown documents across three core user surfaces:

1. **GitHub Browser Extension** (`chrome-extension/`, `safari-extension/`): Injected directly into GitHub PR diffs, issues, discussions, and repository blob views.
2. **VS Code Extension** (`vscode-extension/`): Integrated into the editor's native Markdown preview webview and custom comment panel.
3. **Demo Sites & Standalone Embeds** (`demo-astro/`, `website/demo-mock/`, `starlight-plugin/`): Interactive documentation portals and web embeds.

### The Problem

Currently, each runtime environment has evolved with slight divergences in design and behavior:

- **Fragmented Styling Tokens**: CSS custom properties are separately defined across `chrome-extension/src/sidebar.css`, `vscode-extension/media/preview.css`, and `starlight-plugin/src/client/styles/comments.css`. Colors, margins, border radii, elevation shadows, and hover transitions differ slightly.
- **Inconsistent DOM & Class Semantics**: Button naming, drawer structure, tab switching, and composer layouts use distinct class names across packages, making automated cross-platform verification fragile.
- **UX Inconsistencies**:
  - The Markdown formatting toolbar buttons (Bold, Italic, Code, Link, Quote, Mention) differ in icon sizes and layout between VS Code and GitHub.
  - Mention autocomplete menus and keyboard navigation (Arrow keys, Enter, Escape) exhibit subtle timing and focus discrepancies.
  - Reaction bars and emoji picker popovers have differing paddings and active state indicators.
  - Optimistic save states, sync spinners, offline banners, and resolved thread accordions lack a unified visual signature.
- **Missing Visual Regression Safety Net**: The nightly CI regression pipeline (`.github/workflows/nightly-regression.yml`) validates unit logic and functional E2E interactions, but does **not** execute automated pixel-level visual comparison tests to detect and block visual drift.

### Core Objectives

1. **Establish 100% Visual Parity**: Standardize design tokens, typography, colors, border radii, elevations, and animations via a centralized design system package (`shared/styles/`).
2. **Standardize UI Components & UX**: Deliver identical component structures and micro-interactions across GitHub, VS Code, and Demo sites.
3. **Automated Nightly Visual Regression**: Integrate automated Playwright visual screenshot comparisons (`toHaveScreenshot()`) into `.github/workflows/nightly-regression.yml` with strict diff thresholds (`maxDiffPixelRatio <= 0.01`).
4. **Zero Drift Invariants & Knowledge Graph Sync**: Formulate quality graph nodes (`FEAT-DOM-VISUAL-PARITY`) and invariants (`INV-VISUAL-PARITY`, `INV-NO-PAT`) enforcing strict visual consistency.

---

## Current State vs. Proposed Architecture

### Current State (Fragmented)

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│        GitHub Extension         │   │        VS Code Extension        │   │      Demo Sites & Embed         │
│  sidebar.css (35KB)             │   │  preview.css (29KB)             │   │  comments.css (24KB)            │
│  - Classes: .sidebar-container, │   │  - Classes: .md-comments-layout,│   │  - Classes: .md-comments-drawer,│
│    .comment-card, .btn-primary  │   │    .md-comments-card, .mdc-btn  │   │    .comment-card, .fab-toggle   │
│  - Tokens: --sidebar-bg,        │   │  - Tokens: --gc-surface,        │   │  - Tokens: --color-bg-card,     │
│    --accent-color, --card-bg    │   │    --gc-accent, --gc-border     │   │    --color-primary              │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
```

### Proposed Architecture (Unified Design System & Adapter Layer)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SHARED DESIGN SYSTEM: shared/styles/                            │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ tokens.css: Canonical CSS Custom Properties (--mdc-accent, --mdc-surface, etc.)  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ components.css: Canonical Component Templates (FAB, Drawer, Card, Composer, Bar)│  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                           │                                            │
│         ┌─────────────────────────────────┼─────────────────────────────────┐          │
│         ▼                                 ▼                                 ▼          │
│  [GitHub Theme Adapter]          [VS Code Theme Adapter]          [Demo Theme Adapter] │
│  Maps --mdc-* to Primer tokens   Maps --mdc-* to VS Code vars     Maps --mdc-* to Demo │
│  [data-color-mode="dark|light"]  var(--vscode-editor-*)           [data-theme] tokens  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────┼───────────────────────────────────────┐
    ▼                                       ▼                                       ▼
┌─────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│ GitHub Extension        │   │ VS Code Preview Panel     │   │ Demo Sites & Embed        │
│ (chrome-extension/)     │   │ (vscode-extension/media/) │   │ (demo-astro / website)    │
│ Standardized DOM:       │   │ Standardized DOM:         │   │ Standardized DOM:         │
│ .mdc-fab-toggle         │   │ .mdc-fab-toggle           │   │ .mdc-fab-toggle           │
│ .mdc-drawer             │   │ .mdc-drawer               │   │ .mdc-drawer               │
│ .mdc-comment-card       │   │ .mdc-comment-card         │   │ .mdc-comment-card         │
│ .mdc-composer-toolbar   │   │ .mdc-composer-toolbar     │   │ .mdc-composer-toolbar     │
│ .mdc-reaction-bar       │   │ .mdc-reaction-bar         │   │ .mdc-reaction-bar         │
└─────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    NIGHTLY REGRESSION VISUAL TEST PIPELINE                             │
│                                                                                        │
│  Playwright Visual E2E: tests/e2e/visual/*.spec.ts                                     │
│  - Golden Baselines for Light & Dark modes on Chromium & WebKit                        │
│  - Automated pixel diff assertion: toHaveScreenshot({ maxDiffPixelRatio: 0.01 })      │
│  - Side-by-side diff artifacts uploaded to Allure report and Step Summary              │
│  - Automated AI Diagnostic Triage Packet generated on failure                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component & UX Parity Specifications

To ensure exact 1:1 visual and behavioral alignment across all surfaces, the following component contracts are established:

### 1. Floating Action Button (FAB) & Badge

- **Dimensions & Geometry**: Fixed 44x44px circular trigger with smooth backdrop blur.
- **Positioning**: Bottom-right anchored (`bottom: 24px; right: 24px; z-index: 99999`).
- **Unread/Total Counter Badge**: Positioned at top-right of FAB (`top: -4px; right: -4px`). High-contrast pill with active pulse animation when new comments arrive.
- **Loading State**: Circular SVG spinner ring surrounding the FAB perimeter when syncing with GitHub Git refs or local store.

### 2. Comments Sidebar / Drawer

- **Dimensions**: Standard 340px fixed width, sliding in from right edge with cubic-bezier transition (`transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)`).
- **Header**:
  - Brand icon + Title ("Markdown Comments") + Live Connection Status Dot (Green: Connected, Yellow: Syncing, Grey: Offline).
  - Unread count pill badge.
  - Close (✕) icon button.
- **Search & Filter Controls**:
  - Search input with clear (✕) button: Instant filtering by author, keyword, or anchor text.
  - Segmented tab switch: `All` | `Inline` | `Page` with sliding active pill.
  - Sort dropdown: `Newest First` | `Oldest First` | `Most Reactions`.
- **Empty State**: Cohesive illustration, helpful zero-state text ("No comments yet on this document"), and action button to start the conversation.

### 3. Comment Card

- **Header**:
  - 32x32px circular author avatar with deterministic SVG fallback initials.
  - Author handle, optional "Author" badge, relative timestamp (e.g. `12m ago`) with full ISO tooltip on hover.
  - Target anchor tag badge (e.g. `#sec-authentication`), clicking which scrolls the document to the anchored highlight.
  - Three-dot kebab menu: `Edit comment`, `Delete comment`, `Copy link to anchor`.
- **Body**:
  - Rendered Markdown with unified syntax highlighting tokens, quote blocks with indigo left border, code chips, and sanitized links.
- **Footer**:
  - Reaction chips: 8 standard emoji reactions (`👍`, `👎`, `😄`, `🎉`, `😕`, `❤️`, `🚀`, `👀`) displaying reaction count and active state highlight.
  - `+` Emoji Picker trigger button displaying popover menu.
  - Reply button with thread reply count.

### 4. Markdown Composer & Formatting Toolbar

- **Formatting Toolbar**:
  - Format buttons: **Bold** (`**`), _Italic_ (`*`), `Code` (`` ` ``), Link (`[text](url)`), Quote (`> `), and Mention (`@`).
  - Write / Preview tab toggle.
- **Mention Autocomplete Dropdown**:
  - Triggered on typing `@`.
  - Filtered list of repo collaborators or demo personas with avatars, logins, and display names.
  - Full keyboard accessibility: Up/Down arrow navigation, Enter/Tab selection, Escape dismissal.
- **Actions**:
  - Primary "Comment" / "Reply" button with spinner on submission.
  - Secondary "Cancel" button.
  - Keyboard hint shortcut: `⌘ Enter` on macOS / `Ctrl Enter` on Windows/Linux.

### 5. Inline Highlighting & Selection Bubble UX

- Selecting any rendered prose displays floating selection popover bubble with "Add Comment" icon directly above the selection.
- Clicking bubble opens drawer and initializes composer pre-bound to the highlighted anchor range.
- Highlighted text in document receives translucent amber highlight (`background: rgba(234, 179, 8, 0.2)`).
- **Bidirectional Focus**:
  - Clicking anchored text in document scrolls sidebar and pulses corresponding comment card.
  - Hovering/clicking comment card pulses highlight in document.

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### New Tests to Create

1. **Unit & Contrast Tests (`tests/unit/design-tokens.test.ts`)**:
   - Validate that all `--mdc-*` variables are defined across all theme contexts (Light, Dark, High Contrast).
   - Validate WCAG AA contrast compliance:
     - Text Primary to Background: >= 4.5:1.
     - Interactive elements and borders: >= 3:1.
   - Validate theme adapter mapping correctness (GitHub Primer, VS Code, Demo).

2. **Cross-Platform Visual Regression E2E Suite (`tests/e2e/visual/`)**:
   - `github-extension-visual.spec.ts`:
     - Snapshots of hermetic GitHub document view with FAB, open drawer, empty state, threaded comments, and composer in Light & Dark modes.
   - `vscode-extension-visual.spec.ts`:
     - Snapshots of VS Code Markdown Preview webview with open drawer, active comments, and reactions under Default Dark and Default Light themes.
   - `demo-site-visual.spec.ts`:
     - Snapshots of Astro demo site and HTML mock playground.
   - `cross-surface-component-diff.spec.ts`:
     - Direct side-by-side component comparisons: asserts that isolated components (Comment Card, Composer, Reaction Bar, FAB) have `<= 0.01` maxDiffPixelRatio across GitHub, VS Code, and Demo sites.

3. **Knowledge Graph Nodes to Add/Update**:
   - **Feature Node**: `quality/features/dom/FEAT-DOM-VISUAL-PARITY.md`
     - ID: `FEAT-DOM-VISUAL-PARITY`
     - Interfaces: `chrome-mv3`, `vscode`, `starlight`, `demo-astro`
     - Flow: `FLOW-DOM-VISUAL-PARITY`
     - Verified in: `tests/e2e/visual/cross-surface-component-diff.spec.ts`
   - **Invariant Node**: `quality/invariants/INV-VISUAL-PARITY.md`
     - ID: `INV-VISUAL-PARITY`
     - Rule: Strict prohibition of unverified CSS styling drift; all interfaces must pass nightly visual snapshot comparisons within 1% pixel diff ratio.

### Existing Tests to Update

- `tests/e2e/embedded.spec.ts`: Update selectors to support unified `.mdc-*` classes alongside legacy classes.
- `tests/e2e/github-extension-hermetic.spec.ts`: Update DOM assertions to verify unified component structure.
- `tests/e2e/vscode-comment-preview.spec.ts`: Ensure assertions check standardized classes.

### 100% Coverage Preservation Strategy

- All theme mapping functions, color converter utilities, and DOM generation methods in `shared/` must be 100% covered by Vitest unit tests.
- Visual regression test coverage results will be consolidated with Monocart reporter and Allure in CI.

---

## Mandatory Invariants

1. **Strict Prohibition on Personal Access Tokens (`INV-NO-PAT`)**:
   - Browser extensions and client-side webviews MUST NEVER introduce, solicit, or accept Personal Access Tokens. All GitHub interactions must rely strictly on OAuth Device Flow or native editor auth.
2. **Strict Zero Cost Invariant (`INV-ZERO-COST`)**:
   - All visual testing tools must be 100% free and open source (Playwright visual comparison, pixelmatch, Allure, GitHub Actions). No paid visual SaaS tools (e.g. Percy, Chromatic) may be introduced.
3. **Visual Parity Gating Invariant (`INV-VISUAL-PARITY`)**:
   - Any commit or PR causing unintended visual drift exceeding `0.01` diff pixel ratio must fail the nightly regression gate and block releases.

---

## Nightly Regression Workflow Integration

In `.github/workflows/nightly-regression.yml`, add a dedicated `visual-parity-regression` job running in parallel with existing jobs:

```yaml
visual-parity-regression:
  name: Cross-Interface Visual 100% Parity Gate
  needs: knowledge-graph-and-unit
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v7
    - uses: pnpm/action-setup@v6
      with:
        version: 9
    - uses: actions/setup-node@v7
      with:
        node-version: 20
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Build packages and extensions
      run: pnpm build:shared && pnpm build:chrome && pnpm build:vscode && pnpm build:starlight && pnpm build:demo-astro

    - name: Install Playwright Browsers with OS Dependencies
      run: npx playwright install --with-deps chromium webkit

    - name: Run Cross-Interface Visual Regression Suite
      run: pnpm test:e2e tests/e2e/visual/

    - name: Upload Visual Snapshots & Diffs
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: visual-regression-diffs
        path: |
          test-results/
          playwright-report/

    - name: Triage Visual Drift on Failure
      if: failure()
      run: node scripts/triage-visual-drift.mjs
```

---

## Milestones & Action Items

### Milestone 1: Centralized Design System & Token Extraction

- [ ] Create `shared/styles/tokens.css` with unified `--mdc-*` variables (color scales, typography, spacing, elevations, transitions).
- [ ] Create `shared/styles/components.css` with standardized component classes (`.mdc-fab-toggle`, `.mdc-drawer`, `.mdc-comment-card`, `.mdc-composer-toolbar`, `.mdc-reaction-bar`).
- [ ] Implement theme adapters for GitHub (`data-color-mode`), VS Code (`var(--vscode-*)`), and Demo sites (`[data-theme]`).
- [ ] Write unit tests for design tokens & WCAG AA contrast in `tests/unit/design-tokens.test.ts`.

### Milestone 2: Refactoring Extension & Site Components to Unified Spec

- [ ] Refactor `chrome-extension/src/sidebar.css` and `chrome-extension/src/content.ts` to adopt `.mdc-*` classes and shared tokens.
- [ ] Refactor `vscode-extension/media/preview.css`, `previewSidebar.js`, and `previewActions.js` to adopt `.mdc-*` classes and shared tokens.
- [ ] Refactor `starlight-plugin/src/client/styles/comments.css` and `CommentsOverlay.ts` to match unified tokens.
- [ ] Update `website/demo-mock/demo.css` and embed runtime.

### Milestone 3: Cross-Interface Visual Regression Test Suite

- [ ] Configure Playwright visual comparison fixtures with deterministic font rendering (`--font-render-hinting=none`, fixed 1280x800 viewport).
- [ ] Capture golden baseline snapshots across:
  - GitHub Extension (hermetic fixture, light & dark)
  - VS Code Extension (preview webview, light & dark)
  - Demo Astro & HTML Mock Playground
- [ ] Implement `tests/e2e/visual/cross-surface-component-diff.spec.ts` asserting `<= 0.01` maxDiffPixelRatio for isolated components.

### Milestone 4: Nightly CI Regression Integration & AI Triage

- [ ] Add `visual-parity-regression` job to `.github/workflows/nightly-regression.yml`.
- [ ] Add `scripts/triage-visual-drift.mjs` to auto-generate markdown AI diagnostic triage packets with embedded diff images.
- [ ] Add `quality/features/dom/FEAT-DOM-VISUAL-PARITY.md` and `quality/invariants/INV-VISUAL-PARITY.md` to Knowledge Graph.
- [ ] Verify `pnpm check`, `pnpm quality:build`, and `pnpm test:regression` pass with 100% test coverage.
