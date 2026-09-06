# Comprehensive Application Functionality Mapping & Regression Testing Suite Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## 1. Executive Summary & Objectives

### 1.1 Context

The **Markdown Comments (`md-comments`)** monorepo provides a decentralized, collaborative commenting engine for Markdown content across multiple client interfaces:

- **Cross-Browser Extension** (`chrome-extension` targeting Chromium MV3, Firefox MV3, Edge, and Safari)
- **Desktop AI IDE Extensions** (`vscode-extension` VSIX / Open-VSX compatible runtime supporting **VS Code**, **Cursor IDE**, and **Google Antigravity IDE**)
- **Obsidian Community Plugin** (`obsidian-plugin`)
- **Astro Starlight Documentation Plugin** (`starlight-plugin` with SSR/OAuth backend proxy)
- **Shared Core Engine & Standalone Embed JS Variant** (`shared` package and `embed/` delivering the standalone drop-in `md-comments.js` widget for static HTML, doc sites, and web applications)

Because this product operates across diverse host environments (GitHub web DOM, desktop IDEs, local PKM vaults, and static/SSR doc sites) while sharing a unified Git-based data schema (`refs/notes/md-comments` / `.comments.json`), **uncoordinated additions risk introducing behavioral drift, anchor misalignment, security vulnerabilities, or broken authentication flows**.

### 1.2 Core Pillars of the Testing Framework

1. **Pre-Flight Test Environment Orchestration (Local & CI/CD Parity)**:
   - Dedicated GitHub test repository (`md-comments/md-test`) with automated pre-test state wipes (`refs/notes/md-comments`) and fixture synchronization.
   - Zero-setup local development fallback: an embedded hermetic Git HTTP mock server allowing full offline testing with zero manual configuration.
   - Clean browser extension lifecycle in modern headless mode (`--headless=new`) with persistent isolated contexts, service worker tracking, and complete teardown/uninstallation.
2. **Docs-as-Code Feature Knowledge Graph with Open-Source Tooling**:
   - Each feature is stored in an isolated, version-controlled Markdown file with YAML Frontmatter under `quality/features/<category>/FEAT-<ID>.md`.
   - **Zero merge conflicts**: Independent files prevent simultaneous PRs from colliding on monolithic config files.
   - **Open-Source Data Layer (Velite)**: Rather than maintaining custom loaders, the project adopts **Velite** (`velite.config.ts`), a battle-tested OSS library that compiles Markdown with Zod schemas into type-safe, validated TypeScript datasets (`.velite/features.json`) at build time.
   - **Declarative Scaffolding (Plop.js)**: Standard OSS code generator (`pnpm plop feature`) to scaffold uniform feature files with pre-configured schemas and Gherkin scenarios.
3. **Frictionless Authentication Architecture**:
   - All authentication is driven via modern, frictionless interactive protocols:
     - **OAuth Device Authorization Flow (RFC 8628)** for browser extensions and CLI.
     - **Native IDE Authentication Providers** (`vscode.authentication.getSession`) for VS Code, Cursor, and Antigravity.
     - **OAuth Proxy & Starlight Auth Handler** for documentation websites.
4. **Hierarchical Drill-Down Reporting via Open-Source Allure**:
   - Instead of writing custom reporters from scratch, the suite adopts **Allure Report** (`allure-playwright` and `allure-vitest`) coupled with Playwright native `test.step()` hierarchies.
   - Outputs interactive drill-down views (Pillar / Epic -> Feature -> Flow / Story -> Step -> Assertions / Traces) in the console, HTML dashboard, and GitHub Step Summary.
5. **100% Code Coverage Architecture with Free Open-Source Tooling**:
   - Zero-cost coverage pipeline uniting **`@vitest/coverage-v8`** and **`monocart-coverage-reports`** + Playwright CDP JS coverage (for MV3 background workers and injected content scripts).
   - Unified coverage gates enforcing 100% statements, branches, functions, and lines on critical logic.

---

## 2. Docs-as-Code Quality Knowledge Graph (`quality/features/`)

Following industry standards for "Docs-as-Code" (e.g., Spotify Backstage, Kubernetes KEPs, and Astro Content Collections), features, user flows, and architectural invariants are codified as individual Markdown files with structured YAML frontmatter.

