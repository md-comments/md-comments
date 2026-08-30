# Cross-Browser Extension Expansion Plan & Store Publishing Roadmap

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview

Currently, the Markdown Comments extension is built and configured exclusively for **Google Chrome (Manifest V3)** under `chrome-extension/`.

This plan addresses:

1. **Existing Technical Incompatibilities** in the current codebase that prevent it from running properly on Firefox, Safari, Edge, and other browsers.
2. **Technical Solutions & Architecture** to make the codebase universally cross-browser compatible.
3. **End-to-End Store Publishing Roadmap** for all major browser marketplaces (Chrome Web Store, Mozilla AMO, Microsoft Edge Add-ons, Apple Mac App Store, and Opera Add-ons).

---

## Today's Existing Incompatibilities & How This Plan Solves Them

| Category                                     | Current Codebase State (Chrome-Only)                                                               | Problem in Other Browsers                                                                                                                                                                                                                            | Plan Solution                                                                                                                                                                          |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Extension Identifier (Gecko ID)**       | `manifest.json` has no `browser_specific_settings.gecko` block.                                    | **Firefox / AMO**: Firefox strictly requires an extension ID (`gecko.id`) in MV3. Without it, Firefox refuses to sign the extension or persist local storage across sessions.                                                                        | Create `manifest.firefox.json` with `browser_specific_settings.gecko.id` (`md-comments@extension.github.com`) and minimum version `109.0`.                                             |
| **2. Background Worker Model**               | `manifest.json` defines `"background": { "service_worker": "background.js" }`.                     | **Firefox & Older Safari**: Firefox MV3 historically preferred `background.scripts: ["background.js"]` (event pages). While modern Firefox 121+ supports workers, background scripts offer broader compatibility across ESR and Linux distributions. | Multi-target manifest generation: outputs `service_worker` for Chromium/Safari and `background.scripts` for Firefox.                                                                   |
| **3. API Namespace & Promises vs Callbacks** | Code directly calls `chrome.storage.local` and `chrome.runtime` using Chrome callback signatures.  | **Firefox & Safari**: Firefox provides promise-returning `browser.*` natively. In Safari, callback vs promise handling in `chrome.storage` has subtle discrepancies across versions.                                                                 | Implement a unified `src/browserApi.ts` adapter layer (or `webextension-polyfill`) that provides uniform Promise-based storage, runtime messaging, and URL helpers across all engines. |
| **4. Message Passing Async Channel**         | `background.ts` uses `chrome.runtime.onMessage.addListener(..., sendResponse)` and `return true;`. | **Firefox Gecko**: In Firefox, returning `true` for async responses can cause channel termination errors (_"Could not establish connection. Receiving end does not exist"_) if not returning a Promise directly.                                     | Standardize background message listeners in `browserApi.ts` to return native Promises compatible with both Chrome's callback channel and Firefox's Promise channel.                    |
| **5. Safari Native Container Requirement**   | Standalone directory with JS/CSS/manifest only.                                                    | **Safari (macOS & iOS)**: Safari does **not** install extensions directly from `.zip` files in production. It requires an Xcode project wrapper (`.xcodeproj`) that compiles into a macOS/iOS native App bundle containing an `.appex` extension.    | Create automated Safari converter script (`scripts/generate-safari-app.sh`) using `xcrun safari-web-extension-converter` to generate and sync the Xcode project.                       |
| **6. Build & Packaging Architecture**        | `esbuild.js` only builds a single `dist/` directory targeting Chrome with static manifest copy.    | Cannot build or test browser-specific variants independently or package them for different store requirements.                                                                                                                                       | Update `esbuild.js` to support `--target=chrome                                                                                                                                        | firefox | edge | safari | all`outputting to`dist/chrome`, `dist/firefox`, `dist/edge`, `dist/safari` and bundling store-ready packages. |

---

## Technical Architecture Plan

```
chrome-extension/ (or browser-extension/)
├── manifests/
│   ├── manifest.chrome.json      # Chromium MV3 (Chrome, Edge, Brave, Opera, Arc)
│   ├── manifest.firefox.json     # Firefox Gecko MV3 (Gecko ID, background scripts)
│   └── manifest.safari.json      # Safari WebExtension baseline
├── src/
│   ├── browserApi.ts             # [NEW] Normalized cross-browser API wrapper
│   ├── background.ts             # [MODIFY] Uses browserApi for device flow & auth
│   ├── content.ts                # [MODIFY] Uses browserApi for storage & DOM injection
│   ├── githubAuth.ts             # [MODIFY] Uses browserApi for token management
│   ├── githubApi.ts              # Cross-browser fetch & GraphQL client
│   └── sidebar.css               # Cross-engine CSS verified for WebKit & Gecko
├── scripts/
│   ├── generate-safari-app.sh    # [NEW] Automates xcrun safari-web-extension-converter
│   └── package-extensions.js     # [NEW] Packages .zip/.xpi for store submissions
├── esbuild.js                    # [MODIFY] Multi-target matrix builder
└── package.json                  # [MODIFY] Multi-target build scripts
```

### 1. Unified `src/browserApi.ts`

```typescript
/**
 * Cross-browser extension API abstraction layer.
 * Works seamlessly across Chrome, Firefox, Safari, and Edge.
 */
const api = typeof globalThis.browser !== 'undefined' ? globalThis.browser : globalThis.chrome;

export const browserStorage = {
  async get<T = Record<string, any>>(keys: string | string[] | Record<string, any>): Promise<T> {
    return new Promise((resolve) => {
      api.storage.local.get(keys, (res: T) => resolve(res));
    });
  },
  async set(items: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      api.storage.local.set(items, () => resolve());
    });
  },
  async remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      api.storage.local.remove(keys, () => resolve());
    });
  },
  onChanged: api.storage.onChanged,
};

export const browserRuntime = {
  getURL(path: string): string {
    return api.runtime.getURL(path);
  },
  sendMessage<T = any>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
      api.runtime.sendMessage(message, (response: T) => {
        if (api.runtime.lastError) {
          return reject(new Error(api.runtime.lastError.message));
        }
        resolve(response);
      });
    });
  },
  onMessage: api.runtime.onMessage,
};
```

