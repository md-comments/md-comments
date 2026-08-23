# Graph Report - md-comments  (2026-08-23)

## Corpus Check
- 117 files · ~110,808 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1210 nodes · 2283 edges · 81 communities (57 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c427d5f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- markdownItPlugin.ts
- content.ts
- compress.py
- CommentStore
- validate.py
- vscode-extension/package.json
- obsidian-plugin/package.json
- Snyk High Risk Rating
- contributes
- pre-commit-checks/SKILL.md
- chrome-extension/manifest.json
- chrome-extension/package.json
- CommentsSidebarView
- CommentsFile
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
- generate_cws_tiles.py
- Website Assets
- Markdown Comments for VS Code
- test-publish-local.sh
- background.ts
- Context Pack
- Chrome Extension Icon SVG
- Workflow: context-pack
- commentStore.ts

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 35 edges
2. `logDebug()` - 33 edges
3. `CommentsFile` - 31 edges
4. `Obsidian Plugin Guide` - 28 edges
5. `readComments()` - 26 edges
6. `CommentsSidebarView` - 25 edges
7. `isGitHubLogin()` - 25 edges
8. `activate()` - 22 edges
9. `extendMarkdownIt()` - 22 edges
10. `placeInlineComments()` - 20 edges

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

## Communities (81 total, 24 thin omitted)

### Community 0 - "markdownItPlugin.ts"
Cohesion: 0.07
Nodes (74): renderAuthor(), resolveDisplayName(), clearAuthorCache(), extractMentionLogins(), fallbackAuthor(), getCachedAuthor(), githubAvatarUrl(), githubProfileUrl() (+66 more)

### Community 1 - "content.ts"
Cohesion: 0.06
Nodes (87): activeIndicators, appInstallationStatus, attachCommentCardEvents(), attachInstallationPromptEvents(), attachOAuthEvents(), cachedSelectedClasses, checkPageChange(), cleanupInjections() (+79 more)

### Community 2 - "compress.py"
Cohesion: 0.11
Nodes (25): main(), print_usage(), backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), is_sensitive_path() (+17 more)

### Community 3 - "CommentStore"
Cohesion: 0.21
Nodes (9): CommentStore, EMPTY, newId(), normalizeCommentsFile(), normalizeInlineComment(), normalizePageComment(), normalizeReply(), CommentRootType (+1 more)

### Community 4 - "validate.py"
Cohesion: 0.17
Nodes (20): benchmark_pair(), count_tokens(), main(), print_table(), count_bullets(), extract_code_blocks(), extract_headings(), extract_inline_codes() (+12 more)

### Community 5 - "vscode-extension/package.json"
Cohesion: 0.04
Nodes (48): markdown-it, antigravity, cursor, github, onLanguage:markdown, onStartupFinished, Other, review (+40 more)

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
Nodes (26): action, default_icon, default_title, background, service_worker, content_scripts, 128, 16 (+18 more)

### Community 11 - "chrome-extension/package.json"
Cohesion: 0.08
Nodes (25): author, dependencies, js-yaml, description, devDependencies, esbuild, tslib, @types/chrome (+17 more)

### Community 13 - "CommentsFile"
Cohesion: 0.12
Nodes (15): CommentBackend, CommentStorageKey, commentsFilePathForMarkdown(), decodeBase64(), GitHubOrphanRefBackend, mergeCommentsFiles(), LocalFileAdapter, LocalFileBackend (+7 more)

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
Cohesion: 0.04
Nodes (44): eslint, eslint-plugin-security, devDependencies, eslint, eslint-plugin-security, js-yaml, playwright, prettier (+36 more)

### Community 26 - "Obsidian Plugin Guide"
Cohesion: 0.08
Nodes (38): App Icon PNG, App Icon SVG, findParagraphForNode(), handleTextSelection(), hideSelectionButton(), showSelectionButton(), Comments Example Note, Obsidian Plugin Guide (+30 more)

### Community 27 - "obsidian-plugin/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 28 - "esbuild.js"
Cohesion: 0.25
Nodes (5): copyPlugin, esbuild, fs, outdir, path

### Community 29 - "mentionAutocomplete.js"
Cohesion: 0.50
Nodes (7): bindTextarea(), getMentionQuery(), loadDisplayNames(), loadMentionUsers(), removeMentionMenu(), scan(), showMentionMenu()

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
Cohesion: 0.11
Nodes (18): dependencies, js-yaml, devDependencies, @types/js-yaml, @types/node, typescript, js-yaml, @types/js-yaml (+10 more)

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
Cohesion: 0.17
Nodes (11): [1.1.0] - 2026-08-09, [1.1.1] - 2026-08-09, [1.1.2] - 2026-08-17, [1.1.3] - 2026-08-23, Added, Changed, Changed, Changelog (+3 more)

### Community 70 - "Reporting a Vulnerability"
Cohesion: 0.29
Nodes (6): 1. GitHub Private Vulnerability Reporting, 2. Contact the Maintainers, Reporting a Vulnerability, Security Policy, Supported Versions, What to Include

### Community 71 - "Privacy Policy"
Cohesion: 0.14
Nodes (13): 1. Executive Summary, 2. Information Collection and Handling, 3. Browser & System Permissions Explained, 4. Third-Party Services, 5. Security, 6. Changes to This Policy, 7. Contact Us, Chrome Extension (+5 more)

### Community 72 - "generate_cws_tiles.py"
Cohesion: 0.80
Nodes (4): draw_text_centered(), draw_text_with_shadow(), main(), make_rounded_card()

### Community 75 - "Markdown Comments for VS Code"
Cohesion: 0.20
Nodes (9): Commands, From VS Code Marketplace / Open VSX, From VSIX, Installation, Key Features, License, Markdown Comments for VS Code, Settings (+1 more)

### Community 102 - "Context Pack"
Cohesion: 0.33
Nodes (5): Context Pack, Guardrails, Output Focus, Patterns, Workflow

### Community 111 - "commentStore.ts"
Cohesion: 0.09
Nodes (59): vscode, GitHubRepoInfo, parseGitHubPageUrl(), parseGitHubRemote(), getAuthor(), warmAuthorCache(), CommentActionMessage, executeCommentAction() (+51 more)

## Knowledge Gaps
- **445 isolated node(s):** `root`, `parser`, `browser`, `node`, `es2022` (+440 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `keywords` connect `vscode-extension/package.json` to `commentStore.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `vscode` connect `commentStore.ts` to `markdownItPlugin.ts`, `Obsidian Plugin Guide`, `vscode-extension/package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `contributes` connect `contributes` to `vscode-extension/package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `Obsidian Plugin Guide` (e.g. with `main.ts` and `CommentComposerModal`) actually correct?**
  _`Obsidian Plugin Guide` has 28 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `parser`, `browser` to the rest of the system?**
  _445 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `markdownItPlugin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0707618187292984 - nodes in this community are weakly interconnected._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05518394648829431 - nodes in this community are weakly interconnected._