```
quality/
├── features/                                     # Isolated Feature Specifications
│   ├── auth/
│   │   ├── FEAT-AUTH-DEVICE.md                   # OAuth Device Flow RFC 8628
│   │   ├── FEAT-AUTH-IDE.md                      # VS Code / Cursor / Antigravity Native Session
│   │   ├── FEAT-AUTH-HYDRATE.md                  # User Profile & Permission Sync
│   │   ├── FEAT-AUTH-RATELIMIT.md                # GitHub 403 Monitoring & Countdown
│   │   └── FEAT-AUTH-SIGNOUT.md                  # Credential Purge & State Reset
│   ├── anchoring/
│   │   ├── FEAT-ANCH-HASH.md                     # Deterministic Paragraph Hashing
│   │   ├── FEAT-ANCH-RELOCATE.md                 # Fuzzy Anchor Relocation
│   │   ├── FEAT-ANCH-ORPHAN.md                   # Orphan Tray & Relocation UI
│   │   └── FEAT-ANCH-COMPLEX.md                  # Tables, Code Fences & Quotes
│   ├── comments/
│   │   ├── FEAT-COMM-INLINE.md                   # Inline Comment Creation
│   │   ├── FEAT-COMM-PAGE.md                     # Whole-Document Page Comments
│   │   ├── FEAT-COMM-EDIT.md                     # In-Place Editing & Versions
│   │   ├── FEAT-COMM-DELETE.md                   # Comment Deletion & Schema Update
│   │   ├── FEAT-COMM-TOOLBAR.md                  # Bold/Italic/Code Formatting Bar
│   │   └── FEAT-COMM-PREVIEW.md                  # Sanitized Markdown Live Preview
│   ├── threads/
│   │   ├── FEAT-THRD-REPLY.md                    # Threaded Replies Hierarchy
│   │   ├── FEAT-THRD-RESOLVE.md                  # Resolve & Reopen Lifecycle
│   │   └── FEAT-THRD-FILTER.md                   # Filter Open vs Resolved Threads
│   ├── reactions/
│   │   ├── FEAT-REAC-TOGGLE.md                   # Emoji Reactions with Optimism
│   │   └── FEAT-REAC-TOOLTIP.md                  # User Names Tooltip & Deduplication
│   ├── mentions/
│   │   ├── FEAT-MENT-DROPDOWN.md                 # @ Autocomplete Dropdown
│   │   └── FEAT-MENT-KEYBOARD.md                 # Keyboard Arrow & Tab Insertion
│   ├── notifications/
│   │   ├── FEAT-NOTF-POLL.md                     # Notification Sync & Tray
│   │   └── FEAT-NOTF-JUMP.md                     # Notification Deep-Linking
│   ├── dom/
│   │   ├── FEAT-DOMI-BLOB.md                     # GitHub Markdown Blob Injection
│   │   ├── FEAT-DOMI-PRDIFF.md                   # GitHub PR Diff View Injection
│   │   ├── FEAT-DOMI-FAB.md                      # Persistent Floating Action Button
│   │   ├── FEAT-DOMI-DRAWER.md                   # Responsive Collapsible Sidebar
│   │   └── FEAT-DOMI-TURBO.md                    # GitHub SPA Turbo Soft Navigation
│   ├── storage/
│   │   ├── FEAT-STOR-GITREF.md                   # refs/notes/md-comments Storage
│   │   ├── FEAT-STOR-RETRY.md                    # Fast-Forward Conflict Auto-Retry
│   │   └── FEAT-STOR-LOCAL.md                    # .comments.json Fallback Mode
│   └── security/
│       ├── FEAT-SECU-XSS.md                      # DOMPurify Markdown Sanitization
│       └── FEAT-SECU-CSP.md                      # Content Security Policy Adherence
├── flows/                                        # Executable Multi-Step User Journeys
│   ├── FLOW-COMM-INLINE.yaml
│   ├── FLOW-AUTH-DEVICE.yaml
│   └── FLOW-DOMI-TURBO.yaml
└── invariants/                                   # Architectural Invariants
    ├── INV-OAUTH-ONLY.md
    ├── INV-XSS-SANITIZED.md
    └── INV-FAST-FORWARD-RETRY.md
```

### 2.1 Feature Specification Example (`quality/features/comments/FEAT-COMM-INLINE.md`)

```markdown
---
id: 'FEAT-COMM-INLINE'
title: 'Inline Paragraph Comment Creation'
category: 'Comments'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'vscode'
  - 'cursor'
  - 'antigravity'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-COMM-INLINE'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/inlineComment.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Inline Paragraph Comment Creation

## Overview

Allows users to hover over any markdown paragraph block, click the floating inline comment bubble, and submit a comment anchored directly to that paragraph.

## User Journey (Gherkin Scenarios)

- **Given** an authenticated user viewing a markdown document on GitHub or Starlight docs
- **When** the cursor hovers over a paragraph block
- **Then** the inline comment bubble appears adjacent to the paragraph in the gutter
- **When** the user clicks the bubble
- **Then** the composer opens with focus in the textarea
- **When** the user types markdown content and clicks "Comment" (or presses Cmd+Enter)
- **Then** an optimistic comment card renders instantly in the thread, and the note is committed to `refs/notes/md-comments`

## Edge Cases & Architectural Considerations

- Code blocks and tables must calculate bounding boxes correctly to prevent hover jitter.
- Soft page navigations (Turbo/Pjax) must re-bind paragraph hover listeners.
```

