# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.7] - 2026-09-24

### Added

- **Automatic Feed Auto-Scroll on Addition and Reply**: Automatically scroll comment feeds (`#page-threads` and `#inline-threads`) to the bottom immediately when adding whole-document comments, inline comments, or replies across GitHub extension, Safari companion extension, VS Code preview, Web embeds, and Obsidian plugin.
- **VS Code Inline Highlight Tooltip**: Displayed speech bubble tooltip when hovering over inline highlighted text in VS Code markdown preview.

### Fixed

- **VS Code Reaction Toggle Parity**: Fixed reaction toggle count decrement and state parity for user's own emoji in VS Code preview.
- **VS Code Instant Text Highlighting & Timestamps**: Rendered immediate optimistic text highlighting and relative timestamp upon comment submission.
- **List Item & Blockquote Anchor Attributes**: Attached anchor block attributes to list items and blockquotes in VS Code preview.
- **Duplicate Phrase Occurrence Anchoring**: Supported duplicate phrase occurrence anchoring for inline comments in VS Code extension.
- **Standardized Relative Timestamps & Date Tooltips**: Standardized relative timestamps and concrete date tooltips across all client interfaces.
- **VS Code Paragraph Selection on Triple-Click**: Fixed text paragraph selection behavior on triple-click in preview webview.
- **Redundant Actions & Indicators Cleanup**: Removed redundant reply button from inline card actions and removed redundant page comment indicator from document cards in VS Code.
- **Mention Display Names**: Omitted leading `@` symbol when mentions include a display name in shared formatter.

## [1.4.6] - 2026-09-22

### Fixed

- **Immediate Inline Composer Dismissal**: Dismissed inline comment composers and fallback forms immediately upon submission without displaying button loading spinners, while rendering an active animated progress underline on submitting cards and restoring drafts upon submission failure.
- **Tombstone Sync & Stale Deletion Guard**: Prevented resurrection of deleted comments when remote polling fetches return stale data before background deletions finish.
- **Whole-Paragraph Inline Anchoring**: Supported seamless selection and inline comment anchoring across entire paragraph elements in the GitHub content script preview.

## [1.4.5] - 2026-09-21

### Added

- **Nightly Regression Deduplication & Auto-Resolution**: Automatically deduplicate GitHub issues on nightly test failures by commenting on existing open issues, and auto-close resolved regression issues upon suite success.
- **CI Auto-Merge Safety Gates**: Restricted Dependabot auto-merge to only merge after full CI workflow completion and passing status.

### Fixed

- **VS Code Webview API Acquisition Collision**: Retired legacy markdown preview scripts and standardized on `CommentPreviewPanel` to eliminate `acquireVsCodeApi()` collisions in VS Code markdown previews.
- **Cross-Surface Comment Sorting**: Aligned storage and UI comment ordering with chronological GitHub comment flow.
- **Anchor Hash Prioritization**: Prioritized exact anchor hash matching across preview surfaces to improve comment positioning accuracy.
- **Dependency Compatibility Invariants**: Reverted `@types/vscode` and `@astrojs/starlight` incompatible bumps from Dependabot, and added them to Dependabot's ignore list.

## [1.4.4] - 2026-09-15

### Added

- **Security Invariants & Architecture Validation**: Registered security invariants (`INV-NO-THIRD-PARTY-AUTH-PROXY`, `INV-SAFE-DESERIALIZATION`, `INV-INPUT-VALIDATION-REPO`), updated pre-commit checks, and synchronized quality graph.
- **Configurable Least-Privilege OAuth Scopes**: Supported granular OAuth scopes (`public_repo` default vs `repo`) in VS Code extension with clear permission guidance.

### Fixed

- **Cross-Surface Comment Synchronization & Deduplication**: Resolved optimistic sync races and deduplicated replies across surfaces based on author, timestamp window, and content.
- **Client DOM Sanitization & XSS Hardening**: Escaped error messages, author display names, excerpt bodies, and anchor quotes in Chrome extension and Obsidian views.
- **Repository Identifier Path Traversal Defense**: Validated repository owner and name parameters against path traversal in GitHub API URL interpolation.
- **Extension Manifest Host Permissions**: Narrowed Chrome and Safari extension host permissions to dedicated telemetry endpoints.
- **Dev Auth Proxy CORS & Schema Hardening**: Restricted dev auth proxy origins and strictly validated forwarded OAuth payloads.
- **Safe YAML Deserialization**: Enforced safe JSON schema on YAML parsing across the monorepo.
- **Third-Party OAuth Relay Removal**: Removed fallback to third-party `proxy.cors.sh` service to uphold zero third-party data transit invariant.

## [1.4.3] - 2026-09-13

### Added

