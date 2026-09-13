var e = (e) => {
  switch (e) {
    case `index`:
      return `direction: down

Author: {
  label: "Document Author"
  shape: c4-person
}
Reviewer: {
  label: "Pull Request Reviewer"
  shape: c4-person
}
AiAgent: {
  label: "AI Coding Agent"
  shape: c4-person
}
BrowserRegistries: {
  label: "Browser Extension Registries"
}
MdComments: {
  label: "Markdown Comments"
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}
GitRemote: {
  label: "Git Remote Repository"
}
OtelBackend: {
  label: "OpenTelemetry Backend"
}

Author -> MdComments: "[...]"
Reviewer -> MdComments: "[...]"
AiAgent -> MdComments: "Reads and leaves anchored comments via agentic workflows"
MdComments -> GithubApi: "[...]"
MdComments -> GitRemote: "Pushed and fetched from git remote"
MdComments -> OtelBackend: "Forwards sanitized telemetry spans"
`;
    case `systemContext`:
      return `direction: down

Author: {
  label: "Document Author"
  shape: c4-person
}
Reviewer: {
  label: "Pull Request Reviewer"
  shape: c4-person
}
AiAgent: {
  label: "AI Coding Agent"
  shape: c4-person
}
MdComments: {
  label: "Markdown Comments"

  VscodeExt: {
    label: "VS Code Extension Subsystem"
  }
  ChromeExt: {
    label: "Chrome / Edge / Firefox Extension"
  }
  ObsidianPlugin: {
    label: "Obsidian Plugin"
  }
  StarlightPlugin: {
    label: "Astro / Starlight Plugin"
  }
  WebviewPreview: {
    label: "Webview Preview Runtime"
  }
  TelemetryProxy: {
    label: "Telemetry Proxy"
  }
  SharedEngine: {
    label: "Shared Domain Engine"
  }
  SafariExt: {
    label: "macOS Safari Extension"
  }
  GitRefStorage: {
    label: "Git Ref Data Store"
    shape: stored_data
  }
}
OtelBackend: {
  label: "OpenTelemetry Backend"
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}
GitRemote: {
  label: "Git Remote Repository"
}

Author -> MdComments.VscodeExt: "Edits markdown and previews comments in VS Code"
Author -> MdComments.WebviewPreview: "Interacts with preview drawer and comment threads"
Reviewer -> MdComments.VscodeExt: "Reviews local documentation in VS Code"
Reviewer -> MdComments.ChromeExt: "Reviews PR markdown files on GitHub"
AiAgent -> MdComments.VscodeExt: "Reads and leaves anchored comments via agentic workflows"
MdComments.VscodeExt -> MdComments.WebviewPreview: "[...]"
MdComments.VscodeExt -> MdComments.SharedEngine: "[...]"
MdComments.VscodeExt -> MdComments.TelemetryProxy: "Transmits scrubbed, anonymous telemetry payloads"
MdComments.WebviewPreview -> MdComments.VscodeExt: "Dispatches actions (add, reply, edit, delete, react) via postMessage"
MdComments.ChromeExt -> MdComments.SharedEngine: "Uses anchor matching and YAML serialization"
MdComments.ObsidianPlugin -> MdComments.SharedEngine: "Uses anchor matching and local storage"
MdComments.StarlightPlugin -> MdComments.SharedEngine: "Uses anchor matching and client drawer"
MdComments.SharedEngine -> MdComments.GitRefStorage: "Reads and writes refs/md-comments/data"
MdComments.VscodeExt -> GithubApi: "[...]"
MdComments.ChromeExt -> GithubApi: "Interacts with GitHub Git Data API via Device Flow"
MdComments.SharedEngine -> GithubApi: "Fetches commit parent, base tree SHA, and creates trees/commits"
MdComments.TelemetryProxy -> OtelBackend: "Forwards sanitized telemetry spans"
MdComments.GitRefStorage -> GitRemote: "Pushed and fetched from git remote"
`;
    case `containers`:
      return `direction: down

Author: {
  label: "Document Author"
  shape: c4-person
}
Reviewer: {
  label: "Pull Request Reviewer"
  shape: c4-person
}
AiAgent: {
  label: "AI Coding Agent"
  shape: c4-person
}
MdComments: {
  label: "Markdown Comments"

  VscodeExt: {
    label: "VS Code Extension Subsystem"
  }
  ChromeExt: {
    label: "Chrome / Edge / Firefox Extension"
  }
  ObsidianPlugin: {
    label: "Obsidian Plugin"
  }
  StarlightPlugin: {
    label: "Astro / Starlight Plugin"
  }
  WebviewPreview: {
    label: "Webview Preview Runtime"
  }
  TelemetryProxy: {
    label: "Telemetry Proxy"
  }
  SharedEngine: {
    label: "Shared Domain Engine"
  }
  SafariExt: {
    label: "macOS Safari Extension"
  }
  GitRefStorage: {
    label: "Git Ref Data Store"
    shape: stored_data
  }
}
OtelBackend: {
  label: "OpenTelemetry Backend"
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}
GitRemote: {
  label: "Git Remote Repository"
}

Author -> MdComments.VscodeExt: "Edits markdown and previews comments in VS Code"
Author -> MdComments.WebviewPreview: "Interacts with preview drawer and comment threads"
Reviewer -> MdComments.VscodeExt: "Reviews local documentation in VS Code"
Reviewer -> MdComments.ChromeExt: "Reviews PR markdown files on GitHub"
AiAgent -> MdComments.VscodeExt: "Reads and leaves anchored comments via agentic workflows"
MdComments.VscodeExt -> MdComments.WebviewPreview: "[...]"
MdComments.VscodeExt -> MdComments.SharedEngine: "[...]"
MdComments.VscodeExt -> MdComments.TelemetryProxy: "Transmits scrubbed, anonymous telemetry payloads"
MdComments.WebviewPreview -> MdComments.VscodeExt: "Dispatches actions (add, reply, edit, delete, react) via postMessage"
MdComments.ChromeExt -> MdComments.SharedEngine: "Uses anchor matching and YAML serialization"
MdComments.ObsidianPlugin -> MdComments.SharedEngine: "Uses anchor matching and local storage"
MdComments.StarlightPlugin -> MdComments.SharedEngine: "Uses anchor matching and client drawer"
MdComments.SharedEngine -> MdComments.GitRefStorage: "Reads and writes refs/md-comments/data"
MdComments.VscodeExt -> GithubApi: "[...]"
MdComments.ChromeExt -> GithubApi: "Interacts with GitHub Git Data API via Device Flow"
MdComments.SharedEngine -> GithubApi: "Fetches commit parent, base tree SHA, and creates trees/commits"
MdComments.TelemetryProxy -> OtelBackend: "Forwards sanitized telemetry spans"
MdComments.GitRefStorage -> GitRemote: "Pushed and fetched from git remote"
`;
    case `vscodeInternals`:
      return `direction: down

MdCommentsVscodeExt: {
  label: "VS Code Extension Subsystem"

  CommentPreviewPanel: {
    label: "Comment Preview Panel"
  }
  MarkdownItPlugin: {
    label: "Markdown-It Plugin"
  }
  CommentActions: {
    label: "Comment Action Handler"
  }
  AuthManager: {
    label: "Authentication Manager"
  }
  CommentStore: {
    label: "Comment Store"
  }
  OptimisticStore: {
    label: "Optimistic Mutation Store"
  }
  AuthorResolver: {
    label: "Author Resolver"
  }
}
MdCommentsWebviewPreview: {
  label: "Webview Preview Runtime"
}
MdCommentsSharedEngine: {
  label: "Shared Domain Engine"
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}

MdCommentsWebviewPreview -> MdCommentsVscodeExt.CommentActions: "Dispatches actions (add, reply, edit, delete, react) via postMessage"
MdCommentsVscodeExt.AuthManager -> MdCommentsVscodeExt.AuthorResolver: "Provides authenticated GitHub client"
MdCommentsVscodeExt.CommentActions -> MdCommentsVscodeExt.OptimisticStore: "Stages mutations optimistically in memory"
MdCommentsVscodeExt.AuthManager -> GithubApi: "Authenticates via OAuth Device Flow (RFC 8628)"
MdCommentsVscodeExt.AuthorResolver -> GithubApi: "Resolves user profiles and avatars"
MdCommentsVscodeExt.OptimisticStore -> MdCommentsWebviewPreview: "Pushes state diff to patch preview DOM in-place"
MdCommentsVscodeExt.CommentStore -> MdCommentsSharedEngine: "[...]"
MdCommentsVscodeExt.CommentPreviewPanel -> MdCommentsWebviewPreview: "Hosts webview and sends initial comment payload"
MdCommentsVscodeExt.MarkdownItPlugin -> MdCommentsWebviewPreview: "Injects earlyHook.js, preview.css, and preview DOM elements"
MdCommentsSharedEngine -> GithubApi: "Fetches commit parent, base tree SHA, and creates trees/commits"
`;
    case `previewInternals`:
      return `direction: down

MdCommentsWebviewPreview: {
  label: "Webview Preview Runtime"

  EarlyHook: {
    label: "Early Bootstrap Hook"
  }
  InplaceDomUpdater: {
    label: "In-Place DOM Patcher"
  }
  ConfirmationModal: {
    label: "In-Webview Confirmation Modal"
  }
  MutationGuard: {
    label: "MutationObserver Guard"
  }
  InlineAnchors: {
    label: "Inline Anchors & FAB"
  }
}
MdCommentsVscodeExt: {
  label: "VS Code Extension Subsystem"
}

MdCommentsVscodeExt -> MdCommentsWebviewPreview.InplaceDomUpdater: "Pushes state diff to patch preview DOM in-place"
MdCommentsWebviewPreview.EarlyHook -> MdCommentsVscodeExt: "Dispatches actions (add, reply, edit, delete, react) via postMessage"
MdCommentsVscodeExt -> MdCommentsWebviewPreview: "[...]"
`;
    case `browserInternals`:
      return `direction: down

Reviewer: {
  label: "Pull Request Reviewer"
  shape: c4-person
}
MdCommentsChromeExt: {
  label: "Chrome / Edge / Firefox Extension"
}
MdCommentsSharedEngine: {
  label: "Shared Domain Engine"
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}

Reviewer -> MdCommentsChromeExt: "Reviews PR markdown files on GitHub"
MdCommentsChromeExt -> GithubApi: "Interacts with GitHub Git Data API via Device Flow"
MdCommentsChromeExt -> MdCommentsSharedEngine: "Uses anchor matching and YAML serialization"
MdCommentsSharedEngine -> GithubApi: "Fetches commit parent, base tree SHA, and creates trees/commits"
`;
    case `sharedInternals`:
      return `direction: down

MdCommentsVscodeExt: {
  label: "VS Code Extension Subsystem"
}
MdCommentsSharedEngine: {
  label: "Shared Domain Engine"

  GitRefBackend: {
    label: "Git Ref Storage Backend"
  }
  LocalFileBackend: {
    label: "Local File Backend"
  }
  AnchorEngine: {
    label: "FNV-1a Anchoring Engine"
  }
}
GithubApi: {
  label: "GitHub REST & GraphQL API"
}
MdCommentsGitRefStorage: {
  label: "Git Ref Data Store"
  shape: stored_data
}

MdCommentsVscodeExt -> MdCommentsSharedEngine.GitRefBackend: "Synchronizes threads with Git backend"
MdCommentsVscodeExt -> MdCommentsSharedEngine.LocalFileBackend: "Persists threads to local YAML when offline"
MdCommentsSharedEngine.GitRefBackend -> GithubApi: "Fetches commit parent, base tree SHA, and creates trees/commits"
MdCommentsSharedEngine.GitRefBackend -> MdCommentsGitRefStorage: "Reads and writes refs/md-comments/data"
MdCommentsVscodeExt -> GithubApi: "[...]"
`;
    case `obsidianInternals`:
      return `direction: down

MdCommentsObsidianPlugin: {
  label: "Obsidian Plugin"
}
MdCommentsSharedEngine: {
  label: "Shared Domain Engine"
}

MdCommentsObsidianPlugin -> MdCommentsSharedEngine: "Uses anchor matching and local storage"
`;
    case `starlightInternals`:
      return `direction: down

MdCommentsStarlightPlugin: {
  label: "Astro / Starlight Plugin"
}
MdCommentsSharedEngine: {
  label: "Shared Domain Engine"
}

MdCommentsStarlightPlugin -> MdCommentsSharedEngine: "Uses anchor matching and client drawer"
`;
    default:
      throw Error(`Unknown viewId: ` + e);
  }
};
export { e as d2Source };