### 2.2 OSS Content Compilation Engine (Velite Integration)

Instead of developing custom file loaders, the monorepo utilizes **Velite**, an open-source tool that reads Markdown files, validates frontmatter with Zod, and outputs type-safe datasets.

#### Velite Configuration (`velite.config.ts`)

```typescript
import { defineConfig, defineCollection, s } from 'velite';

export const features = defineCollection({
  name: 'Feature',
  pattern: 'quality/features/**/*.md',
  schema: s.object({
    id: s.string(),
    title: s.string(),
    category: s.string(),
    interfaces: s.array(s.string()),
    flowId: s.string(),
    implementedIn: s.array(s.string()),
    verifiedIn: s.array(s.string()),
    invariants: s.array(s.string()).default([]),
    minCoverage: s.number().default(100),
    content: s.markdown(),
  }),
});

export const invariants = defineCollection({
  name: 'Invariant',
  pattern: 'quality/invariants/**/*.md',
  schema: s.object({
    id: s.string(),
    description: s.string(),
    enforcementMechanism: s.string(),
  }),
});

export default defineConfig({
  root: '.',
  output: {
    data: '.velite',
    assets: '.velite/assets',
  },
  collections: { features, invariants },
});
```

#### Utilizing Velite in Automated Tests

```typescript
// tests/qualityGraph.test.ts
import { describe, it, expect } from 'vitest';
import { features, invariants } from '../.velite';

describe('Quality Knowledge Graph Invariants', () => {
  it('validates that all features have mapped test implementations', () => {
    for (const feature of features) {
      expect(feature.verifiedIn.length).toBeGreaterThan(0);
    }
  });

  it('validates that all feature dependencies exist', () => {
    const featureIds = new Set(features.map((f) => f.id));
    for (const feature of features) {
      if ('dependsOn' in feature && Array.isArray((feature as any).dependsOn)) {
        for (const depId of (feature as any).dependsOn) {
          expect(featureIds.has(depId)).toBe(true);
        }
      }
    }
  });
});
```

### 2.3 OSS Declarative Scaffolding (Plop.js)

For rapid creation of new feature documents matching the repository's schema, **Plop.js** is configured as the standard generator:

```javascript
// plopfile.mjs
export default function (plop) {
  plop.setGenerator('feature', {
    description: 'Scaffold a new Markdown feature specification with YAML frontmatter',
    prompts: [
      { type: 'input', name: 'id', message: 'Feature ID (e.g. FEAT-COMM-POPOVER):' },
      { type: 'input', name: 'title', message: 'Feature Title:' },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          'auth',
          'anchoring',
          'comments',
          'threads',
          'reactions',
          'mentions',
          'notifications',
          'dom',
          'storage',
          'security',
        ],
      },
      { type: 'input', name: 'flowId', message: 'Primary Flow ID (e.g. FLOW-COMM-POPOVER):' },
    ],
    actions: [
      {
        type: 'add',
        path: 'quality/features/{{category}}/{{id}}.md',
        templateFile: 'quality/templates/feature.md.hbs',
      },
    ],
  });
}
```

---

## 3. Hierarchical Drill-Down Test Reporting with Open-Source Allure

To avoid building and maintaining a custom test reporter, the suite standardizes on **Allure Report** (`allure-playwright` and `allure-vitest`), the industry-standard OSS framework for hierarchical test tracking, combined with Playwright native `test.step()`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ALLURE HIERARCHICAL DRILL-DOWN ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   Epic: Quality Pillar (e.g., Core Comments & Threading)                               │
│     └── Feature: Feature ID (e.g., FEAT-COMM-INLINE)                                   │
│           └── Story: User Flow ID (e.g., FLOW-COMM-INLINE)                             │
│                 ├── Step 1: Hover paragraph in margin ......... [Passed, 12ms]          │
│                 ├── Step 2: Click inline comment badge ........ [Passed, 24ms]          │
│                 ├── Step 3: Type markdown in composer ......... [Passed, 45ms]          │
│                 └── Step 4: Submit & verify optimistic card ... [Passed, 89ms]          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Playwright Test Integration (`tests/e2e/inlineComment.spec.ts`)

