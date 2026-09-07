# Universal Privacy Policy Change Notification Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Markdown Comments is a local-first, serverless tool suite spanning multiple client interfaces:

- **VS Code Extension** (`vscode-extension`)
- **Obsidian Plugin** (`obsidian-plugin`)
- **Browser Extension** (Chrome, Firefox, Safari MV3 under `chrome-extension/` and `safari-extension/`)
- **Embeddable Web Component & Starlight Plugin** (`embed/`, `starlight-plugin/`)
- **Website & Documentation** (`website/privacy.html`, `PRIVACY.md`)

### The Problem

As stated in `PRIVACY.md`, Markdown Comments maintains **no centralized user database, collects no user email addresses, and acts as neither a keeper nor processor of Personally Identifiable Information (PII)** (`INV-ZERO-CUSTOMER-DATA`).

Currently, Section 7 of `PRIVACY.md` relies on passive notice:

> _"We may update our Privacy Policy from time to time. Any changes will be posted by updating the `PRIVACY.md` file in this repository. We encourage you to review this page periodically for any changes."_

Under modern global privacy frameworks (GDPR, CCPA/CPRA, ePrivacy, Chrome Web Store Policies), passive notification is insufficient for material policy revisions (such as changes to telemetry, retention, diagnostic backends, or permissions). However, traditional SaaS notification methods (email blasts) are fundamentally impossible without compromising our zero-PII architectural invariant.

### Objectives & Goals

1. **Omnichannel In-Client Notification**: Inform active users directly within their editors/browsers (VS Code, Obsidian, Chrome/Safari sidebar on GitHub, Web Embed) whenever the Privacy Policy changes.
2. **Strict Zero-PII Invariant (`INV-ZERO-CUSTOMER-DATA`)**: Deliver timely notices without collecting emails, tracking users, or introducing central authentication servers.
3. **Actionable Telemetry Kill-Switch Integration (`INV-TELEMETRY-KILLSWITCH`)**: Provide direct one-click access from update notices to disable telemetry and purge queued logs immediately.
4. **Automated CI/CD Lockstep Gate (`INV-PRIVACY-SYNC`)**: Block any pull request modifying `PRIVACY.md` unless policy versioning, changelog summaries, website sync, and syndication feeds are simultaneously updated.
5. **Multi-Tier Change Classification**:
   - **Material Changes**: Trigger high-visibility in-client notice banners with explicit review and telemetry opt-out actions.
   - **Minor/Editorial Changes**: Update version and public changelogs without intrusive client UI prompts.

### Non-Goals

- Collecting user contact information, emails, or account registration data.
- Introducing centralized user tracking servers or push notification services.
- Displaying modal blocking dialogs that interrupt user editing workflows unnecessarily.

---

## Current State vs. Proposed Architecture

### Current State

- `PRIVACY.md` is updated manually in the git repository.
- No semantic versioning or programmatic checksum is associated with the policy text.
- Client interfaces have no awareness of policy revisions or user acknowledgment state.
- Website `website/privacy.html` requires manual copy-paste sync, with risk of drift.
- No public syndication feed (RSS/Atom) exists for enterprise compliance tracking.

### Proposed Architecture

```
                               ┌─────────────────────────────┐
                               │         PRIVACY.md          │
                               │  Canonical Legal Statement  │
                               └──────────────┬──────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
         ┌───────────────────────────────┐         ┌───────────────────────────────┐
         │ shared/privacy/manifest.json  │         │     website/privacy.html      │
         │ - version (e.g. "2026.09.07") │         │ - Revision History / Diffs    │
         │ - effectiveDate (ISO)         │         │ - Public RSS Feed Link        │
         │ - policyHash (SHA-256)        │         └───────────────────────────────┘
         │ - changeType ("material")     │                         │
         │ - summaryOfChanges            │                         ▼
         └──────────────┬────────────────┘         ┌───────────────────────────────┐
                        │                          │   website/privacy-feed.xml    │
                        │                          │   Syndicated RSS/Atom Feed    │
                        │                          └───────────────────────────────┘
        ┌───────────────┼───────────────────────────────┐
        ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│   VS Code    ││ Chrome/Safari││   Obsidian   ││  Web Embed   │
│  Extension   ││  Extension   ││    Plugin    ││  Component   │
└───────┬──────┘└───────┬──────┘└───────┬──────┘└───────┬──────┘
        ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│ vscode window││ GitHub       ││ Obsidian     ││ Discreet     │
│ info message ││ Sidebar top  ││ notice & view││ footer toast │
│ + settings   ││ banner + opt ││ banner + opt ││ notification │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│ globalState: ││storage.local:││ plugin data: ││localStorage: │
│ ackVersion   ││ ack_version  ││ ackVersion   ││ ackVersion   │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
```

