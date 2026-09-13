var e = (e) => {
  switch (e) {
    case `index`:
      return `---
title: "Landscape view"
---
graph TB
  Author@{ icon: "fa:user", shape: rounded, label: "Document Author" }
  Reviewer@{ icon: "fa:user", shape: rounded, label: "Pull Request Reviewer" }
  AiAgent@{ icon: "fa:user", shape: rounded, label: "AI Coding Agent" }
  BrowserRegistries@{ shape: rectangle, label: "Browser Extension Registries" }
  MdComments@{ shape: rectangle, label: "Markdown Comments" }
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  GitRemote@{ shape: rectangle, label: "Git Remote Repository" }
  OtelBackend@{ shape: rectangle, label: "OpenTelemetry Backend" }
  Author -. "\`[...]\`" .-> MdComments
  Reviewer -. "\`[...]\`" .-> MdComments
  AiAgent -. "\`Reads and leaves anchored comments via agentic workflows\`" .-> MdComments
  MdComments -. "\`[...]\`" .-> GithubApi
  MdComments -. "\`Pushed and fetched from git remote\`" .-> GitRemote
  MdComments -. "\`Forwards sanitized telemetry spans\`" .-> OtelBackend
`;
    case `systemContext`:
      return `---
title: "System Context - Markdown Comments"
---
graph TB
  Author@{ icon: "fa:user", shape: rounded, label: "Document Author" }
  Reviewer@{ icon: "fa:user", shape: rounded, label: "Pull Request Reviewer" }
  AiAgent@{ icon: "fa:user", shape: rounded, label: "AI Coding Agent" }
  subgraph MdComments["\`Markdown Comments\`"]
    MdComments.VscodeExt@{ shape: rectangle, label: "VS Code Extension Subsystem" }
    MdComments.ChromeExt@{ shape: rectangle, label: "Chrome / Edge / Firefox Extension" }
    MdComments.ObsidianPlugin@{ shape: rectangle, label: "Obsidian Plugin" }
    MdComments.StarlightPlugin@{ shape: rectangle, label: "Astro / Starlight Plugin" }
    MdComments.WebviewPreview@{ shape: rectangle, label: "Webview Preview Runtime" }
    MdComments.TelemetryProxy@{ shape: rectangle, label: "Telemetry Proxy" }
    MdComments.SharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
    MdComments.SafariExt@{ shape: rectangle, label: "macOS Safari Extension" }
    MdComments.GitRefStorage@{ shape: disk, label: "Git Ref Data Store" }
  end
  OtelBackend@{ shape: rectangle, label: "OpenTelemetry Backend" }
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  GitRemote@{ shape: rectangle, label: "Git Remote Repository" }
  Author -. "\`Edits markdown and previews comments in VS Code\`" .-> MdComments.VscodeExt
  Author -. "\`Interacts with preview drawer and comment threads\`" .-> MdComments.WebviewPreview
  Reviewer -. "\`Reviews local documentation in VS Code\`" .-> MdComments.VscodeExt
  Reviewer -. "\`Reviews PR markdown files on GitHub\`" .-> MdComments.ChromeExt
  AiAgent -. "\`Reads and leaves anchored comments via agentic workflows\`" .-> MdComments.VscodeExt
  MdComments.VscodeExt -. "\`[...]\`" .-> MdComments.WebviewPreview
  MdComments.VscodeExt -. "\`[...]\`" .-> MdComments.SharedEngine
  MdComments.VscodeExt -. "\`Transmits scrubbed, anonymous telemetry payloads\`" .-> MdComments.TelemetryProxy
  MdComments.WebviewPreview -. "\`Dispatches actions (add, reply, edit, delete, react) via postMessage\`" .-> MdComments.VscodeExt
  MdComments.ChromeExt -. "\`Uses anchor matching and YAML serialization\`" .-> MdComments.SharedEngine
  MdComments.ObsidianPlugin -. "\`Uses anchor matching and local storage\`" .-> MdComments.SharedEngine
  MdComments.StarlightPlugin -. "\`Uses anchor matching and client drawer\`" .-> MdComments.SharedEngine
  MdComments.SharedEngine -. "\`Reads and writes refs/md-comments/data\`" .-> MdComments.GitRefStorage
  MdComments.VscodeExt -. "\`[...]\`" .-> GithubApi
  MdComments.ChromeExt -. "\`Interacts with GitHub Git Data API via Device Flow\`" .-> GithubApi
  MdComments.SharedEngine -. "\`Fetches commit parent, base tree SHA, and creates trees/commits\`" .-> GithubApi
  MdComments.TelemetryProxy -. "\`Forwards sanitized telemetry spans\`" .-> OtelBackend
  MdComments.GitRefStorage -. "\`Pushed and fetched from git remote\`" .-> GitRemote
`;
    case `containers`:
      return `---
title: "Container Diagram - Markdown Comments"
---
graph TB
  Author@{ icon: "fa:user", shape: rounded, label: "Document Author" }
  Reviewer@{ icon: "fa:user", shape: rounded, label: "Pull Request Reviewer" }
  AiAgent@{ icon: "fa:user", shape: rounded, label: "AI Coding Agent" }
  subgraph MdComments["\`Markdown Comments\`"]
    MdComments.VscodeExt@{ shape: rectangle, label: "VS Code Extension Subsystem" }
    MdComments.ChromeExt@{ shape: rectangle, label: "Chrome / Edge / Firefox Extension" }
    MdComments.ObsidianPlugin@{ shape: rectangle, label: "Obsidian Plugin" }
    MdComments.StarlightPlugin@{ shape: rectangle, label: "Astro / Starlight Plugin" }
    MdComments.WebviewPreview@{ shape: rectangle, label: "Webview Preview Runtime" }
    MdComments.TelemetryProxy@{ shape: rectangle, label: "Telemetry Proxy" }
    MdComments.SharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
    MdComments.SafariExt@{ shape: rectangle, label: "macOS Safari Extension" }
    MdComments.GitRefStorage@{ shape: disk, label: "Git Ref Data Store" }
  end
  OtelBackend@{ shape: rectangle, label: "OpenTelemetry Backend" }
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  GitRemote@{ shape: rectangle, label: "Git Remote Repository" }
  Author -. "\`Edits markdown and previews comments in VS Code\`" .-> MdComments.VscodeExt
  Author -. "\`Interacts with preview drawer and comment threads\`" .-> MdComments.WebviewPreview
  Reviewer -. "\`Reviews local documentation in VS Code\`" .-> MdComments.VscodeExt
  Reviewer -. "\`Reviews PR markdown files on GitHub\`" .-> MdComments.ChromeExt
  AiAgent -. "\`Reads and leaves anchored comments via agentic workflows\`" .-> MdComments.VscodeExt
  MdComments.VscodeExt -. "\`[...]\`" .-> MdComments.WebviewPreview
  MdComments.VscodeExt -. "\`[...]\`" .-> MdComments.SharedEngine
  MdComments.VscodeExt -. "\`Transmits scrubbed, anonymous telemetry payloads\`" .-> MdComments.TelemetryProxy
  MdComments.WebviewPreview -. "\`Dispatches actions (add, reply, edit, delete, react) via postMessage\`" .-> MdComments.VscodeExt
  MdComments.ChromeExt -. "\`Uses anchor matching and YAML serialization\`" .-> MdComments.SharedEngine
  MdComments.ObsidianPlugin -. "\`Uses anchor matching and local storage\`" .-> MdComments.SharedEngine
  MdComments.StarlightPlugin -. "\`Uses anchor matching and client drawer\`" .-> MdComments.SharedEngine
  MdComments.SharedEngine -. "\`Reads and writes refs/md-comments/data\`" .-> MdComments.GitRefStorage
  MdComments.VscodeExt -. "\`[...]\`" .-> GithubApi
  MdComments.ChromeExt -. "\`Interacts with GitHub Git Data API via Device Flow\`" .-> GithubApi
  MdComments.SharedEngine -. "\`Fetches commit parent, base tree SHA, and creates trees/commits\`" .-> GithubApi
  MdComments.TelemetryProxy -. "\`Forwards sanitized telemetry spans\`" .-> OtelBackend
  MdComments.GitRefStorage -. "\`Pushed and fetched from git remote\`" .-> GitRemote
`;
    case `vscodeInternals`:
      return `---
title: "VS Code Extension Internals"
---
graph TB
  subgraph MdCommentsVscodeExt["\`VS Code Extension Subsystem\`"]
    MdCommentsVscodeExt.CommentPreviewPanel@{ shape: rectangle, label: "Comment Preview Panel" }
    MdCommentsVscodeExt.MarkdownItPlugin@{ shape: rectangle, label: "Markdown-It Plugin" }
    MdCommentsVscodeExt.CommentActions@{ shape: rectangle, label: "Comment Action Handler" }
    MdCommentsVscodeExt.AuthManager@{ shape: rectangle, label: "Authentication Manager" }
    MdCommentsVscodeExt.CommentStore@{ shape: rectangle, label: "Comment Store" }
    MdCommentsVscodeExt.OptimisticStore@{ shape: rectangle, label: "Optimistic Mutation Store" }
    MdCommentsVscodeExt.AuthorResolver@{ shape: rectangle, label: "Author Resolver" }
  end
  MdCommentsWebviewPreview@{ shape: rectangle, label: "Webview Preview Runtime" }
  MdCommentsSharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  MdCommentsWebviewPreview -. "\`Dispatches actions (add, reply, edit, delete, react) via postMessage\`" .-> MdCommentsVscodeExt.CommentActions
  MdCommentsVscodeExt.AuthManager -. "\`Provides authenticated GitHub client\`" .-> MdCommentsVscodeExt.AuthorResolver
  MdCommentsVscodeExt.CommentActions -. "\`Stages mutations optimistically in memory\`" .-> MdCommentsVscodeExt.OptimisticStore
  MdCommentsVscodeExt.AuthManager -. "\`Authenticates via OAuth Device Flow (RFC 8628)\`" .-> GithubApi
  MdCommentsVscodeExt.AuthorResolver -. "\`Resolves user profiles and avatars\`" .-> GithubApi
  MdCommentsVscodeExt.OptimisticStore -. "\`Pushes state diff to patch preview DOM in-place\`" .-> MdCommentsWebviewPreview
  MdCommentsVscodeExt.CommentStore -. "\`[...]\`" .-> MdCommentsSharedEngine
  MdCommentsVscodeExt.CommentPreviewPanel -. "\`Hosts webview and sends initial comment payload\`" .-> MdCommentsWebviewPreview
  MdCommentsVscodeExt.MarkdownItPlugin -. "\`Injects earlyHook.js, preview.css, and preview DOM elements\`" .-> MdCommentsWebviewPreview
  MdCommentsSharedEngine -. "\`Fetches commit parent, base tree SHA, and creates trees/commits\`" .-> GithubApi
`;
    case `previewInternals`:
      return `---
title: "Webview Preview Runtime Internals"
---
graph TB
  subgraph MdCommentsWebviewPreview["\`Webview Preview Runtime\`"]
    MdCommentsWebviewPreview.EarlyHook@{ shape: rectangle, label: "Early Bootstrap Hook" }
    MdCommentsWebviewPreview.InplaceDomUpdater@{ shape: rectangle, label: "In-Place DOM Patcher" }
    MdCommentsWebviewPreview.ConfirmationModal@{ shape: rectangle, label: "In-Webview Confirmation Modal" }
    MdCommentsWebviewPreview.MutationGuard@{ shape: rectangle, label: "MutationObserver Guard" }
    MdCommentsWebviewPreview.InlineAnchors@{ shape: rectangle, label: "Inline Anchors & FAB" }
  end
  MdCommentsVscodeExt@{ shape: rectangle, label: "VS Code Extension Subsystem" }
  MdCommentsVscodeExt -. "\`Pushes state diff to patch preview DOM in-place\`" .-> MdCommentsWebviewPreview.InplaceDomUpdater
  MdCommentsWebviewPreview.EarlyHook -. "\`Dispatches actions (add, reply, edit, delete, react) via postMessage\`" .-> MdCommentsVscodeExt
  MdCommentsVscodeExt -. "\`[...]\`" .-> MdCommentsWebviewPreview
`;
    case `browserInternals`:
      return `---
title: "Cross-Browser Extension Architecture"
---
graph TB
  Reviewer@{ icon: "fa:user", shape: rounded, label: "Pull Request Reviewer" }
  MdCommentsChromeExt@{ shape: rectangle, label: "Chrome / Edge / Firefox Extension" }
  MdCommentsSharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  Reviewer -. "\`Reviews PR markdown files on GitHub\`" .-> MdCommentsChromeExt
  MdCommentsChromeExt -. "\`Interacts with GitHub Git Data API via Device Flow\`" .-> GithubApi
  MdCommentsChromeExt -. "\`Uses anchor matching and YAML serialization\`" .-> MdCommentsSharedEngine
  MdCommentsSharedEngine -. "\`Fetches commit parent, base tree SHA, and creates trees/commits\`" .-> GithubApi
`;
    case `sharedInternals`:
      return `---
title: "Shared Domain Engine Internals"
---
graph TB
  MdCommentsVscodeExt@{ shape: rectangle, label: "VS Code Extension Subsystem" }
  subgraph MdCommentsSharedEngine["\`Shared Domain Engine\`"]
    MdCommentsSharedEngine.GitRefBackend@{ shape: rectangle, label: "Git Ref Storage Backend" }
    MdCommentsSharedEngine.LocalFileBackend@{ shape: rectangle, label: "Local File Backend" }
    MdCommentsSharedEngine.AnchorEngine@{ shape: rectangle, label: "FNV-1a Anchoring Engine" }
  end
  GithubApi@{ shape: rectangle, label: "GitHub REST & GraphQL API" }
  MdCommentsGitRefStorage@{ shape: disk, label: "Git Ref Data Store" }
  MdCommentsVscodeExt -. "\`Synchronizes threads with Git backend\`" .-> MdCommentsSharedEngine.GitRefBackend
  MdCommentsVscodeExt -. "\`Persists threads to local YAML when offline\`" .-> MdCommentsSharedEngine.LocalFileBackend
  MdCommentsSharedEngine.GitRefBackend -. "\`Fetches commit parent, base tree SHA, and creates trees/commits\`" .-> GithubApi
  MdCommentsSharedEngine.GitRefBackend -. "\`Reads and writes refs/md-comments/data\`" .-> MdCommentsGitRefStorage
  MdCommentsVscodeExt -. "\`[...]\`" .-> GithubApi
`;
    case `obsidianInternals`:
      return `---
title: "Obsidian Plugin Architecture"
---
graph TB
  MdCommentsObsidianPlugin@{ shape: rectangle, label: "Obsidian Plugin" }
  MdCommentsSharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
  MdCommentsObsidianPlugin -. "\`Uses anchor matching and local storage\`" .-> MdCommentsSharedEngine
`;
    case `starlightInternals`:
      return `---
title: "Starlight Plugin Architecture"
---
graph TB
  MdCommentsStarlightPlugin@{ shape: rectangle, label: "Astro / Starlight Plugin" }
  MdCommentsSharedEngine@{ shape: rectangle, label: "Shared Domain Engine" }
  MdCommentsStarlightPlugin -. "\`Uses anchor matching and client drawer\`" .-> MdCommentsSharedEngine
`;
    default:
      throw Error(`Unknown viewId: ` + e);
  }
};
export { e as mmdSource };