```typescript
import { test, expect } from './fixtures/extensionFixture';
import * as allure from 'allure-js-commons';

test.describe('Inline Comments', () => {
  test('Create inline paragraph comment', async ({ testPage }) => {
    await allure.epic('Core Comments & Threading');
    await allure.feature('FEAT-COMM-INLINE');
    await allure.story('FLOW-COMM-INLINE');

    await test.step('Step 1: Navigate to fixture README', async () => {
      await testPage.goto('https://github.com/md-comments/md-test/blob/main/README.md');
      await expect(testPage.locator('.markdown-body')).toBeVisible();
    });

    await test.step('Step 2: Hover target paragraph', async () => {
      const paragraph = testPage.locator('.markdown-body p').first();
      await paragraph.hover();
      await expect(testPage.locator('.md-comments-inline-badge')).toBeVisible();
    });

    await test.step('Step 3: Click badge to open composer', async () => {
      await testPage.click('.md-comments-inline-badge');
      await expect(testPage.locator('.md-comments-composer textarea')).toBeFocused();
    });

    await test.step('Step 4: Type markdown & submit', async () => {
      await testPage.fill('.md-comments-composer textarea', '**Automated Test Comment**');
      await testPage.click('.md-comments-submit-btn');
      await expect(testPage.locator('.md-comments-card')).toContainText('Automated Test Comment');
    });
  });
});
```

### 3.2 Allure Reporting Configuration & Outputs

1. **Playwright Config (`playwright.config.ts`)**:
   ```typescript
   export default {
     reporter: [
       ['list'],
       ['html', { open: 'never' }],
       ['allure-playwright', { outputFolder: 'allure-results' }],
     ],
   };
   ```
2. **Interactive HTML Dashboard**: Running `npx allure generate allure-results --clean -o coverage/allure-report` generates a single-page interactive dashboard with filtering, search, failure graphs, and execution timelines.
3. **GitHub Step Summary**: An automated CI step converts the Allure summary into native Markdown tables posted directly to `$GITHUB_STEP_SUMMARY`.

---

### 3.3 Automated Failure Telemetry & AI Diagnostic Packet Collector

When a test fails, human developers and AI coding agents need immediate, comprehensive telemetry without having to manually rerun tests or dig through terminal noise. The test harness automatically captures:

1. **Console Logs Ring Buffer**: All browser `console.log`, `console.warn`, `console.error`, and `pageerror` stack traces.
2. **Network Traffic & API Failures**: Failed HTTP requests (`requestfailed`) and non-2xx/3xx responses (403 rate limits, 409 conflicts, 500 errors) with full URLs, headers, request bodies, and response payloads.
3. **DOM State at Failure**: Outer HTML of the failing selector and parent container at the exact moment of failure.
4. **Visual Artifacts**: Full-page failure screenshot and Playwright trace archive (`trace.zip`).

#### Telemetry Collector Fixture (`tests/e2e/fixtures/diagnosticCollector.ts`)

```typescript
import { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface NetworkLogEntry {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  requestBody?: string;
  responseBody?: string;
  failure?: string;
}

export class DiagnosticCollector {
  private consoleLogs: string[] = [];
  private networkLogs: NetworkLogEntry[] = [];

  constructor(private page: Page) {
    // 1. Capture Browser Console Events
    this.page.on('console', (msg) => {
      this.consoleLogs.push(
        `[${msg.type().toUpperCase()}] ${msg.text()} (${msg.location().url}:${msg.location().lineNumber})`
      );
    });
    this.page.on('pageerror', (err) => {
      this.consoleLogs.push(`[PAGE ERROR] ${err.message}\n${err.stack || ''}`);
    });

    // 2. Capture Network Requests & Failures
    this.page.on('requestfailed', (req) => {
      this.networkLogs.push({
        url: req.url(),
        method: req.method(),
        failure: req.failure()?.errorText || 'Unknown failure',
      });
    });

    this.page.on('response', async (res) => {
      if (res.status() >= 400) {
        let responseBody = '<unavailable>';
        try {
          responseBody = await res.text();
        } catch {}
        this.networkLogs.push({
          url: res.url(),
          method: res.request().method(),
          status: res.status(),
          statusText: res.statusText(),
          requestBody: res.request().postData() || undefined,
          responseBody: responseBody.slice(0, 1000), // Cap size
        });
      }
    });
  }

  // Generate self-contained AI Triage Markdown Packet on failure
  public async generateTriagePacket(
    testInfo: TestInfo,
    featureId: string,
    flowId: string,
    suspectFiles: string[]
  ) {
    const failureDir = path.resolve(process.cwd(), 'artifacts/ai-triage');
    fs.mkdirSync(failureDir, { recursive: true });

    // Capture DOM near failed selector
    let domSnippet = '<no dom captured>';
    try {
      domSnippet = await this.page.evaluate(() => {
        const body = document.querySelector('.markdown-body') || document.body;
        return body.outerHTML.slice(0, 3000);
      });
    } catch {}

    const screenshotPath = path.join(
      failureDir,
      `${testInfo.title.replace(/\s+/g, '_')}_failure.png`
    );
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    const triageMarkdown = `# 🚨 AI Diagnostic Packet: Failure in [${flowId}]