---

## Store Publishing Roadmap

Below is the step-by-step publishing plan for each major browser marketplace:

### 1. Google Chrome Web Store (CWS)

- **Target Audience**: Chrome, Brave, Arc, Vivaldi users (~65%+ market share).
- **Package**: `artifacts/chrome-extension.zip` generated from `dist/chrome`.
- **Portal**: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- **Prerequisites**: One-time $5 Google Developer registration fee.
- **Required Assets**:
  - Store description & release notes.
  - Icons: 16x16, 32x32, 48x48, 128x128.
  - Screenshots: At least one 1280x800 or 640x400 PNG/JPEG.
  - Small promo tile: 440x280 PNG (already in `assets/chrome-extension/promo-small.png`).
  - Marquee promo tile: 1400x560 PNG (already in `assets/chrome-extension/promo-marquee.png`).
  - Privacy policy link: Pointing to repo `PRIVACY.md` / website privacy page.
- **Review Time**: ~1–3 business days.

---

### 2. Mozilla Add-ons (AMO - Firefox)

- **Target Audience**: Firefox Desktop, Firefox Developer Edition, Firefox for Android.
- **Package**: `artifacts/firefox-extension.zip` generated from `dist/firefox`.
- **Portal**: [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/).
- **Prerequisites**: Free Firefox account.
- **Key Requirements**:
  - `browser_specific_settings.gecko.id` configured in `manifest.json`.
  - **Source Code Submission**: Mozilla requires uploading an unminified source code archive (`source.zip`) and build instructions (`pnpm build:extension:firefox`) if the extension bundle is compiled with esbuild/webpack.
  - Privacy policy and license declaration (MIT).
- **Review Time**: ~2 hours to 2 days (often automated verification with occasional human review).

---

### 3. Microsoft Edge Add-ons

- **Target Audience**: Enterprise and consumer Microsoft Edge users.
- **Package**: `artifacts/edge-extension.zip` generated from `dist/edge`.
- **Portal**: [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
- **Prerequisites**: Free Microsoft Developer Account.
- **Key Requirements**:
  - Supports Chrome MV3 format directly.
  - Screenshots (1280x800), promotional tile (440x280), icons.
  - Privacy Policy URL (`PRIVACY.md`).
  - Option to link Chrome Web Store listing to auto-populate metadata.
- **Review Time**: ~1–3 business days.

---

### 4. Apple Mac App Store & iOS App Store (Safari)

- **Target Audience**: macOS Safari and iOS/iPadOS Safari users.
- **Package**: macOS App Bundle / iOS App (`Markdown Comments.app`) wrapping the Safari Web Extension.
- **Portal**: [Apple Developer Program / App Store Connect](https://appstoreconnect.apple.com/).
- **Prerequisites**: Apple Developer Program membership ($99/year).
- **Workflow**:
  1. Build Safari web extension: `pnpm build:extension:safari`.
  2. Run converter: `xcrun safari-web-extension-converter dist/safari --project-location safari-extension --app-name "Markdown Comments" --bundle-identifier "com.mdcomments.safari"`.
  3. Open generated Xcode project in `safari-extension/`.
  4. Configure code signing in Xcode with Apple Developer Team ID.
  5. Build & Archive in Xcode -> Upload to App Store Connect.
  6. Submit for Mac App Store review.
- **Local Testing**: Users/developers can test locally without App Store submission by enabling **Safari > Settings > Advanced > Show Develop menu** and selecting **Develop > Allow Unsigned Extensions**.
- **Review Time**: ~24–48 hours.

---

### 5. Opera Add-ons

- **Target Audience**: Opera and Opera GX users.
- **Package**: `artifacts/opera-extension.zip` generated from `dist/chrome`.
- **Portal**: [Opera Add-ons Developer Portal](https://addons.opera.com/developer/).
- **Prerequisites**: Free Opera account.
- **Review Time**: ~3–7 business days.

---

## Verification & Automation Plan

### Automated Build & Packaging Pipeline

1. **Multi-Browser Build**:
   ```bash
   pnpm build:extension:all
   ```
   Generates `dist/chrome/`, `dist/firefox/`, `dist/edge/`, and `dist/safari/`.
2. **Packaging Script**:
   ```bash
   pnpm package:extension
   ```
   Generates `artifacts/chrome-extension.zip`, `artifacts/firefox-extension.zip`, `artifacts/edge-extension.zip`, and `artifacts/firefox-source.zip`.
3. **Validation / Linting**:
   - Firefox Manifest Linter: `npx web-ext lint --source-dir dist/firefox`
   - TypeScript checking: `pnpm typecheck`

### Testing Verification Checklist

- [ ] **Chrome**: Load `dist/chrome` in `chrome://extensions`. Verify PR diff comments, sidebar toggle, and OAuth device flow.
- [ ] **Firefox**: Load `dist/firefox` in `about:debugging#/runtime/this-firefox` ("Load Temporary Add-on"). Verify background communication and UI rendering.
- [ ] **Edge**: Load `dist/edge` in `edge://extensions`. Verify compatibility.
- [ ] **Safari**: Run macOS target in Xcode. Verify Safari extension toggle and GitHub PR page injection.
