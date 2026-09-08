# Multi-Browser Extension Expansion Plan: Firefox, Microsoft Edge, and Opera

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Markdown Comments enables friction-free, local-first documentation reviews directly on GitHub pull requests and markdown previews. Currently, our browser extension is actively distributed on the **Chrome Web Store** (serving Chrome, Brave, Arc, and other Chromium browsers) and as a self-signed macOS DMG for **Apple Safari**.

However, users on **Mozilla Firefox**, **Microsoft Edge**, and **Opera** lack native store-backed extensions, requiring cumbersome sideloading or being excluded entirely.

### Objectives & Goals

1. **Target the Missing Browser Stores**:
   - **Mozilla Firefox**: Build and publish to **Mozilla Add-ons (AMO)**.
   - **Microsoft Edge**: Build and publish to **Microsoft Edge Add-ons**.
   - **Opera**: Build and publish to **Opera Add-ons**.
2. **Unified Single Codebase**:
   - Maintain a single TypeScript source tree under `chrome-extension/src/` leveraging the cross-browser abstraction layer in `browserApi.ts`.
   - Implement deterministic multi-target compilation in `chrome-extension/esbuild.js` (`--target=chrome|firefox|safari|edge|opera`).
3. **Strict Zero-PAT Invariant (`INV-NO-PAT`)**:
   - All browser extension builds must strictly enforce frictionless GitHub App OAuth Device Flow. Under no circumstances will Personal Access Tokens (PATs) or manual token entry forms be introduced.
4. **CI/CD Automation & Provenance**:
   - Package distinct production artifacts (`firefox-extension.zip`, `edge-extension.zip`, `opera-extension.zip`) alongside existing artifacts in `.github/workflows/build.yml`.
   - Automate marketplace deployments via `.github/workflows/deploy-marketplaces.yml` for stores with official REST APIs (AMO and Edge Add-ons).
5. **Website & Docs Alignment**:
   - Update `website/index.html` browser dock to transition Firefox, Edge, and Opera from "Coming Soon" (disabled) to interactive download/install panes.

### Non-Goals

- **Apple Mac App Store**: Excluded per design decision. macOS Safari will remain distributed as a zero-cost self-signed DMG (`Markdown-Comments-macOS.dmg`) via GitHub Releases and direct download.
- **Apple iOS / iPadOS App Store**: Mobile Safari extensions are explicitly out of scope.
- **Rewriting Core Extension Logic**: Content script, sidebar DOM manipulation, and background device-flow communication remain shared.

---

## Current State vs. Proposed Architecture

### Current State

- `chrome-extension/` contains:
  - `manifests/manifest.chrome.json` (Manifest V3, `background.service_worker`)
  - `manifests/manifest.safari.json` (Manifest V3, `background.service_worker`)
  - `esbuild.js` only handles `--target=chrome` and `--target=safari`.
- `deploy-marketplaces.yml` contains jobs for `deploy-npm`, `deploy-vscode`, `deploy-openvsx`, `deploy-chrome`, and `deploy-safari`.
- `website/index.html` displays Firefox, Edge, and Opera icons with `class="browser-icon-btn disabled"` and `title="... (Coming Soon)"`.

### Target Browser Matrix & Manifest Requirements