## 1. Executive Failure Summary
- **Feature**: \`${featureId}\`
- **Flow**: \`${flowId}\`
- **Test Title**: ${testInfo.title}
- **Test File**: \`${testInfo.file}:${testInfo.line}\`
- **Duration**: ${testInfo.duration}ms
- **Reproduction Command**: \`pnpm test:e2e --grep "${featureId}"\`

## 2. Exact Error & Stack Trace
\`\`\`
${testInfo.error?.message || 'No error message'}
${testInfo.error?.stack || ''}
\`\`\`

## 3. Suspect Code Locations
${suspectFiles.map((f) => `- [${f}](file://${path.resolve(process.cwd(), f)})`).join('\n')}

## 4. Browser Console Output
\`\`\`log
${this.consoleLogs.length > 0 ? this.consoleLogs.join('\n') : 'No console output logged.'}
\`\`\`

## 5. Network Traffic & API Failures (HTTP >= 400)
\`\`\`json
${this.networkLogs.length > 0 ? JSON.stringify(this.networkLogs, null, 2) : '[] (No failed network requests)'}
\`\`\`

## 6. DOM Snapshot at Failure
\`\`\`html
${domSnippet}
\`\`\`

## 7. Attached Artifacts
- **Screenshot**: \`${screenshotPath}\`
- **Trace Archive**: Run \`npx playwright show-trace ${testInfo.outputDir}/trace.zip\`
`;

    const packetPath = path.join(failureDir, `${featureId}_failure.md`);
    fs.writeFileSync(packetPath, triageMarkdown, 'utf8');
    console.log(`\n👉 AI Triage Packet generated: ${packetPath}\n`);
    return packetPath;
  }
}
```

---

### 3.4 Automated Feedback Loop into AI Coding Agents

The generated **AI Diagnostic Packet** is formatted specifically for direct consumption by autonomous AI coding assistants (such as Google Antigravity, Claude Code, or Cursor):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AUTONOMOUS AI AGENT REPAIR WORKFLOW                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. TEST FAILS IN HEADLESS RUNNER                                                       │
│    └── DiagnosticCollector generates artifacts/ai-triage/FEAT-COMM-INLINE_failure.md  │
│                                      ▼                                                  │
│ 2. REPRODUCTION & CODE ANALYSIS                                                        │
│    └── Agent receives markdown packet: exact selector, stack trace, and console logs    │
│    └── Reads suspect file (e.g., chrome-extension/src/content.ts:188)                  │
│                                      ▼                                                  │
│ 3. AUTONOMOUS REPAIR & LOCAL VERIFICATION                                              │
│    ├── Agent applies bug fix to source file                                            │
│    └── Runs targeted reproduction command: pnpm test:e2e --grep "FEAT-COMM-INLINE"     │
│                                      ▼                                                  │
│ 4. PRE-COMMIT CHECKS & CI RETRY                                                        │
│    └── Agent runs pnpm check (tests + 100% coverage gate) and commits fix               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Local Developer Mode**: When tests fail locally, the agent simply views the triage packet (`view_file artifacts/ai-triage/FEAT-COMM-INLINE_failure.md`) to formulate an immediate fix without having to re-run the full browser session.
2. **CI/CD Mode**: In GitHub Actions, when a nightly run fails, the CI workflow extracts the triage markdown and automatically embeds the entire packet directly into the body of the generated GitHub Issue, allowing AI agents to triage and fix issues via automation.

---

## 4. Pre-Flight Test Environment Orchestration Framework

Before kicking off any automated tests—particularly Playwright browser extension tests in headless mode—a hermetic, reproducible environment must be prepared, validated, and torn down.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           TEST RUN LIFECYCLE PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. PRE-FLIGHT ENVIRONMENT SETUP                                                         │
│    ├── Build Extensions & Packages (pnpm build:shared && pnpm build:chrome)             │
│    ├── Clean & Reset GitHub Test Repo (md-comments/md-test) via Git Data API            │
│    └── Prepare Isolated Temp Browser Profile (/tmp/pw-profile-<uuid>)                   │
│                                      ▼                                                  │
│ 2. EXTENSION INSTALLATION & RUNTIME BOOT                                                │
│    ├── Launch Chromium in Modern Headless (--headless=new, --load-extension)            │
│    ├── Verify Extension ID & Service Worker Registration                                │
│    └── Inject OAuth Session Credentials into chrome.storage.local                       │
│                                      ▼                                                  │
│ 3. TEST SUITE EXECUTION & COVERAGE CAPTURE                                              │
│    ├── Start CDP Profiler / Coverage Collectors                                         │
│    ├── Execute Knowledge Graph Flows (FLOW-*) with Allure Step Tracking                 │
│    └── Stop Coverage & Extract V8 Execution Dumps                                       │
│                                      ▼                                                  │
│ 4. TEARDOWN & REPO CLEANUP                                                              │
│    ├── Uninstall Extension (Unregister workers, purge chrome.storage)                   │
│    ├── Destroy Temp User Data Directory                                                │
│    └── Wipe Test Git Refs on Remote Repository (md-comments/md-test)                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Dedicated GitHub Test Repository Management (`md-comments/md-test`)

```typescript
// scripts/test-repo-cleanup.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.TEST_GITHUB_TOKEN || process.env.GITHUB_TOKEN });
const OWNER = process.env.TEST_REPO_OWNER || 'md-comments';
const REPO = process.env.TEST_REPO_NAME || 'md-test';