### Data Contracts & Schema

#### `shared/src/privacy/policyManifest.json`

```json
{
  "version": "2026.09.07",
  "effectiveDate": "2026-09-07T00:00:00Z",
  "policyHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "changeType": "material",
  "summary": "Documented universal telemetry kill-switch and 24-hour retention policy for public demo sites.",
  "diffUrl": "https://github.com/md-comments/md-comments/commit/9ec7c5c",
  "policyUrl": "https://md-comments.com/privacy.html"
}
```

#### Shared Checker API (`shared/src/privacy/policyChecker.ts`)

```typescript
export interface PolicyStatus {
  isOutdated: boolean;
  isMaterial: boolean;
  currentVersion: string;
  summary: string;
  policyUrl: string;
  diffUrl: string;
}

export function evaluatePolicyNotice(storedVersion?: string): PolicyStatus {
  const isOutdated = !storedVersion || storedVersion < manifest.version;
  const isMaterial = manifest.changeType === 'material';
  return {
    isOutdated,
    isMaterial,
    currentVersion: manifest.version,
    summary: manifest.summary,
    policyUrl: manifest.policyUrl,
    diffUrl: manifest.diffUrl,
  };
}
```

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### 1. New Tests to Create

- **`tests/privacy-policy-manifest.test.ts` (Unit)**:
  - Verifies `policyManifest.json` conforms to schema with valid semantic/calver version and ISO timestamp.
  - Asserts `policyHash` strictly matches the SHA-256 hash of `PRIVACY.md`.
  - Tests `evaluatePolicyNotice()` under matching, outdated, and uninitialized version scenarios.
- **`tests/vscode-privacy-notification.test.ts` (Integration)**:
  - Mocks VS Code `globalState` and verifies `vscode.window.showInformationMessage` triggers on outdated policy versions.
  - Verifies selecting "Review Changes" opens external browser with canonical policy URL.
  - Verifies selecting "Telemetry Settings" triggers `workbench.action.openSettings`.
  - Verifies dismiss/ack stores `manifest.version` into `globalState`.
- **`tests/chrome-privacy-banner.test.ts` (Integration)**:
  - Mocks `chrome.storage.local` and verifies DOM injection of `.privacy-update-banner` in GitHub sidebar.
  - Asserts banner dismiss records `privacy_ack_version` in local storage.
  - Asserts quick opt-out button dispatches `{ type: "OTEL_SET_ENABLED", enabled: false }` and purges queues.
- **`tests/e2e/privacy-notification.spec.ts` (Headless Playwright E2E)**:
  - Boots Chromium with the packed extension.
  - Configures storage with an older acknowledged version (`2026.01.01`).
  - Navigates to a GitHub PR page and asserts the privacy update banner is visible at top of sidebar.
  - Clicks "Acknowledge", reloads page, and confirms banner is suppressed.

### 2. Existing Tests to Update

- `tests/phase5-ci.test.ts`: Add assertion for `verify:privacy-sync` CI step and workflow existence.
- `tests/e2e/github-extension-hermetic.spec.ts`: Ensure simulated PR view test fixtures account for the dismissible privacy banner when testing top-level layout.

### 3. In-Code Knowledge Graph Specification

Register nodes in `shared/knowledge-graph/` and Graphify:

