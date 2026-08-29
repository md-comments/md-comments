# Graph Report - md-comments  (2026-08-29)

## Corpus Check
- 148 files · ~133,590 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1517 nodes · 2795 edges · 118 communities (91 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edbf19ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- content.ts
- validate.py
- Obsidian Plugin Guide
- CommentsOverlay
- vscode-extension/package.json
- obsidian-plugin/package.json
- Snyk High Risk Rating
- contributes
- pre-commit-checks/SKILL.md
- chrome-extension/manifest.json
- chrome-extension/package.json
- CommentsSidebarView
- compilerOptions
- previewActions.js
- inlineAnchors.js
- ignorePatterns
- compilerOptions
- compilerOptions
- preview.js
- previewSidebar.js
- caveman-help
- compilerOptions
- preview-webview.js
- scripts
- GitHubApi
- starlight-plugin/package.json
- obsidian-plugin/manifest.json
- esbuild.js
- mentionAutocomplete.js
- CommentsFile
- compilerOptions
- esbuild.config.mjs
- avatarFallback.js
- Graphify Agent rules
- Graphify Agent workflows
- Chrome Extension Icon 128px
- Chrome Extension Icon 16px
- Chrome Extension Icon 32px
- Chrome Extension Icon 48px
- cavecrew/SKILL.md
- caveman-compress/README.md
- copy-icons.js
- shared/package.json
- Caveman Compress
- caveman-stats
- RTK - Rust Token Killer (Google Antigravity)
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- caveman/SKILL.md
- ponytail.md
- __init__.py
- Path
- Path
- Path
- Path
- caveman-commit
- caveman-review
- Ponytail
- Caveman Help
- Ponytail Help
- ponytail-debt/SKILL.md
- Agentic AI & Documentation Workflows
- tsconfig.json
- Contributor Covenant Code of Conduct
- Project Governance
- Changelog
- Authors
- Reporting a Vulnerability
- Privacy Policy
- generate_cws_tiles.py
- Website Assets
- Markdown Comments for VS Code, Cursor & Antigravity
- test-publish-local.sh
- demo-astro/package.json
- devDependencies
- compilerOptions
- background.ts
- keywords
- Astro & Starlight Plugin (`@md-comments/starlight`)
- dependencies
- githubDisplayNames.ts
- scripts
- repository
- markdownItPlugin.ts
- @typescript-eslint/parser
- activationEvents
- Sample Technical Specification
- demo-astro/tsconfig.json
- architecture.md
- how-it-works.md
- content.config.ts
- index.md
- Cross-Browser Extension Expansion Plan & Store Publishing Roadmap
- package.json
- commentStore.ts
- Context Pack
- attachCommentCardEvents
- src/author.ts
- Chrome Extension Icon SVG
- parseGitHubUrl
- serve-website.js
- CommentsApp
- repoManager.ts
- Workflow: context-pack
- extension.ts
- renderDOMIndicatorsForFile
- chrome-extension/src/githubAuth.ts
- renderSidebarComments
- injectGlobalStyles
- previewCommand.ts

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 36 edges
2. `CommentsOverlay` - 35 edges
3. `logDebug()` - 33 edges
4. `CommentsFile` - 32 edges
5. `scripts` - 28 edges
6. `readComments()` - 28 edges
7. `Obsidian Plugin Guide` - 28 edges
8. `CommentsSidebarView` - 25 edges
9. `isGitHubLogin()` - 25 edges
10. `activate()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Markdown Comments Key Features` --references--> `findBlockByIndex()`  [INFERRED]
  README.md → shared/anchor.ts
- `Markdown Comments Key Features` --references--> `findBlockByHash()`  [INFERRED]
  README.md → shared/anchor.ts
- `App Icon PNG` --conceptually_related_to--> `Markdown Comments Overview`  [INFERRED]
  assets/icon.png → README.md
- `App Icon SVG` --conceptually_related_to--> `Markdown Comments Overview`  [INFERRED]
  assets/icon.svg → README.md
- `VS Code Extension Icon PNG` --conceptually_related_to--> `Markdown Comments Overview`  [INFERRED]
  vscode-extension/icon.png → README.md

## Import Cycles
- None detected.

## Communities (118 total, 27 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.15
Nodes (13): @types/markdown-it, @types/vscode, devDependencies, @types/js-yaml, @types/markdown-it, @types/node, @types/vscode, typescript (+5 more)

### Community 1 - "content.ts"
Cohesion: 0.08
Nodes (33): activeIndicators, appInstallationStatus, cachedSelectedClasses, cleanupInjections(), collectCommentAuthors(), displayNameCache, draftsStore, fetchDisplayName() (+25 more)

### Community 2 - "validate.py"
Cohesion: 0.07
Nodes (45): benchmark_pair(), count_tokens(), main(), print_table(), main(), print_usage(), backup_dir_for(), build_compress_prompt() (+37 more)

### Community 3 - "Obsidian Plugin Guide"
Cohesion: 0.13
Nodes (14): App Icon PNG, App Icon SVG, Comments Example Note, Obsidian Plugin Guide, CommentComposerModal, DEFAULT_SETTINGS, MarkdownCommentsPlugin, MarkdownCommentsSettings (+6 more)

### Community 4 - "CommentsOverlay"
Cohesion: 0.08
Nodes (23): AstroIntegration, astroMdComments(), mountMdComments(), AuthModal, CommentsOverlay, scanArticleAnchors(), ScannedElement, clearOAuthToken() (+15 more)

### Community 5 - "vscode-extension/package.json"
Cohesion: 0.15
Nodes (12): Other, categories, description, displayName, engines, vscode, icon, license (+4 more)

### Community 6 - "obsidian-plugin/package.json"
Cohesion: 0.05
Nodes (37): @codemirror/language, @codemirror/state, @codemirror/view, obsidian, author, dependencies, js-yaml, description (+29 more)

### Community 7 - "Snyk High Risk Rating"
Cohesion: 0.25
Nodes (7): Auth behavior, File size limit, Reporting a vulnerability, Security, Snyk High Risk Rating, What the skill does NOT do, What triggers the rating

### Community 8 - "contributes"
Cohesion: 0.06
Nodes (32): 👍, ./media/avatarFallback.js, ./media/inlineAnchors.js, ./media/mentionAutocomplete.js, ./media/preview.css, ./media/preview.js, ./media/previewActions.js, ./media/previewSidebar.js (+24 more)

### Community 10 - "chrome-extension/manifest.json"
Cohesion: 0.07
Nodes (26): action, default_icon, default_title, background, service_worker, content_scripts, 128, 16 (+18 more)

### Community 11 - "chrome-extension/package.json"
Cohesion: 0.07
Nodes (26): author, dependencies, js-yaml, description, devDependencies, esbuild, tslib, @types/chrome (+18 more)

### Community 13 - "compilerOptions"
Cohesion: 0.17
Nodes (11): tests/**/*, vitest.config.mts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, skipLibCheck (+3 more)

### Community 14 - "previewActions.js"
Cohesion: 0.15
Nodes (24): activateTab(), activeTabKey(), applyCollapsedState(), authorsMatchClient(), bindRepliesToggle(), clearReplyNav(), closeEmojiPopover(), collapsedKey() (+16 more)

### Community 15 - "inlineAnchors.js"
Cohesion: 0.21
Nodes (20): activatePair(), activateParagraphComments(), bindCardHover(), bindClick(), bindHover(), bindParagraphMarked(), clearActive(), createDomRange() (+12 more)

### Community 16 - "ignorePatterns"
Cohesion: 0.05
Nodes (36): env, browser, es2022, node, extends, globals, acquireVsCodeApi, chrome (+28 more)

### Community 17 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, resolveJsonModule, skipLibCheck (+10 more)

### Community 18 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, inlineSources, lib, module, moduleResolution, skipLibCheck (+8 more)

### Community 19 - "preview.js"
Cohesion: 0.24
Nodes (16): findParagraphFromNode(), getAnchorFromParagraph(), getAnchorFromSelection(), getMdPath(), getSelectedText(), handleTextSelection(), loadAnchorBlocks(), openEmojiPicker() (+8 more)

### Community 20 - "previewSidebar.js"
Cohesion: 0.32
Nodes (16): activatePair(), applyState(), bindGlobalEvents(), bindSidebarInteractions(), clearActive(), getLayoutContext(), getMdKey(), init() (+8 more)

### Community 21 - "caveman-help"
Cohesion: 0.33
Nodes (5): caveman-help, Example output, How to invoke, See also, What it does

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (17): **/*.ts, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+9 more)

### Community 23 - "preview-webview.js"
Cohesion: 0.22
Nodes (19): applyPendingAnchorHighlight(), clearPendingAnchorHighlight(), escapeHtml(), findParagraphFromNode(), getAnchorFromParagraph(), getAnchorFromSelection(), getMdPath(), getSelectedText() (+11 more)

### Community 24 - "scripts"
Cohesion: 0.07
Nodes (28): scripts, build, build:chrome, build:demo-astro, build:obsidian, build:pages, build:shared, build:starlight (+20 more)

### Community 26 - "starlight-plugin/package.json"
Cohesion: 0.07
Nodes (28): dependencies, js-yaml, @md-comments/shared, description, devDependencies, @types/js-yaml, @types/node, typescript (+20 more)

### Community 27 - "obsidian-plugin/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 28 - "esbuild.js"
Cohesion: 0.25
Nodes (5): copyPlugin, esbuild, fs, outdir, path

### Community 29 - "mentionAutocomplete.js"
Cohesion: 0.50
Nodes (7): bindTextarea(), getMentionQuery(), loadDisplayNames(), loadMentionUsers(), removeMentionMenu(), scan(), showMentionMenu()

### Community 30 - "CommentsFile"
Cohesion: 0.09
Nodes (19): CommentStore, EMPTY, newId(), normalizeCommentsFile(), normalizeInlineComment(), normalizePageComment(), normalizeReply(), CommentBackend (+11 more)

### Community 31 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, skipLibCheck, strict (+6 more)

### Community 40 - "cavecrew/SKILL.md"
Cohesion: 0.14
Nodes (12): cavecrew, Example chaining, How to invoke, Model overrides, See also, What it does, Auto-clarity (inherited), Chaining patterns (+4 more)

### Community 41 - "caveman-compress/README.md"
Cohesion: 0.14
Nodes (13): Before / After, Benchmarks, How It Work, <img src="../../docs/assets/dancing-rock.svg" width="20" height="20" alt="rock"/> Caveman (285 tokens), Install, 📄 Original (706 tokens), Part of Caveman, Security (+5 more)

### Community 42 - "copy-icons.js"
Cohesion: 0.20
Nodes (7): chromeDestDir, chromeSrcDir, fs, path, rootDir, vscodeDest, vscodeSrc

### Community 43 - "shared/package.json"
Cohesion: 0.09
Nodes (21): dependencies, js-yaml, devDependencies, @types/js-yaml, @types/node, typescript, exports, js-yaml (+13 more)

### Community 44 - "Caveman Compress"
Cohesion: 0.17
Nodes (11): Boundaries, Caveman Compress, Compress, Compression Rules, Pattern, Preserve EXACTLY (never modify), Preserve Structure, Process (+3 more)

### Community 45 - "caveman-stats"
Cohesion: 0.29
Nodes (5): caveman-stats, Example output, How to invoke, See also, What it does

### Community 46 - "RTK - Rust Token Killer (Google Antigravity)"
Cohesion: 0.40
Nodes (4): Meta Commands, RTK - Rust Token Killer (Google Antigravity), Rule, Why

### Community 47 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Hunt, Output, Tags

### Community 48 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 49 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Examples, Format, Scoring

### Community 50 - "caveman/SKILL.md"
Cohesion: 0.17
Nodes (10): caveman, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Intensity (+2 more)

### Community 57 - "caveman-commit"
Cohesion: 0.18
Nodes (9): caveman-commit, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Examples (+1 more)

### Community 58 - "caveman-review"
Cohesion: 0.18
Nodes (9): caveman-review, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Examples (+1 more)

### Community 59 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 60 - "Caveman Help"
Cohesion: 0.25
Nodes (7): Caveman Help, Configure Default Mode, Deactivate, Language, Modes, More, Skills

### Community 61 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 62 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 63 - "Agentic AI & Documentation Workflows"
Cohesion: 0.25
Nodes (7): 1. AI-Orchestrated Documentation, 2. Human-Orchestrated Comments on Rendered Views, 3. Agentic Resolution & Iteration, Agentic AI & Documentation Workflows, 🛠️ AI Review & Developer Commands, 🔒 Security Static Analysis (SAST) & Pre-Commit Checks, 🔄 The AI-Human Documentation Loop

### Community 66 - "Contributor Covenant Code of Conduct"
Cohesion: 0.15
Nodes (12): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Guidelines (+4 more)

### Community 67 - "Project Governance"
Cohesion: 0.25
Nodes (7): Contributors, Decision Making, Governance Model, Maintainers, Project Governance, Project Lead, Roles

### Community 68 - "Changelog"
Cohesion: 0.13
Nodes (14): [1.1.0] - 2026-08-09, [1.1.1] - 2026-08-09, [1.1.2] - 2026-08-17, [1.1.3] - 2026-08-23, [1.1.5] - 2026-08-27, Added, Added, Breaking Changes (+6 more)

### Community 70 - "Reporting a Vulnerability"
Cohesion: 0.29
Nodes (6): 1. GitHub Private Vulnerability Reporting, 2. Contact the Maintainers, Reporting a Vulnerability, Security Policy, Supported Versions, What to Include

### Community 71 - "Privacy Policy"
Cohesion: 0.12
Nodes (15): 1. Executive Summary, 2. Information Collection, Storage & PII Handling, 3. Browser & System Permissions Explained, 4. Third-Party Services, 5. Security, 6. Changes to This Policy, 7. Contact Us, Chrome Extension (+7 more)

### Community 72 - "generate_cws_tiles.py"
Cohesion: 0.80
Nodes (4): draw_text_centered(), draw_text_with_shadow(), main(), make_rounded_card()

### Community 75 - "Markdown Comments for VS Code, Cursor & Antigravity"
Cohesion: 0.20
Nodes (9): Commands, From VS Code Marketplace / Open VSX, From VSIX, Installation, Key Features, License, Markdown Comments for VS Code, Cursor & Antigravity, Settings (+1 more)

### Community 77 - "demo-astro/package.json"
Cohesion: 0.08
Nodes (25): astro, @astrojs/check, @astrojs/starlight, dependencies, @md-comments/shared, @md-comments/starlight, devDependencies, astro (+17 more)

### Community 78 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-plugin-security, devDependencies, eslint, eslint-plugin-security, js-yaml, playwright, prettier (+13 more)

### Community 79 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+5 more)

### Community 82 - "keywords"
Cohesion: 0.29
Nodes (7): antigravity, cursor, github, review, comments, markdown, keywords

### Community 83 - "Astro & Starlight Plugin (`@md-comments/starlight`)"
Cohesion: 0.20
Nodes (9): 1. Configure in `astro.config.mjs`, 2. Standard Astro Sites (Non-Starlight), Astro & Starlight Plugin (`@md-comments/starlight`), Authentication: GitHub OAuth Device Flow, Configuration Options, Custom Page-Level Comments, Features, Installation (+1 more)

### Community 84 - "dependencies"
Cohesion: 0.40
Nodes (5): markdown-it, dependencies, js-yaml, markdown-it, js-yaml

### Community 86 - "githubDisplayNames.ts"
Cohesion: 0.14
Nodes (29): vscode, extractMentionLogins(), isGitHubLogin(), avatarCache, AvatarCacheEntry, avatarFetchUrl(), cacheEntryValid(), cacheKey() (+21 more)

### Community 87 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, compile, package, typecheck, watch

### Community 88 - "repository"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 89 - "markdownItPlugin.ts"
Cohesion: 0.09
Nodes (58): handleTextSelection(), hideSelectionButton(), showSelectionButton(), createLivePreviewExtension(), fuzzyMatch(), highlightTextInElement(), registerReadingViewProcessor(), displayNameCache (+50 more)

### Community 91 - "activationEvents"
Cohesion: 0.67
Nodes (3): onLanguage:markdown, onStartupFinished, activationEvents

### Community 92 - "Sample Technical Specification"
Cohesion: 0.40
Nodes (4): Authentication Protocol, Data Storage Architecture, Deployment Guidelines, Sample Technical Specification

### Community 93 - "demo-astro/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, moduleResolution, extends, astro/tsconfigs/strict

### Community 94 - "architecture.md"
Cohesion: 0.40
Nodes (4): How Astro Integration Fits In, How the Architecture Supports AI + Human Collaboration, The Git Ref Solution, Why Custom Git Refs?

### Community 95 - "how-it-works.md"
Cohesion: 0.50
Nodes (3): 1. Highlighting Rendered Prose, 2. Leaving a Comment, 3. GitHub OAuth Authentication

### Community 99 - "Cross-Browser Extension Expansion Plan & Store Publishing Roadmap"
Cohesion: 0.13
Nodes (14): 1. Google Chrome Web Store (CWS), 1. Unified `src/browserApi.ts`, 2. Mozilla Add-ons (AMO - Firefox), 3. Microsoft Edge Add-ons, 4. Apple Mac App Store & iOS App Store (Safari), 5. Opera Add-ons, Automated Build & Packaging Pipeline, Cross-Browser Extension Expansion Plan & Store Publishing Roadmap (+6 more)

### Community 100 - "package.json"
Cohesion: 0.20
Nodes (9): license, name, esbuild, fast-uri, nanoid, undici, pnpm, overrides (+1 more)

### Community 101 - "commentStore.ts"
Cohesion: 0.20
Nodes (27): executeCommentAction(), resolveText(), savedToast(), addInlineComment(), addPageComment(), addReply(), applyReactionToggle(), commentsFsPathForMarkdown() (+19 more)

### Community 102 - "Context Pack"
Cohesion: 0.33
Nodes (5): Context Pack, Guardrails, Output Focus, Patterns, Workflow

### Community 103 - "attachCommentCardEvents"
Cohesion: 0.19
Nodes (21): attachCommentCardEvents(), commitCommentFileChanges(), deleteComment(), deleteReply(), editComment(), editReply(), findDiffGutterCell(), getDisplayAuthor() (+13 more)

### Community 104 - "src/author.ts"
Cohesion: 0.28
Nodes (14): clearAuthorCache(), fallbackAuthor(), getCachedAuthor(), githubAvatarUrl(), githubProfileUrl(), isCacheValid(), setCachedAuthor(), execFileAsync (+6 more)

### Community 106 - "parseGitHubUrl"
Cohesion: 0.31
Nodes (13): fetchCommentsFile(), fetchFileContent(), getBranchFromDom(), getPRHeadBranchFromDom(), initRepoAndMetadata(), loadAndRenderCommentsForContainer(), loadAndRenderFileInTab(), parseGitHubUrl() (+5 more)

### Community 107 - "serve-website.js"
Cohesion: 0.25
Nodes (7): fs, http, MIME_TYPES, path, PORT, server, WEBSITE_DIR

### Community 108 - "CommentsApp"
Cohesion: 0.18
Nodes (3): AuthModal, CommentsApp, fetchGitHubViewer()

### Community 109 - "repoManager.ts"
Cohesion: 0.25
Nodes (12): GitHubRepoInfo, parseGitHubPageUrl(), parseGitHubRemote(), commitHashCache, execFileAsync, getGitCommitHash(), getGitCommitHashSync(), getGitRemoteUrl() (+4 more)

### Community 111 - "extension.ts"
Cohesion: 0.20
Nodes (19): warmAuthorCache(), CommentPreviewPanel, activate(), handlePreviewAction(), handleUri(), mdUriFromMessage(), refreshPreview(), updateStatusBar() (+11 more)

### Community 112 - "renderDOMIndicatorsForFile"
Cohesion: 0.47
Nodes (6): applyPendingHighlight(), clearPendingHighlights(), findDomParagraphs(), highlightTextInElement(), renderDOMIndicatorsForFile(), scrollToCommentText()

### Community 113 - "chrome-extension/src/githubAuth.ts"
Cohesion: 0.36
Nodes (7): attachOAuthEvents(), DeviceCodeResponse, getStoredToken(), pollForAccessToken(), requestDeviceCode(), saveOAuthToken(), startOAuthDeviceFlow()

### Community 114 - "renderSidebarComments"
Cohesion: 0.19
Nodes (16): attachInstallationPromptEvents(), checkPageChange(), closeSidebar(), getAuthToken(), handleDevicePageAutofill(), handlePageLoad(), injectFABButton(), injectToolbarButton() (+8 more)

### Community 115 - "injectGlobalStyles"
Cohesion: 0.67
Nodes (3): injectGlobalStyles(), isGitHubDarkTheme(), syncTheme()

### Community 118 - "previewCommand.ts"
Cohesion: 0.67
Nodes (3): CommentActionMessage, normalizeObject(), parsePreviewCommandArg()

## Knowledge Gaps
- **580 isolated node(s):** `root`, `parser`, `browser`, `node`, `es2022` (+575 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `keywords` connect `keywords` to `vscode-extension/package.json`, `githubDisplayNames.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `vscode` connect `githubDisplayNames.ts` to `commentStore.ts`, `src/author.ts`, `repoManager.ts`, `extension.ts`, `keywords`, `markdownItPlugin.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `CommentsFile` connect `CommentsFile` to `markdownItPlugin.ts`, `content.ts`, `commentStore.ts`, `githubDisplayNames.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `parser`, `browser` to the rest of the system?**
  _580 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07957957957957958 - nodes in this community are weakly interconnected._
- **Should `validate.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06848357791754019 - nodes in this community are weakly interconnected._
- **Should `Obsidian Plugin Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.12834224598930483 - nodes in this community are weakly interconnected._