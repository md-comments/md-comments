# Graph Report - md-comments  (2026-07-30)

## Corpus Check
- 99 files · ~53,265 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1080 nodes · 2008 edges · 74 communities (54 shown, 20 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bcd5ad21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- markdownItPlugin.ts
- content.ts
- compress.py
- commentStore.ts
- validate.py
- vscode-extension/package.json
- obsidian-plugin/package.json
- Snyk High Risk Rating
- contributes
- pre-commit-checks/SKILL.md
- chrome-extension/manifest.json
- chrome-extension/package.json
- CommentsSidebarView
- main.ts
- previewActions.js
- inlineAnchors.js
- .eslintrc.json
- compilerOptions
- compilerOptions
- preview.js
- previewSidebar.js
- caveman-help
- compilerOptions
- preview-webview.js
- scripts
- GitHubApi
- Obsidian Plugin Guide
- obsidian-plugin/manifest.json
- esbuild.js
- mentionAutocomplete.js
- options.ts
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
- Agentic AI Code Review Guide
- tsconfig.json
- Contributor Covenant Code of Conduct
- Project Governance
- Changelog
- Authors
- Reporting a Vulnerability
- Privacy Policy
- Context Pack
- Workflow: context-pack

## God Nodes (most connected - your core abstractions)
1. `Chrome Extension Options UI` - 65 edges
2. `escapeHtml()` - 33 edges
3. `Obsidian Plugin Guide` - 28 edges
4. `CommentsSidebarView` - 25 edges
5. `isGitHubLogin()` - 25 edges
6. `placeInlineComments()` - 22 edges
7. `commitCommentFileChanges()` - 21 edges
8. `readComments()` - 21 edges
9. `isOrphanedPlacement()` - 19 edges
10. `extendMarkdownIt()` - 19 edges

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

## Communities (74 total, 20 thin omitted)

### Community 0 - "markdownItPlugin.ts"
Cohesion: 0.06
Nodes (82): clearAuthorCache(), extractMentionLogins(), fallbackAuthor(), getCachedAuthor(), githubAvatarUrl(), githubProfileUrl(), isCacheValid(), isGitHubLogin() (+74 more)

### Community 1 - "content.ts"
Cohesion: 0.08
Nodes (81): Chrome Extension Icon SVG, Chrome Extension Options UI, activeIndicators, attachCommentCardEvents(), checkPageChange(), cleanupInjections(), clearPendingCommentsCache(), closeSidebar() (+73 more)

### Community 2 - "compress.py"
Cohesion: 0.11
Nodes (25): main(), print_usage(), backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), is_sensitive_path() (+17 more)

### Community 3 - "commentStore.ts"
Cohesion: 0.21
Nodes (27): getAuthor(), executeCommentAction(), resolveText(), savedToast(), addInlineComment(), addPageComment(), addReply(), applyReactionToggle() (+19 more)

### Community 4 - "validate.py"
Cohesion: 0.17
Nodes (20): benchmark_pair(), count_tokens(), main(), print_table(), count_bullets(), extract_code_blocks(), extract_headings(), extract_inline_codes() (+12 more)

### Community 5 - "vscode-extension/package.json"
Cohesion: 0.05
Nodes (40): markdown-it, onLanguage:markdown, onStartupFinished, Other, @types/markdown-it, @types/vscode, activationEvents, categories (+32 more)

### Community 6 - "obsidian-plugin/package.json"
Cohesion: 0.05
Nodes (36): @codemirror/language, @codemirror/state, @codemirror/view, obsidian, author, dependencies, js-yaml, description (+28 more)

### Community 7 - "Snyk High Risk Rating"
Cohesion: 0.25
Nodes (7): Auth behavior, File size limit, Reporting a vulnerability, Security, Snyk High Risk Rating, What the skill does NOT do, What triggers the rating

### Community 8 - "contributes"
Cohesion: 0.07
Nodes (30): 👍, ./media/avatarFallback.js, ./media/inlineAnchors.js, ./media/mentionAutocomplete.js, ./media/preview.css, ./media/preview.js, ./media/previewActions.js, ./media/previewSidebar.js (+22 more)

### Community 10 - "chrome-extension/manifest.json"
Cohesion: 0.07
Nodes (26): action, default_icon, default_title, content_scripts, 128, 16, 32, 48 (+18 more)

### Community 11 - "chrome-extension/package.json"
Cohesion: 0.08
Nodes (25): author, dependencies, js-yaml, description, devDependencies, esbuild, tslib, @types/chrome (+17 more)

### Community 13 - "main.ts"
Cohesion: 0.10
Nodes (36): CacheEntry, createLivePreviewExtension(), fuzzyMatch(), highlightTextInElement(), registerReadingViewProcessor(), displayNameCache, pendingFetches, CommentStore (+28 more)