- **VS Code Optimistic Preview Rendering**: Immediate in-place visual updates for creating, replying, editing, and reacting to comments without waiting for background persistence.
- **Preview Deletion Resilience & Modal Confirmation**: Enhanced confirmation dialogues and resilient error handling for comment and reply deletion.
- **VS Code Author Display Names & Typography Alignment**: Resolved author names and synchronized preview typography and card margins with GitHub extension styling.
- **Living Architecture Subsite & Models**: Added LikeC4 architecture models, interactive D2 viewer, and automated documentation subsite verification.
- **End-to-End Test Coverage**: Added comprehensive test suites for native preview actions, optimistic UI state, and cross-surface styling.

### Fixed

- **VS Code Preview Freeze & Mutation Loop**: Eliminated DOM mutation observer loops that caused preview freezing during fast updates.
- **VS Code Preview Blanking & Navigation**: Prevented preview navigation to blank screens or resetting the active tab when saving comments.
- **Action Button Hit Targets & Card Navigation**: Fixed card click propagation so button actions (resolve, edit, delete, react) are not intercepted by navigation handlers.
- **Silent Background Refresh**: Made preview background refresh completely silent and invisible, updating comment badges and threads in-place without DOM reloads.
- **Persistent Authentication**: Reliably persist authentication state across sessions and support environment-based GitHub tokens.
- **Git Data Ref Base Tree SHA**: Correctly resolve base tree SHA when committing to orphan data refs in GitHub custom git refs storage.
- **Toast Notification Noise**: Removed disruptive toast notifications on standard comment interactions.

## [1.4.2] - 2026-09-11

### Added

- **Editor Title Panel Toggle**: Aligned panel toggle icon in VS Code editor title bar with FAB logo.
- **Cross-Interface Badge Styling**: Standardized status badge designs across interfaces to GitHub extension specification.

### Fixed

- **VS Code Webview Blank Screen on Action**: Prevent preview webview from blanking or flickering on comment actions.
- **VS Code Table Anchoring & Orphan State**: Correctly resolve table row comment anchoring and prevent false orphan highlighting.
- **VS Code Sidebar & FAB Coordination**: Automatically hide FAB button when comments panel is open, restore sidebar footer `addPage` button, and resolve tab page/inline panel composer switching.
- **Icon Alignment & Differentiation**: Differentiated thread resolve/reopen action icons from header refresh, and unified refresh and close header action icon geometry.
- **Silent Refresh Progress Indicator**: Implemented smooth non-intrusive progress line during background comment refresh in GitHub and Safari extensions.

## [1.4.1] - 2026-09-10

### Fixed

- **VS Code Logger Release Branch Testing**: Accommodate release branch error log level in `vscodeLogger` test suite.

## [1.4.0] - 2026-09-10

### Breaking Changes

- **Canonical Comment Storage (No Backward Compatibility)**: Removed commit-hash versioning from comment filenames (`doc.<commit_sha>.comments.yml`). All comments are now stored in a single canonical file per document (`doc.comments.yml`).
- **Self-Healing Shard Migration & Deletion**: Reading comments automatically aggregates all historical hashed shards (`doc.<sha>.comments.yml`) into the canonical file and permanently deletes the old shards from `refs/md-comments/data`. Older extension/plugin versions that expect commit-hashed filenames will no longer see comments once migrated.
- **Comment-Level Commit Provenance**: Git commit SHAs are now recorded directly inside comment records (`commit_sha`) rather than embedded in the storage path.

### Added

- **Automatic & Manual Comment Refresh**:
  - Added `CommentPollManager` and `getLatestRefSha` in shared core for efficient change detection.
  - Added manual refresh button and adaptive polling to Chrome and Safari browser extensions.
  - Added sibling comments file watcher and document focus synchronization to VS Code extension.
  - Added refresh buttons, vault comment file watcher, and command palette trigger to Obsidian plugin.
  - Added drawer refresh button, adaptive polling, and draft preservation to Starlight documentation plugin.
- **Unified Design Tokens & Cross-Surface Parity**:
  - Standardized canonical design tokens across GitHub DOM, VS Code, and demo sites.
  - Added automated cross-surface component visual tests and triage scripts.
- **Production Build Log Filtering**:
  - Suppressed debug and info logs on release builds across VS Code, Chrome, Safari, and Obsidian, retaining critical error logs.
- **Deterministic Release Automation**:
  - Autonomous production release workflow and deterministic multi-manifest version bumping.

### Fixed

- **Refresh Button Icon Centering**:
  - Standardized button hit targets to square flex containers and prevented icon drift from inline flow/padding across all interfaces.

## [1.3.2] - 2026-09-09

### Added

- **VS Code Extension UI & Preview Parity**:
  - Elevated markdown preview fidelity with theme-aware typography, GFM table rendering, and `highlight.js` syntax highlighting for fenced code blocks.
  - Added `mdComments.previewMode` configuration setting supporting standalone and builtin modes.
  - Added floating Markdown FAB toggle and brought Document Comments tree view and card replies into visual and functional parity with the browser extension.

### Fixed