export async function resetTestRepository() {
  if (!process.env.TEST_GITHUB_TOKEN && !process.env.CI) {
    console.log(
      '[Test Repo] Local environment detected without token; using embedded mock Git backend.'
    );
    return;
  }

  console.log(`[Test Repo] Resetting ${OWNER}/${REPO}...`);

  // 1. Purge md-comments Git Ref: refs/notes/md-comments
  try {
    await octokit.git.deleteRef({
      owner: OWNER,
      repo: REPO,
      ref: 'notes/md-comments',
    });
    console.log('[Test Repo] Purged refs/notes/md-comments successfully.');
  } catch (err: any) {
    if (err.status === 404 || err.status === 422) {
      console.log('[Test Repo] Ref already clean.');
    } else {
      console.warn('[Test Repo] Warning while deleting ref:', err.message);
    }
  }

  // 2. Restore standard fixture README.md
  const fixtureContent = Buffer.from(
    '# Test Markdown Repository\n\nBaseline paragraph for automated test suite execution.\n\n## Subheading\n\nSecond paragraph for inline comments.\n'
  ).toString('base64');

  try {
    let sha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'README.md',
      });
      if ('sha' in existing.data) sha = existing.data.sha;
    } catch {}

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'README.md',
      message: 'ci: reset test fixture README.md [skip ci]',
      content: fixtureContent,
      sha,
    });
    console.log('[Test Repo] Synchronized clean fixture README.md');
  } catch (err: any) {
    console.error('[Test Repo] Failed to synchronize README.md:', err.message);
    throw err;
  }
}
```

### 4.2 Headless Playwright Extension Lifecycle (`tests/e2e/fixtures/extensionFixture.ts`)

```typescript
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { resetTestRepository } from '../../../scripts/test-repo-cleanup';

export const pathToExtension = path.resolve(__dirname, '../../../chrome-extension/dist');

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  testPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    // 1. Clean test repo before starting
    await resetTestRepository();

    // 2. Prepare isolated temporary profile directory
    const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chrome-profile-'));

    // 3. Launch Chromium in modern headless mode with extension loaded
    const context = await chromium.launchPersistentContext(tempUserDataDir, {
      headless: true,
      args: [
        '--headless=new',
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-gpu',
      ],
    });

    // 4. Inject OAuth session credentials into chrome.storage.local
    let [backgroundWorker] = context.serviceWorkers();
    if (!backgroundWorker) backgroundWorker = await context.waitForEvent('serviceworker');

    await backgroundWorker.evaluate(async () => {
      await chrome.storage.local.set({
        oauth_token: 'mock-oauth-session-token',
        github_user: {
          login: 'test-runner-bot',
          name: 'Test Runner Bot',
          avatar_url: 'https://github.com/ghost.png',
        },
      });
    });

    await use(context);

    // 5. Teardown: Uninstall extension, purge profile, reset refs
    try {
      await context.close();
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      console.log('[Teardown] Purged temporary browser profile and uninstalled extension.');
    } catch (err) {
      console.warn('[Teardown] Cleanup warning:', err);
    }
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  testPage: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});
```

---

## 5. Free 100% Code Coverage Architecture

The monorepo utilizes a **100% free, MIT-licensed toolchain** to enforce strict coverage gates without paid services:

1. **`@vitest/coverage-v8`**: Built-in V8 AST coverage for unit, algorithmic, and backend tests.
2. **`monocart-coverage-reports`** + **Chrome DevTools Protocol (CDP)**: Precise V8 coverage for Chrome MV3 background service workers and injected content scripts.

```typescript
// mcr.config.ts
import { CoverageReportOptions } from 'monocart-coverage-reports';

