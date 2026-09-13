var e = (e) => {
  switch (e) {
    case `index`:
      return `@startuml
title "Landscape view"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam person<<Author>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<Reviewer>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<AiAgent>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<BrowserRegistries>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdComments>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GitRemote>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<OtelBackend>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
person "==Document Author\\n\\nSoftware engineer writing, editing, and previewing markdown documentation" <<Author>> as Author
person "==Pull Request Reviewer\\n\\nPeer engineer or technical lead reviewing markdown documentation in PRs or local editors" <<Reviewer>> as Reviewer
person "==AI Coding Agent\\n\\nAutonomous coding agent (Antigravity, Claude Code, Cursor) creating and resolving review comments" <<AiAgent>> as AiAgent
rectangle "==Browser Extension Registries\\n\\nChrome Web Store, Microsoft Edge Add-ons, Mozilla Add-ons, and Apple App Store" <<BrowserRegistries>> as BrowserRegistries
rectangle "==Markdown Comments\\n\\nMulti-platform, local-first documentation review and commenting system storing comments outside source branches" <<MdComments>> as MdComments
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi
rectangle "==Git Remote Repository\\n\\nUpstream Git repository hosting project source branches and the orphan refs/md-comments/data branch" <<GitRemote>> as GitRemote
rectangle "==OpenTelemetry Backend\\n\\nExternal telemetry ingestion endpoint receiving scrubbed, anonymous performance and diagnostic metrics" <<OtelBackend>> as OtelBackend

Author .[#8D8D8D,thickness=2].> MdComments : <color:#8D8D8D>[...]
Reviewer .[#8D8D8D,thickness=2].> MdComments : <color:#8D8D8D>[...]
AiAgent .[#8D8D8D,thickness=2].> MdComments : <color:#8D8D8D>Reads and leaves anchored comments via agentic workflows
MdComments .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>[...]
MdComments .[#8D8D8D,thickness=2].> GitRemote : <color:#8D8D8D>Pushed and fetched from git remote
MdComments .[#8D8D8D,thickness=2].> OtelBackend : <color:#8D8D8D>Forwards sanitized telemetry spans
@enduml
`;
    case `systemContext`:
      return `@startuml
title "System Context - Markdown Comments"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam person<<Author>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<Reviewer>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<AiAgent>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsChromeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsObsidianPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsStarlightPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreview>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsTelemetryProxy>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSafariExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<OtelBackend>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam database<<MdCommentsGitRefStorage>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GitRemote>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
person "==Document Author\\n\\nSoftware engineer writing, editing, and previewing markdown documentation" <<Author>> as Author
person "==Pull Request Reviewer\\n\\nPeer engineer or technical lead reviewing markdown documentation in PRs or local editors" <<Reviewer>> as Reviewer
person "==AI Coding Agent\\n\\nAutonomous coding agent (Antigravity, Claude Code, Cursor) creating and resolving review comments" <<AiAgent>> as AiAgent
rectangle "Markdown Comments" <<MdComments>> as MdComments {
  skinparam RectangleBorderColor<<MdComments>> #3b82f6
  skinparam RectangleFontColor<<MdComments>> #3b82f6
  skinparam RectangleBorderStyle<<MdComments>> dashed

  rectangle "==VS Code Extension Subsystem\\n<size:10>[TypeScript, VS Code Extension API]</size>\\n\\nDesktop IDE extension hosting early hooks, auth resolution, optimistic state management, and preview integration" <<MdCommentsVscodeExt>> as MdCommentsVscodeExt
  rectangle "==Chrome / Edge / Firefox Extension\\n<size:10>[TypeScript, Manifest V3, WebExtensions]</size>\\n\\nCross-browser Manifest V3 extension injecting comment threads onto GitHub markdown previews and raw files" <<MdCommentsChromeExt>> as MdCommentsChromeExt
  rectangle "==Obsidian Plugin\\n<size:10>[TypeScript, Obsidian API]</size>\\n\\nObsidian Vault plugin supporting reading view anchors, live preview gutters, and sidebar commenting" <<MdCommentsObsidianPlugin>> as MdCommentsObsidianPlugin
  rectangle "==Astro / Starlight Plugin\\n<size:10>[Astro, TypeScript, CSS3]</size>\\n\\nDocumentation theme plugin and Astro integration providing an interactive slide-over comment drawer" <<MdCommentsStarlightPlugin>> as MdCommentsStarlightPlugin
  rectangle "==Webview Preview Runtime\\n<size:10>[HTML5, CSS3, Vanilla JavaScript]</size>\\n\\nIn-situ markdown preview webview environment hosting interactive comment cards, inline badges, and sidebar drawer" <<MdCommentsWebviewPreview>> as MdCommentsWebviewPreview
  rectangle "==Telemetry Proxy\\n<size:10>[TypeScript, Cloudflare Workers / Node.js]</size>\\n\\nZero-secret OpenTelemetry proxy scrubbing customer content, file paths, and author identities" <<MdCommentsTelemetryProxy>> as MdCommentsTelemetryProxy
  rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine
  rectangle "==macOS Safari Extension\\n<size:10>[Swift, WebKit, Manifest V2/V3]</size>\\n\\nNative macOS Safari Web Extension packaged with AppKit host application" <<MdCommentsSafariExt>> as MdCommentsSafariExt
  database "==Git Ref Data Store\\n<size:10>[Git Ref, YAML]</size>\\n\\nOrphan git ref (refs/md-comments/data) storing versioned YAML comments completely outside source branches" <<MdCommentsGitRefStorage>> as MdCommentsGitRefStorage
}
rectangle "==OpenTelemetry Backend\\n\\nExternal telemetry ingestion endpoint receiving scrubbed, anonymous performance and diagnostic metrics" <<OtelBackend>> as OtelBackend
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi
rectangle "==Git Remote Repository\\n\\nUpstream Git repository hosting project source branches and the orphan refs/md-comments/data branch" <<GitRemote>> as GitRemote

Author .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Edits markdown and previews comments in VS Code
Author .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>Interacts with preview drawer and comment threads
Reviewer .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Reviews local documentation in VS Code
Reviewer .[#8D8D8D,thickness=2].> MdCommentsChromeExt : <color:#8D8D8D>Reviews PR markdown files on GitHub
AiAgent .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Reads and leaves anchored comments via agentic workflows
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>[...]
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>[...]
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsTelemetryProxy : <color:#8D8D8D>Transmits scrubbed, anonymous telemetry payloads
MdCommentsWebviewPreview .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Dispatches actions (add, reply, edit, delete, react) via postMessage
MdCommentsChromeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and YAML serialization
MdCommentsObsidianPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and local storage
MdCommentsStarlightPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and client drawer
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> MdCommentsGitRefStorage : <color:#8D8D8D>Reads and writes refs/md-comments/data
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>[...]
MdCommentsChromeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Interacts with GitHub Git Data API via Device Flow
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Fetches commit parent, base tree SHA, and creates trees/commits
MdCommentsTelemetryProxy .[#8D8D8D,thickness=2].> OtelBackend : <color:#8D8D8D>Forwards sanitized telemetry spans
MdCommentsGitRefStorage .[#8D8D8D,thickness=2].> GitRemote : <color:#8D8D8D>Pushed and fetched from git remote
@enduml
`;
    case `containers`:
      return `@startuml
title "Container Diagram - Markdown Comments"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam person<<Author>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<Reviewer>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam person<<AiAgent>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsChromeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsObsidianPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsStarlightPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreview>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsTelemetryProxy>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSafariExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<OtelBackend>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam database<<MdCommentsGitRefStorage>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GitRemote>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
person "==Document Author\\n\\nSoftware engineer writing, editing, and previewing markdown documentation" <<Author>> as Author
person "==Pull Request Reviewer\\n\\nPeer engineer or technical lead reviewing markdown documentation in PRs or local editors" <<Reviewer>> as Reviewer
person "==AI Coding Agent\\n\\nAutonomous coding agent (Antigravity, Claude Code, Cursor) creating and resolving review comments" <<AiAgent>> as AiAgent
rectangle "Markdown Comments" <<MdComments>> as MdComments {
  skinparam RectangleBorderColor<<MdComments>> #3b82f6
  skinparam RectangleFontColor<<MdComments>> #3b82f6
  skinparam RectangleBorderStyle<<MdComments>> dashed

  rectangle "==VS Code Extension Subsystem\\n<size:10>[TypeScript, VS Code Extension API]</size>\\n\\nDesktop IDE extension hosting early hooks, auth resolution, optimistic state management, and preview integration" <<MdCommentsVscodeExt>> as MdCommentsVscodeExt
  rectangle "==Chrome / Edge / Firefox Extension\\n<size:10>[TypeScript, Manifest V3, WebExtensions]</size>\\n\\nCross-browser Manifest V3 extension injecting comment threads onto GitHub markdown previews and raw files" <<MdCommentsChromeExt>> as MdCommentsChromeExt
  rectangle "==Obsidian Plugin\\n<size:10>[TypeScript, Obsidian API]</size>\\n\\nObsidian Vault plugin supporting reading view anchors, live preview gutters, and sidebar commenting" <<MdCommentsObsidianPlugin>> as MdCommentsObsidianPlugin
  rectangle "==Astro / Starlight Plugin\\n<size:10>[Astro, TypeScript, CSS3]</size>\\n\\nDocumentation theme plugin and Astro integration providing an interactive slide-over comment drawer" <<MdCommentsStarlightPlugin>> as MdCommentsStarlightPlugin
  rectangle "==Webview Preview Runtime\\n<size:10>[HTML5, CSS3, Vanilla JavaScript]</size>\\n\\nIn-situ markdown preview webview environment hosting interactive comment cards, inline badges, and sidebar drawer" <<MdCommentsWebviewPreview>> as MdCommentsWebviewPreview
  rectangle "==Telemetry Proxy\\n<size:10>[TypeScript, Cloudflare Workers / Node.js]</size>\\n\\nZero-secret OpenTelemetry proxy scrubbing customer content, file paths, and author identities" <<MdCommentsTelemetryProxy>> as MdCommentsTelemetryProxy
  rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine
  rectangle "==macOS Safari Extension\\n<size:10>[Swift, WebKit, Manifest V2/V3]</size>\\n\\nNative macOS Safari Web Extension packaged with AppKit host application" <<MdCommentsSafariExt>> as MdCommentsSafariExt
  database "==Git Ref Data Store\\n<size:10>[Git Ref, YAML]</size>\\n\\nOrphan git ref (refs/md-comments/data) storing versioned YAML comments completely outside source branches" <<MdCommentsGitRefStorage>> as MdCommentsGitRefStorage
}
rectangle "==OpenTelemetry Backend\\n\\nExternal telemetry ingestion endpoint receiving scrubbed, anonymous performance and diagnostic metrics" <<OtelBackend>> as OtelBackend
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi
rectangle "==Git Remote Repository\\n\\nUpstream Git repository hosting project source branches and the orphan refs/md-comments/data branch" <<GitRemote>> as GitRemote

Author .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Edits markdown and previews comments in VS Code
Author .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>Interacts with preview drawer and comment threads
Reviewer .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Reviews local documentation in VS Code
Reviewer .[#8D8D8D,thickness=2].> MdCommentsChromeExt : <color:#8D8D8D>Reviews PR markdown files on GitHub
AiAgent .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Reads and leaves anchored comments via agentic workflows
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>[...]
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>[...]
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsTelemetryProxy : <color:#8D8D8D>Transmits scrubbed, anonymous telemetry payloads
MdCommentsWebviewPreview .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Dispatches actions (add, reply, edit, delete, react) via postMessage
MdCommentsChromeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and YAML serialization
MdCommentsObsidianPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and local storage
MdCommentsStarlightPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and client drawer
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> MdCommentsGitRefStorage : <color:#8D8D8D>Reads and writes refs/md-comments/data
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>[...]
MdCommentsChromeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Interacts with GitHub Git Data API via Device Flow
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Fetches commit parent, base tree SHA, and creates trees/commits
MdCommentsTelemetryProxy .[#8D8D8D,thickness=2].> OtelBackend : <color:#8D8D8D>Forwards sanitized telemetry spans
MdCommentsGitRefStorage .[#8D8D8D,thickness=2].> GitRemote : <color:#8D8D8D>Pushed and fetched from git remote
@enduml
`;
    case `vscodeInternals`:
      return `@startuml
title "VS Code Extension Internals"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam rectangle<<MdCommentsVscodeExtCommentPreviewPanel>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtMarkdownItPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreview>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtCommentActions>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtAuthManager>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtCommentStore>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtOptimisticStore>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExtAuthorResolver>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
rectangle "VS Code Extension Subsystem" <<MdCommentsVscodeExt>> as MdCommentsVscodeExt {
  skinparam RectangleBorderColor<<MdCommentsVscodeExt>> #3b82f6
  skinparam RectangleFontColor<<MdCommentsVscodeExt>> #3b82f6
  skinparam RectangleBorderStyle<<MdCommentsVscodeExt>> dashed

  rectangle "==Comment Preview Panel\\n<size:10>[TypeScript]</size>\\n\\nNative markdown preview coordinator, webview communicator, and custom URI handler (vscode://...)" <<MdCommentsVscodeExtCommentPreviewPanel>> as MdCommentsVscodeExtCommentPreviewPanel
  rectangle "==Markdown-It Plugin\\n<size:10>[TypeScript, markdown-it]</size>\\n\\nMarkdown-It parser plugin injecting anchored comment badges, script bridges, and floating FAB drawer widgets into the preview pipeline" <<MdCommentsVscodeExtMarkdownItPlugin>> as MdCommentsVscodeExtMarkdownItPlugin
  rectangle "==Comment Action Handler\\n<size:10>[TypeScript]</size>\\n\\nAction dispatch handler executing comment additions, replies, edits, reactions, and deletions without disruptive toasts" <<MdCommentsVscodeExtCommentActions>> as MdCommentsVscodeExtCommentActions
  rectangle "==Authentication Manager\\n<size:10>[TypeScript]</size>\\n\\nMulti-tier token resolver (Session -> context.secrets -> globalState -> process.env -> gh CLI -> RFC 8628 Device Flow) with onDidChangeAuthState event emitter" <<MdCommentsVscodeExtAuthManager>> as MdCommentsVscodeExtAuthManager
  rectangle "==Comment Store\\n<size:10>[TypeScript]</size>\\n\\nWorkspace-level comment lifecycle and persistence coordinator syncing local state with refs/md-comments/data" <<MdCommentsVscodeExtCommentStore>> as MdCommentsVscodeExtCommentStore
  rectangle "==Optimistic Mutation Store\\n<size:10>[TypeScript]</size>\\n\\nIn-memory mutation store providing resilient sequential deletions, inline edits, and instant toggle reactions" <<MdCommentsVscodeExtOptimisticStore>> as MdCommentsVscodeExtOptimisticStore
  rectangle "==Author Resolver\\n<size:10>[TypeScript]</size>\\n\\nGit config identity extractor (user.name/user.email) and GitHub user profile resolver with LRU caching and display name formatting" <<MdCommentsVscodeExtAuthorResolver>> as MdCommentsVscodeExtAuthorResolver
}
rectangle "==Webview Preview Runtime\\n<size:10>[HTML5, CSS3, Vanilla JavaScript]</size>\\n\\nIn-situ markdown preview webview environment hosting interactive comment cards, inline badges, and sidebar drawer" <<MdCommentsWebviewPreview>> as MdCommentsWebviewPreview
rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi

MdCommentsWebviewPreview .[#8D8D8D,thickness=2].> MdCommentsVscodeExtCommentActions : <color:#8D8D8D>Dispatches actions (add, reply, edit, delete, react) via postMessage
MdCommentsVscodeExtAuthManager .[#8D8D8D,thickness=2].> MdCommentsVscodeExtAuthorResolver : <color:#8D8D8D>Provides authenticated GitHub client
MdCommentsVscodeExtCommentActions .[#8D8D8D,thickness=2].> MdCommentsVscodeExtOptimisticStore : <color:#8D8D8D>Stages mutations optimistically in memory
MdCommentsVscodeExtAuthManager .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Authenticates via OAuth Device Flow (RFC 8628)
MdCommentsVscodeExtAuthorResolver .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Resolves user profiles and avatars
MdCommentsVscodeExtOptimisticStore .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>Pushes state diff to patch preview DOM in-place
MdCommentsVscodeExtCommentStore .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>[...]
MdCommentsVscodeExtCommentPreviewPanel .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>Hosts webview and sends initial comment payload
MdCommentsVscodeExtMarkdownItPlugin .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>Injects earlyHook.js, preview.css, and preview DOM elements
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Fetches commit parent, base tree SHA, and creates trees/commits
@enduml
`;
    case `previewInternals`:
      return `@startuml
title "Webview Preview Runtime Internals"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam rectangle<<MdCommentsWebviewPreviewEarlyHook>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsVscodeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreviewInplaceDomUpdater>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreviewConfirmationModal>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreviewMutationGuard>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsWebviewPreviewInlineAnchors>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
rectangle "Webview Preview Runtime" <<MdCommentsWebviewPreview>> as MdCommentsWebviewPreview {
  skinparam RectangleBorderColor<<MdCommentsWebviewPreview>> #3b82f6
  skinparam RectangleFontColor<<MdCommentsWebviewPreview>> #3b82f6
  skinparam RectangleBorderStyle<<MdCommentsWebviewPreview>> dashed

  rectangle "==Early Bootstrap Hook\\n<size:10>[Vanilla JavaScript]</size>\\n\\nSynchronous pre-bootstrap hook (earlyHook.js) caching acquireVsCodeApi(), polyfilling poster, and queueing action dispatches prior to module execution" <<MdCommentsWebviewPreviewEarlyHook>> as MdCommentsWebviewPreviewEarlyHook
  rectangle "==In-Place DOM Patcher\\n<size:10>[Vanilla JavaScript]</size>\\n\\nIn-place DOM patcher (preview-webview.js, preview.js) updating comment cards, badges, and threads without reloading document DOM" <<MdCommentsWebviewPreviewInplaceDomUpdater>> as MdCommentsWebviewPreviewInplaceDomUpdater
  rectangle "==In-Webview Confirmation Modal\\n<size:10>[Vanilla JavaScript]</size>\\n\\nIn-webview confirmation modal (showConfirmationModal) providing resilient deletion approval without disruptive native input boxes" <<MdCommentsWebviewPreviewConfirmationModal>> as MdCommentsWebviewPreviewConfirmationModal
  rectangle "==MutationObserver Guard\\n<size:10>[Vanilla JavaScript]</size>\\n\\nDebounced MutationObserver with strict text content equality checks guarding badge counters against recursive 100% CPU loops" <<MdCommentsWebviewPreviewMutationGuard>> as MdCommentsWebviewPreviewMutationGuard
  rectangle "==Inline Anchors & FAB\\n<size:10>[Vanilla JavaScript, CSS3]</size>\\n\\nDocument text anchor highlighter, gutter indicators, and floating MD FAB drawer widget" <<MdCommentsWebviewPreviewInlineAnchors>> as MdCommentsWebviewPreviewInlineAnchors
}
rectangle "==VS Code Extension Subsystem\\n<size:10>[TypeScript, VS Code Extension API]</size>\\n\\nDesktop IDE extension hosting early hooks, auth resolution, optimistic state management, and preview integration" <<MdCommentsVscodeExt>> as MdCommentsVscodeExt

MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsWebviewPreviewInplaceDomUpdater : <color:#8D8D8D>Pushes state diff to patch preview DOM in-place
MdCommentsWebviewPreviewEarlyHook .[#8D8D8D,thickness=2].> MdCommentsVscodeExt : <color:#8D8D8D>Dispatches actions (add, reply, edit, delete, react) via postMessage
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsWebviewPreview : <color:#8D8D8D>[...]
@enduml
`;
    case `browserInternals`:
      return `@startuml
title "Cross-Browser Extension Architecture"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam person<<Reviewer>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsChromeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
person "==Pull Request Reviewer\\n\\nPeer engineer or technical lead reviewing markdown documentation in PRs or local editors" <<Reviewer>> as Reviewer
rectangle "==Chrome / Edge / Firefox Extension\\n<size:10>[TypeScript, Manifest V3, WebExtensions]</size>\\n\\nCross-browser Manifest V3 extension injecting comment threads onto GitHub markdown previews and raw files" <<MdCommentsChromeExt>> as MdCommentsChromeExt
rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi

Reviewer .[#8D8D8D,thickness=2].> MdCommentsChromeExt : <color:#8D8D8D>Reviews PR markdown files on GitHub
MdCommentsChromeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Interacts with GitHub Git Data API via Device Flow
MdCommentsChromeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and YAML serialization
MdCommentsSharedEngine .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Fetches commit parent, base tree SHA, and creates trees/commits
@enduml
`;
    case `sharedInternals`:
      return `@startuml
title "Shared Domain Engine Internals"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam rectangle<<MdCommentsVscodeExt>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngineGitRefBackend>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngineLocalFileBackend>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngineAnchorEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<GithubApi>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam database<<MdCommentsGitRefStorage>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
rectangle "==VS Code Extension Subsystem\\n<size:10>[TypeScript, VS Code Extension API]</size>\\n\\nDesktop IDE extension hosting early hooks, auth resolution, optimistic state management, and preview integration" <<MdCommentsVscodeExt>> as MdCommentsVscodeExt
rectangle "Shared Domain Engine" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine {
  skinparam RectangleBorderColor<<MdCommentsSharedEngine>> #3b82f6
  skinparam RectangleFontColor<<MdCommentsSharedEngine>> #3b82f6
  skinparam RectangleBorderStyle<<MdCommentsSharedEngine>> dashed

  rectangle "==Git Ref Storage Backend\\n<size:10>[TypeScript]</size>\\n\\nGit Data API orphan ref backend with base tree SHA resolution (GET /git/commits/:sha -> tree.sha), 3-way merge, and commit comment notifications" <<MdCommentsSharedEngineGitRefBackend>> as MdCommentsSharedEngineGitRefBackend
  rectangle "==Local File Backend\\n<size:10>[TypeScript]</size>\\n\\nLocal sidecar YAML storage backend for non-git workspaces and offline evaluation" <<MdCommentsSharedEngineLocalFileBackend>> as MdCommentsSharedEngineLocalFileBackend
  rectangle "==FNV-1a Anchoring Engine\\n<size:10>[TypeScript]</size>\\n\\nFNV-1a hash anchoring algorithm with surrounding context window and normalized fuzzy search fallback cascade" <<MdCommentsSharedEngineAnchorEngine>> as MdCommentsSharedEngineAnchorEngine
}
rectangle "==GitHub REST & GraphQL API\\n\\nExternal GitHub API providing Git Data API (trees, commits, refs), OAuth Device Flow, user profiles, and commit comments" <<GithubApi>> as GithubApi
database "==Git Ref Data Store\\n<size:10>[Git Ref, YAML]</size>\\n\\nOrphan git ref (refs/md-comments/data) storing versioned YAML comments completely outside source branches" <<MdCommentsGitRefStorage>> as MdCommentsGitRefStorage

MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngineGitRefBackend : <color:#8D8D8D>Synchronizes threads with Git backend
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> MdCommentsSharedEngineLocalFileBackend : <color:#8D8D8D>Persists threads to local YAML when offline
MdCommentsSharedEngineGitRefBackend .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>Fetches commit parent, base tree SHA, and creates trees/commits
MdCommentsSharedEngineGitRefBackend .[#8D8D8D,thickness=2].> MdCommentsGitRefStorage : <color:#8D8D8D>Reads and writes refs/md-comments/data
MdCommentsVscodeExt .[#8D8D8D,thickness=2].> GithubApi : <color:#8D8D8D>[...]
@enduml
`;
    case `obsidianInternals`:
      return `@startuml
title "Obsidian Plugin Architecture"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam rectangle<<MdCommentsObsidianPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
rectangle "==Obsidian Plugin\\n<size:10>[TypeScript, Obsidian API]</size>\\n\\nObsidian Vault plugin supporting reading view anchors, live preview gutters, and sidebar commenting" <<MdCommentsObsidianPlugin>> as MdCommentsObsidianPlugin
rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine

MdCommentsObsidianPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and local storage
@enduml
`;
    case `starlightInternals`:
      return `@startuml
title "Starlight Plugin Architecture"
top to bottom direction

hide stereotype
skinparam ranksep 60
skinparam nodesep 30
skinparam {
  arrowFontSize 10
  defaultTextAlignment center
  wrapWidth 200
  maxMessageSize 100
  shadowing false
}

skinparam rectangle<<MdCommentsStarlightPlugin>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
skinparam rectangle<<MdCommentsSharedEngine>>{
  BackgroundColor #3b82f6
  FontColor #eff6ff
  BorderColor #2563eb
}
rectangle "==Astro / Starlight Plugin\\n<size:10>[Astro, TypeScript, CSS3]</size>\\n\\nDocumentation theme plugin and Astro integration providing an interactive slide-over comment drawer" <<MdCommentsStarlightPlugin>> as MdCommentsStarlightPlugin
rectangle "==Shared Domain Engine\\n<size:10>[TypeScript]</size>\\n\\nCore domain engine with FNV-1a anchor hashing, fuzzy re-anchoring, Git Data API backend, and 3-way merge logic" <<MdCommentsSharedEngine>> as MdCommentsSharedEngine

MdCommentsStarlightPlugin .[#8D8D8D,thickness=2].> MdCommentsSharedEngine : <color:#8D8D8D>Uses anchor matching and client drawer
@enduml
`;
    default:
      throw Error(`Unknown viewId: ` + e);
  }
};
export { e as pumlSource };