- **YAML Frontmatter Comment Anchoring**: Parse YAML frontmatter key-values into distinct anchor blocks matching rendered metadata table rows across preview and extension environments.
- **Icon and Styling Alignment**: Harmonized preview FAB and extension icons with the browser extension design.
- **Starlight Compatibility**: Preserved Astro Starlight dependency alignment across demo packages.

## [1.3.1] - 2026-09-08

### Added

- **Safari Companion App Step 4**: Dedicated origin permission guidance in macOS companion app and setup documentation for github.com.
- **Optimistic Editing & UI Feedback**: Real-time progress bar on comment updates, and visual loading states on floating action button and side drawer.
- **VS Code Playwright Electron Parity**: Full cross-platform end-to-end Electron test harness with zero flaky CodeLens refreshes.
- **Pre-Bump Regression Gate**: Automated regression test suite enforcement before any version bump or release branch cut.

### Fixed

- **Comment Deletion Persistence**: Prevent deleted comments from reappearing and eradicate legacy fallback `0000000` git ref hashes.
- **CI & Release Automation**: Automated website release link synchronization and preserved production release status invariants.

## [1.3.0] - 2026-09-06

### Added

- **Safari Web Extension & macOS Companion App**: Native Safari Web Extension and macOS companion app with DMG packaging, cross-browser storage/runtime abstraction, and zero-PAT Device Flow OAuth parity.
- **OpenTelemetry Exception Monitoring & Automated Triage**: Universal zero-secret telemetry proxy worker with PII sanitization, client-side killswitch, stack normalization, and closed-loop GitHub Action alert triage across all interfaces.
- **Native @Mentions & Notifications**: In-app mentions autocomplete and real-time commit comment notification dispatch on documentation changes.
- **Auth UX Parity & Robustness**: Streamlined GitHub Device Flow authentication waiting modal, proactive session auto-refresh, and clean error handling.

## [1.2.3] - 2026-09-03

### Fixed

- **GitHub Extension Commit Hashing & Path Encoding**: Resolve real commit SHA on GitHub blob pages via DOM metadata and GraphQL API to prevent saving under fallback `0000000` hash. Properly decode URL components in `parseGitHubUrl` and handle URI encoding for paths with spaces in GitHub REST API.
- **Orphan Ref 0000000 Migration**: Automatically migrate any legacy `0000000` comment files into commit-hashed comment files upon read.
- **DOM Table & Occurrence Scoping**: Scope table row paragraphs and support targeted occurrence highlighting in the Chrome extension.

## [1.2.2] - 2026-09-02

### Added

- **Astro & Starlight Plugin (`@md-comments/starlight`)**: Official Starlight plugin and Astro integration bringing inline Markdown Comments to documentation websites without requiring browser extensions.
- **Client-Side GitHub OAuth Device Flow**: Zero-server browser authentication for documentation readers and reviewers.
- **OIDC & Trusted Publishing Release Workflow**: Automated npm publishing using OpenID Connect (OIDC) tokens with verifiable cryptographic build provenance (`--provenance`).

## [1.1.5] - 2026-08-27

### Breaking Changes

- Comment files are now stored with the 7-character git commit short SHA of the original file revision in the filename (`doc.<commit_sha>.comments.yml`).
- Legacy un-hashed comment files (`doc.comments.yml`) are read as base data for initial migration, but new comment writes will generate commit-hashed files (`doc.<commit_sha>.comments.yml`) and will no longer update legacy files. Older extension versions will not see comments stored in hashed filenames.
- Confluence-style comment aggregation: When viewing or rolling back a file to a specific commit, page comments across historical comment files remain intact and visible, while inline comments re-anchor to restored text segments.

## [1.1.3] - 2026-08-23

### Fixed

- Support text range selection commenting on single file GitHub view in Chrome extension.
- Improve author resolution in VS Code extension via GitHub OAuth token user profile and git config fallback.

## [1.1.2] - 2026-08-17

### Fixed

- Removed unused `identity` and `tabs` permissions from Chrome Extension `manifest.json` to satisfy Chrome Web Store policy requirements.

## [1.1.1] - 2026-08-09

### Changed

- Removed outdated references to GitHub Issues and local YAML companion files across documentation, UI strings, privacy policies, and manifests, standardizing exclusively on the custom git refs backend (`refs/md-comments/data`).

## [1.1.0] - 2026-08-09

### Changed

- Transitioned comment persistence to custom git refs backend (`refs/md-comments/data` orphan git ref / GitHub API) with zero-commit and zero-PR overhead.
- Updated all plugin descriptions, privacy policies, and commercial website (`md-comments.com`) documentation.

### Added

- Initial project layout and monorepo structure.
- Core shared library containing comment parser and fuzzy anchor matcher.
- VS Code / Cursor extension implementation.
- Obsidian plugin implementation.
- GitHub Chrome Extension integration.
- CI/CD release workflow configuration.
- Community health files: `AUTHORS.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`.