| Target Browser      | Engine   | Manifest Spec | Background Execution                         | Unique Requirements                                                           | Store / Registry                                                                |
| :------------------ | :------- | :------------ | :------------------------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Mozilla Firefox** | Gecko    | Manifest V3   | `background.scripts: ["background.js"]`      | Explicit `browser_specific_settings.gecko.id`, source code archive for review | [Mozilla Add-ons (AMO)](https://addons.mozilla.org/)                            |
| **Microsoft Edge**  | Chromium | Manifest V3   | `background.service_worker: "background.js"` | Standard Chromium MV3, optional Edge store metadata                           | [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge) |
| **Opera**           | Chromium | Manifest V3   | `background.service_worker: "background.js"` | Standard Chromium MV3, 16/32/48/128 icon assets                               | [Opera Add-ons](https://addons.opera.com/developer/)                            |

### Architectural Flow

```
                     ┌──────────────────────────────────────────────┐
                     │          chrome-extension/src/               │
                     │  (content.ts, background.ts, browserApi.ts)  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                  pnpm run build (esbuild)
                                            │
         ┌──────────────────┬───────────────┴──────────────┬──────────────────┐
         │                  │                              │                  │
         ▼                  ▼                              ▼                  ▼
    dist/chrome/       dist/firefox/                  dist/edge/         dist/safari/
  (manifest.chrome)  (manifest.firefox)             (manifest.edge)    (manifest.safari)
         │                  │                              │                  │
         ▼                  ▼                              ▼                  ▼
 chrome-extension.zip firefox-extension.zip     edge-extension.zip   Markdown-Comments-macOS.dmg
         │                  │                              │                  │
         ▼                  ▼                              ▼                  ▼
Chrome Web Store       Mozilla AMO               Edge Add-ons        GitHub Release DMG
 (Automated API)     (web-ext / API)           (Partner API)          (Direct Download)
```

---

## Technical Specifications

### 1. Firefox Manifest (`manifest.firefox.json`)

Firefox MV3 handles service workers differently than Chromium, so `background.scripts` with an event page is the most robust cross-version mechanism. Firefox also strictly requires `browser_specific_settings`:

```json
{
  "manifest_version": 3,
  "name": "Markdown Comments",
  "version": "1.3.0",
  "description": "Visual inline comments on Markdown documentation across GitHub repositories powered by custom git refs — zero commits, zero PRs.",
  "permissions": ["storage"],
  "host_permissions": [
    "https://github.com/*",
    "https://api.github.com/*",
    "https://raw.githubusercontent.com/*",
    "https://*.workers.dev/*",
    "https://*.md-comments.org/*"
  ],
  "background": {
    "scripts": ["background.js"]
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "markdown-comments@md-comments.org",
      "strict_min_version": "109.0"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Markdown Comments"
  },
  "content_scripts": [
    {
      "matches": ["https://github.com/*"],
      "js": ["content.js"],
      "css": ["sidebar.css"],
      "run_at": "document_end"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["sidebar.css"],
      "matches": ["https://github.com/*"]
    }
  ]
}
```

### 2. Microsoft Edge & Opera Manifests

Edge and Opera utilize Chromium-standard MV3 identical to `manifest.chrome.json`. We will maintain `manifest.edge.json` and `manifest.opera.json` to allow browser-specific overrides or telemetry tags without polluting the base Chrome manifest.

### 3. Multi-Target Build Script (`chrome-extension/esbuild.js`)

Extend `esbuild.js` target switch:

- `--target=firefox`: outputs to `dist/firefox`, copies `manifest.firefox.json`
- `--target=edge`: outputs to `dist/edge`, copies `manifest.edge.json`
- `--target=opera`: outputs to `dist/opera`, copies `manifest.opera.json`
- Default / `all`: compiles all targets in parallel.

---

## Mandatory Test Enhancement & In-Code Knowledge Graph Specification

### 1. New Tests to Create

- **`tests/extensions/manifest-validation.test.ts` (Unit)**:
  - Validates syntax and schema validity of all target manifests (`manifest.chrome.json`, `manifest.firefox.json`, `manifest.safari.json`, `manifest.edge.json`, `manifest.opera.json`).
  - Asserts that every manifest references existing icon paths (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`).
  - Asserts that `manifest.firefox.json` includes valid `browser_specific_settings.gecko.id` and `background.scripts`.
  - Asserts that all manifests match the exact version defined in `chrome-extension/package.json`.
- **`tests/extensions/browser-api-parity.test.ts` (Unit)**:
  - Tests `getBrowserNamespace()`, `browserStorage`, and `browserRuntime` under simulated browser environments:
    - Pure Chromium (`window.chrome` defined, `window.browser` undefined).
    - Pure Firefox / WebExtension (`window.browser` defined with Promise returns).
    - Hybrid fallback scenarios.
- **`tests/extensions/zero-pat-invariant.test.ts` (Security Unit)**:
  - Scans bundled outputs (`dist/firefox/content.js`, `dist/edge/content.js`, etc.) to assert zero presence of PAT input selectors, token persistence keys, or unauthorized authentication prompts (`INV-NO-PAT`).
- **`tests/e2e/firefox-extension.spec.ts` (Headless Playwright Integration)**:
  - Validates loading the extension in Firefox using Playwright's Firefox persistent context or temporary extension loader, verifying sidebar mount on GitHub markdown views.

### 2. Existing Tests to Update

- **`tests/e2e/extension.spec.ts`**:
  - Update browser fixtures to parameterize across Chromium and Firefox builds.
- **`scripts/verify-packaging-compat.js`**:
  - Add verification step to check zip structure and manifest validity for all packaged extension zips.

### 3. Knowledge Graph Synchronicity

- Update in-code architectural reference to reflect the multi-browser extension matrix, mapping each browser target to its respective manifest, build command, artifact zip, and deployment job.

---

## Milestones & Action Items

### Milestone 1: Manifest Definitions & Multi-Target Build Engine

- [ ] Create `chrome-extension/manifests/manifest.firefox.json` with Gecko ID and event page background script.
- [ ] Create `chrome-extension/manifests/manifest.edge.json` and `chrome-extension/manifests/manifest.opera.json`.
- [ ] Update `chrome-extension/esbuild.js` to support targets: `all`, `chrome`, `firefox`, `safari`, `edge`, `opera`.
- [ ] Add `build:firefox`, `build:edge`, and `build:opera` npm scripts to `chrome-extension/package.json`.
- [ ] Verify clean builds across all directories (`dist/firefox/`, `dist/edge/`, `dist/opera/`).

### Milestone 2: Cross-Browser Test Suite & Verification

- [ ] Implement `tests/extensions/manifest-validation.test.ts`.
- [ ] Implement `tests/extensions/browser-api-parity.test.ts` for Firefox/Chrome storage and messaging parity.
- [ ] Implement `tests/extensions/zero-pat-invariant.test.ts`.
- [ ] Run full test suite (`pnpm test:coverage`) ensuring 100% test pass rate and coverage maintenance.

### Milestone 3: Packaging & Release Asset Pipeline

- [ ] Update `.github/workflows/build.yml` to package:
  - `firefox-extension.zip`
  - `edge-extension.zip`
  - `opera-extension.zip`
  - `firefox-source-code.zip` (unbundled source archive required by Mozilla review guidelines)
- [ ] Add all generated zips to the `build-artifacts` upload step.
- [ ] Update release staging/production workflows to attach these artifacts to GitHub Releases.

### Milestone 4: Marketplace Registration & CI/CD Deployment Workflows

- [ ] **Mozilla Add-ons (AMO)**:
  - Register developer account on [AMO](https://addons.mozilla.org/).
  - Create listing for "Markdown Comments" with icons, description, and privacy policy link.
  - Generate AMO API Issuer & Secret; store in GitHub Secrets as `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.
  - Add `deploy-firefox` job in `.github/workflows/deploy-marketplaces.yml` using `web-ext sign`.
- [ ] **Microsoft Edge Add-ons**:
  - Register free developer account in [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
  - Create listing for "Markdown Comments".
  - Configure Azure AD credentials (`EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_CLIENT_SECRET`, `EDGE_ACCESS_TOKEN_URL`).
  - Add `deploy-edge` job in `.github/workflows/deploy-marketplaces.yml`.
- [ ] **Opera Add-ons**:
  - Register free account on [Opera Developer Portal](https://addons.opera.com/developer/).
  - Submit initial listing package manually (attach link in release checklist).

### Milestone 5: Website Installation Panes & Documentation

- [ ] Update `website/index.html`:
  - Activate Firefox icon button with dedicated `pane-firefox` linking to AMO store page.
  - Activate Edge icon button with dedicated `pane-edge` linking to Edge Add-ons store page.
  - Activate Opera icon button with dedicated `pane-opera` linking to Opera Add-ons store page.
- [ ] Update `README.md` and `docs/` with links to all active browser stores.