### Community 14 - "previewActions.js"
Cohesion: 0.16
Nodes (22): activateTab(), applyCollapsedState(), authorsMatchClient(), bindRepliesToggle(), clearReplyNav(), closeEmojiPopover(), collapsedKey(), consumeReplyNav() (+14 more)

### Community 15 - "inlineAnchors.js"
Cohesion: 0.21
Nodes (20): activatePair(), activateParagraphComments(), bindCardHover(), bindClick(), bindHover(), bindParagraphMarked(), clearActive(), createDomRange() (+12 more)

### Community 16 - ".eslintrc.json"
Cohesion: 0.07
Nodes (28): env, browser, es2022, node, extends, globals, acquireVsCodeApi, chrome (+20 more)

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
Cohesion: 0.12
Nodes (16): **/*.ts, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+8 more)

### Community 23 - "preview-webview.js"
Cohesion: 0.27
Nodes (14): findParagraphFromNode(), getAnchorFromParagraph(), getAnchorFromSelection(), getMdPath(), getSelectedText(), handleTextSelection(), loadAnchorBlocks(), postAction() (+6 more)

### Community 24 - "scripts"
Cohesion: 0.05
Nodes (38): eslint, eslint-plugin-security, devDependencies, eslint, eslint-plugin-security, prettier, typescript, @typescript-eslint/eslint-plugin (+30 more)

### Community 26 - "Obsidian Plugin Guide"
Cohesion: 0.12
Nodes (15): App Icon PNG, App Icon SVG, Example YML Comments Storage, Comments Example Note, Obsidian Plugin Guide, CommentComposerModal, DEFAULT_SETTINGS, MarkdownCommentsPlugin (+7 more)

### Community 27 - "obsidian-plugin/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 28 - "esbuild.js"
Cohesion: 0.25
Nodes (5): copyPlugin, esbuild, fs, outdir, path

### Community 29 - "mentionAutocomplete.js"
Cohesion: 0.50
Nodes (7): bindTextarea(), getMentionQuery(), loadDisplayNames(), loadMentionUsers(), removeMentionMenu(), scan(), showMentionMenu()

### Community 30 - "options.ts"
Cohesion: 0.50
Nodes (3): restoreSettings(), saveBtn, updatePatternVisibility()

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
Cohesion: 0.14
Nodes (13): devDependencies, @types/node, typescript, @types/node, typescript, license, main, name (+5 more)

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

### Community 63 - "Agentic AI Code Review Guide"
Cohesion: 0.50
Nodes (3): Agentic AI Code Review Guide, AI Review Commands, Security Static Analysis (SAST) & SCA

### Community 66 - "Contributor Covenant Code of Conduct"
Cohesion: 0.15
Nodes (12): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Guidelines (+4 more)

### Community 67 - "Project Governance"
Cohesion: 0.25
Nodes (7): Contributors, Decision Making, Governance Model, Maintainers, Project Governance, Project Lead, Roles

### Community 68 - "Changelog"
Cohesion: 0.50
Nodes (3): Added, Changelog, [Unreleased]

### Community 70 - "Reporting a Vulnerability"
Cohesion: 0.29
Nodes (6): 1. GitHub Private Vulnerability Reporting, 2. Contact the Maintainers, Reporting a Vulnerability, Security Policy, Supported Versions, What to Include

### Community 71 - "Privacy Policy"
Cohesion: 0.14
Nodes (13): 1. Executive Summary, 2. Information Collection and Handling, 3. Browser & System Permissions Explained, 4. Third-Party Services, 5. Security, 6. Changes to This Policy, 7. Contact Us, Chrome Extension (+5 more)

### Community 102 - "Context Pack"
Cohesion: 0.33
Nodes (5): Context Pack, Guardrails, Output Focus, Patterns, Workflow

## Knowledge Gaps
- **404 isolated node(s):** `root`, `parser`, `browser`, `node`, `es2022` (+399 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `obsidian` connect `main.ts` to `obsidian-plugin/package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `keywords` connect `obsidian-plugin/package.json` to `main.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 65 inferred relationships involving `Chrome Extension Options UI` (e.g. with `Chrome Extension Icon SVG` and `content.ts`) actually correct?**
  _`Chrome Extension Options UI` has 65 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `Obsidian Plugin Guide` (e.g. with `main.ts` and `CommentComposerModal`) actually correct?**
  _`Obsidian Plugin Guide` has 28 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `parser`, `browser` to the rest of the system?**
  _404 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `markdownItPlugin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061855670103092786 - nodes in this community are weakly interconnected._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08433734939759036 - nodes in this community are weakly interconnected._