const config: CoverageReportOptions = {
  name: 'Markdown Comments Unified 100% Coverage Report',
  outputDir: './coverage/consolidated',
  reports: ['v8', 'console-summary', 'lcovonly', 'html'],
  entryFilter: (entry) => {
    return (
      (entry.url.includes('shared/') || entry.url.includes('chrome-extension/src/')) &&
      !entry.url.includes('node_modules')
    );
  },
  thresholds: {
    100: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;
```

---

## 6. GitHub Actions CI/CD Pipeline Specification

`.github/workflows/nightly-regression.yml` executes nightly at 02:00 UTC and on manual dispatch:

```yaml
name: Comprehensive Regression & Knowledge Graph Suite

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:
    inputs:
      reason:
        description: 'Trigger reason'
        default: 'Manual drift verification'

jobs:
  knowledge-graph-and-unit:
    name: Knowledge Graph Integrity & Unit Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Compile Feature Graph with Velite
        run: npx velite

      - name: Validate Knowledge Graph Integrity
        run: pnpm test tests/qualityGraph.test.ts

      - name: Run Vitest Unit Tests with V8 Coverage & Allure
        run: pnpm test:coverage

      - name: Upload Unit Coverage
        uses: actions/upload-artifact@v4
        with:
          name: unit-coverage
          path: coverage/

  headless-playwright-e2e:
    name: Headless Playwright Extension E2E
    needs: knowledge-graph-and-unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Chrome Extension & Packages
        run: pnpm build:shared && pnpm build:chrome

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Pre-Flight Clean Test Repository
        env:
          TEST_GITHUB_TOKEN: ${{ secrets.TEST_GITHUB_TOKEN }}
          TEST_REPO_OWNER: 'md-comments'
          TEST_REPO_NAME: 'md-test'
        run: npx tsx scripts/test-repo-cleanup.ts

      - name: Run Headless Playwright Tests with Allure Reporter
        env:
          TEST_GITHUB_TOKEN: ${{ secrets.TEST_GITHUB_TOKEN }}
        run: npx playwright test tests/e2e/browser-extension/ --project=chromium-headless

      - name: Post-Test Cleanup Test Repository
        if: always()
        env:
          TEST_GITHUB_TOKEN: ${{ secrets.TEST_GITHUB_TOKEN }}
        run: npx tsx scripts/test-repo-cleanup.ts

      - name: Upload Allure Results & Coverage
        uses: actions/upload-artifact@v4
        with:
          name: allure-results
          path: allure-results/

  coverage-and-reporting-gate:
    name: Consolidate 100% Coverage & Publish Allure Summary
    needs: [knowledge-graph-and-unit, headless-playwright-e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - uses: actions/download-artifact@v4
        with:
          name: allure-results
          path: allure-results/

      - name: Generate Allure Report
        run: npx allure generate allure-results --clean -o coverage/allure-report

      - name: Consolidate Coverage with Free Monocart Reporter
        run: npx mcr --config mcr.config.ts

      - name: Publish Summary to Step Summary
        run: |
          echo "## 📊 Test Regression & 100% Coverage Verification" >> $GITHUB_STEP_SUMMARY
          cat coverage/consolidated/summary.md >> $GITHUB_STEP_SUMMARY || true

  ai-diagnostic-and-alert:
    name: AI Diagnostic Packet & Regression Alert
    if: failure()
    needs: [knowledge-graph-and-unit, headless-playwright-e2e, coverage-and-reporting-gate]
    runs-on: ubuntu-latest
    steps:
      - name: Upload AI Triage Packets
        uses: actions/upload-artifact@v4
        with:
          name: ai-triage-packets
          path: artifacts/ai-triage/

      - name: Create GitHub Issue with Embedded AI Diagnostic Packet
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');
            const triageDir = path.resolve('artifacts/ai-triage');
            let issueBody = `## 🚨 Automated Regression Drift Detected (${new Date().toISOString().split('T')[0]})\n\n`;

            if (fs.existsSync(triageDir)) {
              const files = fs.readdirSync(triageDir).filter(f => f.endsWith('.md'));
              for (const file of files) {
                const content = fs.readFileSync(path.join(triageDir, file), 'utf8');
                issueBody += `\n<details><summary><b>Failure Packet: ${file}</b></summary>\n\n${content}\n\n</details>\n`;
              }
            } else {
              issueBody += `Nightly regression suite failed. Inspect Actions run [${context.runId}](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for traces.\n`;
            }

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 Regression Failure: Behavioral Drift Detected (${new Date().toISOString().split('T')[0]})`,
              body: issueBody,
              labels: ['bug', 'automated-regression', 'ai-triage']
            });
```

---

## 7. Phased Implementation Roadmap

### Phase 0: Test Environment Orchestration Framework

- [x] Implement `scripts/test-repo-cleanup.ts` targeting `md-comments/md-test` with automated GitHub Git Data API ref wipes.
- [x] Implement `tests/e2e/fixtures/extensionFixture.ts` supporting `--headless=new`, isolated temp profile directories, and OAuth session mocks.
- [x] Implement zero-setup local fallback mock server in `tests/mocks/localMockServer.ts` for offline developer runs.

### Phase 1: OSS Docs-as-Code Setup & Feature Catalog Scaffolding

- [x] Install and configure `velite` (`velite.config.ts`) to validate and compile `quality/features/**/*.md` into type-safe data.
- [x] Configure `plopfile.mjs` for templated feature scaffolding (`pnpm plop feature`).
- [x] Scaffold all 34+ feature markdown files across `quality/features/` with YAML frontmatter and Gherkin scenarios.
- [x] Implement `tests/qualityGraph.test.ts` to assert zero orphaned features and 100% test mappings.

### Phase 2: Free 100% Code Coverage Tooling Setup

- [x] Configure `monocart-coverage-reports` via `mcr.config.ts` to unify Vitest V8 outputs and Playwright CDP JS profiler dumps.
- [x] Implement `tests/e2e/fixtures/coverageHelper.ts` to attach CDP sessions to MV3 background service workers and content scripts.
- [x] Set 100% coverage thresholds across lines, statements, functions, and branches.

### Phase 3: Open-Source Allure Drill-Down Test Reporting Setup

- [ ] Install `allure-playwright` and `allure-vitest`.
- [ ] Configure Playwright and Vitest to emit Allure test results with Epic, Feature, Story, and Step metadata.
- [ ] Add `pnpm test:report` script to generate and open the interactive Allure HTML dashboard.

### Phase 4: Headless Playwright Regression Test Suites

- [ ] Implement Playwright regression tests importing flows directly from feature definitions and using `test.step()` hierarchies:
  - [ ] OAuth Device Flow (`FEAT-AUTH-DEVICE`)
  - [ ] Native IDE Auth Session (`FEAT-AUTH-IDE`)
  - [ ] Anchor Hashing & Fuzzy Relocation (`FEAT-ANCH-HASH`, `FEAT-ANCH-RELOCATE`)
  - [ ] Inline & Page Comment Creation (`FEAT-COMM-INLINE`, `FEAT-COMM-PAGE`)
  - [ ] Threaded Replies & Resolve Lifecycle (`FEAT-THRD-REPLY`)
  - [ ] Emoji Reactions & Mentions (`FEAT-REAC-TOGGLE`, `FEAT-MENT-DROPDOWN`)
  - [ ] GitHub DOM Injection & SPA Turbo Soft Navigation (`FEAT-DOMI-BLOB`, `FEAT-DOMI-TURBO`)

### Phase 5: CI/CD Pipeline & 100% Coverage Gate Integration

- [ ] Commit `.github/workflows/nightly-regression.yml` with scheduled cron and manual dispatch.
- [ ] Validate full green test run, Allure report artifact generation, and 100% coverage gate pass on GitHub Actions.

---

## 8. Verification & Acceptance Criteria

This plan execution will be considered complete when:

1. **Dedicated Test Repo Lifecycle**: Automated scripts cleanly wipe `refs/notes/md-comments` and restore fixtures on `md-comments/md-test`.
2. **Docs-as-Code Feature Catalog**: All 34+ features exist as individual Markdown files in `quality/features/`, compiled and validated by **Velite** with zero merge conflicts.
3. **Frictionless Modern Authentication**: 100% of tests and features operate via OAuth Device Flow, Native IDE Auth providers, or OAuth Proxies.
4. **Hierarchical Drill-Down Reporting**: Test results display high-level summaries and hierarchical drill-down trees (Epic -> Feature -> Story -> Step) powered by **Allure Report** in HTML and GitHub Step Summary.
5. **100% Code Coverage**: Free tooling (`@vitest/coverage-v8` + `monocart-coverage-reports`) achieves 100% statement, branch, function, and line coverage gates.