- **Node**: `PrivacyPolicyManifest` (Kind: `schema/contract`)
- **Node**: `PrivacyPolicyChecker` (Kind: `service`)
- **Node**: `PrivacyNotificationBanner` (Kind: `component`)
- **Edges**:
  - `PrivacyPolicyManifest` -> `PrivacyPolicyChecker` (defines)
  - `PrivacyPolicyChecker` -> `vscode-extension:extension.ts` (consumed_by)
  - `PrivacyPolicyChecker` -> `chrome-extension:content.ts` (consumed_by)
  - `PrivacyPolicyChecker` -> `obsidian-plugin:main.ts` (consumed_by)
  - `PrivacyNotificationBanner` -> `shared/src/telemetry/killswitch.ts` (triggers_opt_out)

### 4. 100% Code Coverage Strategy

- Cover all branching paths in `policyChecker.ts` (`storedVersion === undefined`, `storedVersion < current`, `storedVersion === current`, `changeType === 'minor'`, `changeType === 'material'`).
- Ensure mock drivers for VS Code and Chrome extension test runners achieve 100% branch and line coverage for the new notification handlers.

---

## Mandatory Invariants

1. **Strict Prohibition of PAT (`INV-NO-PAT`)**:
   - The browser extension privacy notification and banner flows MUST NOT require or touch GitHub Personal Access Tokens.
2. **Zero PII Collection (`INV-ZERO-CUSTOMER-DATA`)**:
   - In-client notifications MUST NOT transmit acknowledgments to any central server. Acknowledgments reside solely on local client storage (`chrome.storage.local`, `globalState`, `localStorage`).
3. **Universal Kill-Switch Guarantee (`INV-TELEMETRY-KILLSWITCH`)**:
   - Any notification regarding privacy policy updates MUST provide direct, immediate access to disable diagnostic telemetry.
4. **Mandatory Test Co-Evolution**:
   - Implementation PRs MUST include all new unit, integration, and E2E test suites prior to merge.
5. **Plan Lifecycle & Cleanup Rule**:
   - Upon completion of all implementation milestones and verification, this plan file under `.plans/` **MUST be removed/deleted**.

---

## Milestones & Action Items

### Milestone 1: Manifest, Checksum & CI Gate

- [ ] Create `shared/src/privacy/policyManifest.json` and `shared/src/privacy/policyChecker.ts`.
- [ ] Create `scripts/verify-privacy-sync.mjs` to validate SHA-256 hash between `PRIVACY.md` and `manifest.json`.
- [ ] Add `.github/workflows/privacy-policy-sync.yml` to enforce CI synchronization.
- [ ] Add `tests/privacy-policy-manifest.test.ts`.

### Milestone 2: Browser Extension Banner & Killswitch Access

- [ ] Implement `.privacy-update-banner` in `chrome-extension/src/content.ts` and `sidebar.css`.
- [ ] Bind "Acknowledge" to `chrome.storage.local.set({ privacy_ack_version })`.
- [ ] Bind "Opt-Out" button to direct runtime telemetry shutdown.
- [ ] Add `tests/chrome-privacy-banner.test.ts` and `tests/e2e/privacy-notification.spec.ts`.

### Milestone 3: VS Code & Obsidian In-Editor Notifications

- [ ] Implement `checkPolicyStatus` check on `activate()` in `vscode-extension/src/extension.ts`.
- [ ] Implement `checkPolicyStatus` check on `onload()` in `obsidian-plugin/src/main.ts`.
- [ ] Connect "Review Changes" to canonical website changelog and "Telemetry Settings" to host settings.
- [ ] Add `tests/vscode-privacy-notification.test.ts`.

### Milestone 4: Website Revision History & Syndication Feed

- [ ] Update `website/privacy.html` with Section 7 revision history table and changelog anchor `#changelog`.
- [ ] Create `website/privacy-feed.xml` RSS/Atom feed.
- [ ] Update `PRIVACY.md` Section 7 documenting the active omnichannel notification process.
- [ ] Verify build and packaging compatibility across all targets.
