# Unified Download Clicks & Multi-Marketplace Analytics Dashboard Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Markdown Comments is distributed across a diverse multi-platform ecosystem:

- **Safari macOS Extension**: Direct `.dmg` binary download (`Markdown-Comments-macOS.dmg`) hosted via GitHub Releases.
- **Chrome Web Store**: Browser extension for Chromium browsers (Chrome, Brave, Arc, Edge).
- **Agentic IDEs & Editors**: VS Code Marketplace & Open VSX Registry (for Cursor, Google Antigravity, VS Code, VSCodium).
- **Websites & Documentation Portals**: npm packages (`@md-comments/embed`, `@md-comments/starlight`, `@md-comments/core`) and HTML embed script snippet.
- **Desktop Apps**: Obsidian community plugin & release assets.
- **GitHub App**: `github.com/apps/markdown-comments`.

### The Problem

Currently, maintainers lack visibility into:

1. **User Intent / Conversion Clicks**: How many visitors click "Download for Safari (.dmg)", "Install Chrome Extension", "Install for VS Code", or copy the npm embed snippet on the landing page?
2. **Actual Multi-Marketplace Metrics**: How many true downloads/installs occur across GitHub Releases (DMG), npm, VS Code Marketplace, Open VSX, and Obsidian?
3. **Consolidated Visibility**: Metrics are scattered across vendor consoles and APIs with no single pane of glass.

### Core Invariants

1. **Zero Cost Invariant (`INV-ZERO-COST`)**: The entire solution must be **100% free forever**—zero subscription fees, zero paid analytics SaaS, and zero credit card requirements. It leverages free tiers of GitHub Actions, GitHub Pages, Cloudflare Workers (100k req/day free, D1 database free tier: 5M reads/day, 100k writes/day, $0), and open public APIs.
2. **Strict Zero-PII Invariant (`INV-ZERO-PII`)**: In accordance with [`PRIVACY.md`](../PRIVACY.md), click tracking records only anonymous aggregated counters (`date`, `channel`, `click_count`). No IP addresses, persistent user IDs, or cookies are ever stored.
3. **Strict Zero-PAT Invariant (`INV-NO-PAT`)**: No personal access tokens are required or used.

---

## Duplicate Prevention Architecture

Deduplication occurs at two distinct layers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. WEBSITE CLICK DEDUPLICATION (Intent Clicks)                                         │
│                                                                                        │
│  [User Click] ──> [Client-Side Debounce & Session Key] ──> [CF Worker Ephemeral Hash]  │
│                   (Suppresses double-clicks & rapid         (HMAC IP + Channel in 10m  │
│                    reloads within same browser session)      window dropped at Edge)   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. MARKETPLACE & REGISTRY DEDUPLICATION (Actual Downloads)                             │
│                                                                                        │
│  [Daily Cron 00:00 UTC] ──> [Fetch Monotonic Totals] ──> [Idempotent Date Upsert]      │
│                             (GitHub, npm, VS Code)       (Normalized to YYYY-MM-DD     │
│                                                           re-runs never create dupes)  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Marketplace & Registry Deduplication (Actual Downloads)

1. **Monotonic Cumulative Counters**:
   - The GitHub Releases API (`assets[].download_count`), VS Code Marketplace API (`statistics.install`), Open VSX API (`downloadCount`), and Obsidian Stats JSON all report **lifetime cumulative counters**, not delta events.
2. **Idempotent Daily Upserts**:
   - In `website/data/analytics.json`, historical data is keyed deterministically by calendar date (`YYYY-MM-DD`).
   - If the GitHub Action runs multiple times on the same day (e.g. scheduled cron + manual `workflow_dispatch`), it **overwrites (upserts)** that day's entry rather than appending duplicate rows.
3. **Deterministic Delta Math**:
   - Daily new downloads are calculated mathematically: `daily_new = today_total - yesterday_total`. This guarantees zero count inflation or drift.

### 2. Website Click Deduplication (Intent Clicks)

1. **Client-Side Debounce & Session Deduplication (Zero-PII)**:
   - **Rapid-Click Debounce**: Clicking a download button disables duplicate event firing for 5 seconds.
   - **Session Suppression**: When a user clicks "Download Safari DMG", `sessionStorage.setItem('downloaded_safari_dmg', Date.now())` marks that download intent for that browser tab session. Subsequent clicks within the same session do not dispatch redundant network beacons.
2. **Edge Worker Ephemeral Fingerprint (Without Storing IPs)**:
   - Raw IP addresses are **never stored**.
   - Instead, the Cloudflare Worker computes an in-memory ephemeral hash:
     ```ts
     const windowKey = `${Math.floor(Date.now() / 600000)}`; // 10-minute bucket
     const anonHash = await crypto.subtle.digest(
       'SHA-256',
       new TextEncoder().encode(`${clientIp}:${channel}:${windowKey}:${dailySalt}`)
     );
     ```
   - If the same `anonHash` is seen within the 10-minute sliding window, the Worker returns `200 OK` (so the client succeeds) but **discards the duplicate count**.

---

## Cloudflare Worker Creation & Security Architecture

The repository already contains the base setup in [`infrastructure/telemetry-proxy/`](file:///Users/maratstrelets/git/md-comments/md-comments/infrastructure/telemetry-proxy/).

### 1. Creation & Provisioning (100% Free Tier)

1. **Free Cloudflare D1 Database**:
   - D1 is Cloudflare's serverless SQLite database, offering **5 million reads/day** and **100,000 writes/day** for **$0/month**.
   - Provisioned via Wrangler CLI:
     ```bash
     cd infrastructure/telemetry-proxy
     npx wrangler d1 create md-comments-analytics
     ```
2. **Wrangler Binding (`wrangler.toml`)**:
   Add D1 binding and environment variables to [`infrastructure/telemetry-proxy/wrangler.toml`](file:///Users/maratstrelets/git/md-comments/md-comments/infrastructure/telemetry-proxy/wrangler.toml):
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "md-comments-analytics"
   database_id = "<D1_UUID_FROM_CREATE>"

   [vars]
   ALLOWED_ORIGINS = "https://md-comments.com,https://www.md-comments.com,http://localhost:3000"
   MAX_CLICKS_PER_MINUTE = "10"
   ```
3. **Database Schema Initialization**:
   A simple aggregated table (strictly zero PII):
   ```sql
   CREATE TABLE IF NOT EXISTS daily_click_stats (
     date TEXT NOT NULL,          -- 'YYYY-MM-DD'
     channel TEXT NOT NULL,       -- 'safari_dmg', 'chrome_store', etc.
     click_count INTEGER DEFAULT 0,
     PRIMARY KEY (date, channel)
   );
   ```
   When a click arrives:
   ```sql
   INSERT INTO daily_click_stats (date, channel, click_count)
   VALUES (?1, ?2, 1)
   ON CONFLICT(date, channel) DO UPDATE SET click_count = click_count + 1;
   ```

### 2. Worker Security & Defense-in-Depth

1. **Strict CORS Whitelist**:
   - For `/api/track`, the worker rejects any request whose `Origin` or `Referer` does not match `https://md-comments.com` (or authorized localhost/preview domains).
2. **Payload Size Defense & Schema Validation**:
   - Payload limit is strictly locked at **1 KB** (since a click event is only `{"channel": "safari_dmg"}`). Any payload larger than 1 KB is rejected with `413 Payload Too Large`.
   - Strict channel enum check: Only approved channel strings (`safari_dmg`, `chrome_webstore`, `vscode_marketplace`, `openvsx`, `npm_embed`, `obsidian`, `github_app`) are processed. Any arbitrary string is rejected with `400 Bad Request`.
3. **Rate Limiting (Anti-Spam / Anti-Scraper)**:
   - Enforces IP sliding-window throttling (already implemented via `checkRateLimit` in `worker.ts`), capping requests to max 10 per minute per IP.
   - Cloudflare Bot Fight Mode enabled on Cloudflare dashboard to drop automated scraper traffic.
4. **Harvester Read Authentication (`INV-ZERO-CLIENT-SECRETS`)**:
   - The public website only has write access to POST `/api/track` (to record clicks).
   - The read endpoint `/api/stats` (which returns aggregated numbers to the GitHub Action harvester) is protected by a secret Bearer token:
     ```bash
     npx wrangler secret put HARVESTER_SECRET_KEY
     ```
   - Only the GitHub Action cron job holding `secrets.HARVESTER_SECRET_KEY` can read or export raw historical aggregates.
5. **Zero PII Guarantee (`INV-ZERO-PII`)**:
   - The database only contains rows of `(date, channel, click_count)`.
   - Client IPs, user agents, cookies, and tokens are never written to disk or database.

---

## Free Public APIs & Metric Sources

| Channel / Interface         | Metric Tracked                                                                                                 | Ingestion Method / Endpoint                                                                                                              | Cost                                                   | Auth Required          |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :--------------------- |
| **Website Download Clicks** | Button clicks (Safari DMG, Chrome Web Store, VS Code, Open VSX, npm, Obsidian, GitHub App, embed snippet copy) | `website/main.js` `sendBeacon` to Cloudflare Worker `/api/track`                                                                         | $0 (Free Cloudflare D1: 100k writes/day, 5M reads/day) | None (CORS-scoped)     |
| **Safari macOS DMG**        | Actual `.dmg` downloads from GitHub Releases                                                                   | GitHub Releases API: `GET /repos/md-comments/md-comments/releases` (`assets[].download_count`)                                           | $0                                                     | Default `GITHUB_TOKEN` |
| **npm Packages**            | Downloads for `@md-comments/embed`, `@md-comments/starlight`, `@md-comments/core`                              | Official npm Registry API: `GET https://api.npmjs.org/downloads/point/last-day/{pkg}` and `range/last-month/{pkg}`                       | $0                                                     | None (Public open API) |
| **VS Code Marketplace**     | Installs, updates, ratings for `md-comments.md-preview-comments`                                               | Official VS Code Gallery API: `POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery`                            | $0                                                     | None (Public open API) |
| **Open VSX Registry**       | Download count, reviews for `md-comments/md-preview-comments`                                                  | Official Open VSX API: `GET https://open-vsx.org/api/md-comments/md-preview-comments`                                                    | $0                                                     | None (Public open API) |
| **Obsidian Community**      | Total plugin installs                                                                                          | Obsidian Official Releases Feed: `GET https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json` | $0                                                     | None (Public raw JSON) |
| **Chrome Web Store**        | Active users, rating                                                                                           | Chrome Web Store public metadata parser / ChromeStats free tier                                                                          | $0                                                     | None                   |

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### New Tests to Create

1. **Unit Tests (`tests/unit/analytics-harvester.test.ts`)**:
   - Verify idempotent daily upsert math (`daily_new = today_total - yesterday_total`).
   - Mock external API responses (npm, GitHub releases, VS Code Marketplace, Open VSX, Obsidian).
   - Test rate-limit and network timeout handling (graceful fallback without crashing the build).
2. **Integration Tests (`tests/unit/click-deduplication.test.ts`)**:
   - Verify `website/main.js` debounce timer and `sessionStorage` deduplication.
   - Verify Cloudflare Worker ephemeral 10-minute hash sliding window drops duplicates.
   - Verify 1 KB payload size cutoff and origin whitelisting.
3. **Headless Playwright E2E Tests (`tests/e2e/analytics-dashboard.spec.ts`)**:
   - Verify `website/analytics.html` loads cleanly without console errors in Chromium and WebKit.
   - Verify KPI cards display formatted numbers from fixture data.
   - Verify theme toggle (light/dark) applies cleanly to charts.
   - Verify button clicks on `website/index.html` dispatch beacon events to `/api/track`.

### In-Code Knowledge Graph Nodes

- `shared/knowledge-graph/nodes/analytics-harvester.ts`: Node defining the multi-platform metric harvesting schema and error handling contracts.
- `shared/knowledge-graph/nodes/click-tracker.ts`: Node defining anonymous click events, deduplication, and privacy invariants.

### 100% Coverage Preservation

- All newly added harvester scripts and client click utilities must maintain 100% test coverage with mocks for external network calls.

---

## Milestones & Action Items

### Milestone 1: Anonymous Website Click Tracking & Deduplication

- [ ] Add `data-track-channel` attributes to download/install buttons in `website/index.html`.
- [ ] Implement debounced `initClickTracking()` with `sessionStorage` deduplication in `website/main.js`.
- [ ] Provision free Cloudflare D1 database (`md-comments-analytics`) via Wrangler.
- [ ] Implement `/api/track` and `/api/stats` handlers in `infrastructure/telemetry-proxy/src/worker.ts` with CORS whitelisting, 1KB payload cutoff, ephemeral hash deduplication, and Bearer auth for the harvester.

### Milestone 2: Multi-Marketplace Metric Harvester

- [ ] Create `scripts/harvest-analytics.ts` to query GitHub Releases, npm, VS Code Marketplace, Open VSX, Obsidian, and `/api/stats`.
- [ ] Implement idempotent daily upsert into `website/data/analytics.json`.
- [ ] Create `.github/workflows/analytics-sync.yml` to automate daily runs at 00:00 UTC.

### Milestone 3: Single Unified Dashboard UI

- [ ] Create `website/analytics.html` with responsive KPI cards, conversion funnel, platform distribution donut chart, time-series growth chart, and npm package breakdown table.
- [ ] Apply existing `website/styles.css` tokens for light/dark mode support.
- [ ] Add "Analytics" link to `website/index.html` footer.

### Milestone 4: Testing & Verification

- [ ] Implement unit tests in `tests/unit/analytics-harvester.test.ts`.
- [ ] Implement integration tests in `tests/unit/click-deduplication.test.ts`.
- [ ] Implement Playwright E2E tests in `tests/e2e/analytics-dashboard.spec.ts`.
- [ ] Verify `pnpm check` and `pnpm test:e2e` pass cleanly.
