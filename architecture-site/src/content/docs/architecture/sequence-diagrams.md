---
title: "Runtime Sequence Diagrams"
description: "Step-by-step lifecycles for optimistic preview sync, multi-tier auth, modal deletion, and Git ref storage."
---

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

This document specifies the eight core runtime lifecycles of Markdown Comments using detailed sequence diagrams.

---

## Sequence 1: Text Selection, FNV-1a Hash Anchoring & Comment Creation

Documents the journey from a user highlighting Markdown text to an anchored comment thread being optimistically rendered and staged for storage.

```mermaid
sequenceDiagram
  autonumber
  actor User as Document Author / Reviewer
  participant Editor as Markdown Editor / Webview
  participant AnchorEngine as @md-comments/shared (anchorEngine)
  participant Actions as vscode-extension (commentActions)
  participant OptStore as vscode-extension (optimisticStore)
  participant WebviewDOM as Webview DOM (preview-webview.js)
  participant Storage as Storage Backend (gitRefBackend)

  User->>Editor: Highlight Markdown text range
  Editor->>AnchorEngine: createAnchor({ path, startLine, endLine, text, context })
  AnchorEngine->>AnchorEngine: Normalize whitespace & compute 32-bit FNV-1a hash
  AnchorEngine-->>Editor: Anchor Object { path, lines, hash, contextBefore, contextAfter }

  User->>Editor: Enter comment text & click Submit
  Editor->>Actions: dispatch('addComment', { anchor, body })
  Actions->>OptStore: stageComment(newThread)
  OptStore-->>Actions: State updated (optimisticThread)
  Actions->>WebviewDOM: postMessage({ type: 'updateThread', thread: newThread })
  WebviewDOM->>WebviewDOM: In-place DOM render (card inserted, badge incremented)

  Actions->>Storage: saveThread(newThread) (async background)
  Storage-->>Actions: Success (persisted to refs/md-comments/data)
```

---

## Sequence 2: Thread Reply, Reaction, Edit & In-Place Optimistic Preview Sync

Captures the real-time optimistic update flow. The webview communicates through `earlyHook.js` to dispatch actions, mutating the DOM immediately without refreshing the document.

```mermaid
sequenceDiagram
  autonumber
  actor User as Document Author / Reviewer
  participant Webview as Webview DOM
  participant EarlyHook as earlyHook.js
  participant ExtHost as Extension Host (commentActions)
  participant OptStore as optimisticStore
  participant Patcher as In-Place DOM Patcher (preview-webview.js)
  participant Guard as MutationObserver Guard

  User->>Webview: Clicks emoji reaction / Submits reply / Edits comment
  Webview->>EarlyHook: dispatchAction('toggleReaction', { threadId, commentId, emoji })
  EarlyHook->>ExtHost: postMessage({ command: 'toggleReaction', payload: {...} })

  ExtHost->>OptStore: toggleReaction(threadId, commentId, emoji, currentUser)
  OptStore-->>ExtHost: Returns optimistic state delta

  ExtHost->>EarlyHook: postMessage({ type: 'updateThread', thread: updatedThread })
  EarlyHook->>Patcher: handleUpdateThread(updatedThread)

  Patcher->>Patcher: Locate existing DOM card by data-thread-id
  Patcher->>Guard: Validate new text content !== existing text content
  Note over Guard: INV-MUTATION-GUARD:<br/>Suppresses update if content identical
  Guard-->>Patcher: Content changed -> Proceed
  Patcher->>Webview: Update counter/badge in-place (scroll & tab focus preserved)
```

---

## Sequence 3: Multi-Tiered Authentication & Token Persistence Lifecycle

Details the 6-tier fallback chain used by the VS Code extension to authenticate users, persist credentials, and broadcast state changes across preview webviews.

```mermaid
sequenceDiagram
  autonumber
  participant Ext as Extension Activation (extension.ts)
  participant AuthMgr as githubAuth (authManager)
  participant VSCodeAPI as vscode.authentication
  participant Secrets as context.secrets
  participant GlobalState as context.globalState
  participant ProcessEnv as process.env
  participant GhCLI as gh CLI (`gh auth token`)
  participant DeviceFlow as RFC 8628 Device Code Flow
  participant GitHub as GitHub OAuth API
  participant EventBus as onDidChangeAuthState Emitter

  Ext->>AuthMgr: initializeAuth(context)

  Note over AuthMgr,DeviceFlow: Tier 1: Active IDE Session
  AuthMgr->>VSCodeAPI: getSession('github', ['repo', 'read:user'], { createIfNone: false })
  alt Session Present
    VSCodeAPI-->>AuthMgr: Return session token
  else Session Missing
    Note over AuthMgr,DeviceFlow: Tier 2: Secret Storage
    AuthMgr->>Secrets: get('github.token')
    alt Secret Present
      Secrets-->>AuthMgr: Return stored token
    else Secret Missing
      Note over AuthMgr,DeviceFlow: Tier 3: Global State Persistence (INV-AUTH-PERSISTENCE)
      AuthMgr->>GlobalState: get('github.auth.flag')
      Note over AuthMgr,DeviceFlow: Tier 4: Environment Variables
      AuthMgr->>ProcessEnv: Check GITHUB_TOKEN / GH_TOKEN
      alt Env Token Present
        ProcessEnv-->>AuthMgr: Return env token
      else Env Missing
        Note over AuthMgr,DeviceFlow: Tier 5: GitHub CLI Executable
        AuthMgr->>GhCLI: Execute `gh auth token`
        alt gh CLI Authenticated
          GhCLI-->>AuthMgr: Return CLI token
        else gh CLI Unavailable
          Note over AuthMgr,DeviceFlow: Tier 6: Interactive RFC 8628 Device Flow
          AuthMgr->>DeviceFlow: startDeviceFlow()
          DeviceFlow->>GitHub: POST /login/device/code
          GitHub-->>DeviceFlow: { user_code, verification_uri, device_code }
          DeviceFlow->>Ext: Prompt user to authorize in browser
          DeviceFlow->>GitHub: Poll /login/oauth/access_token
          GitHub-->>DeviceFlow: Return access_token
        end
      end
    end
  end

  AuthMgr->>GlobalState: update('github.auth.flag', true)
  AuthMgr->>EventBus: fire({ authenticated: true, user: currentUser })
  EventBus->>Ext: Update Status Bar & TreeView
  EventBus->>Webview: Broadcast auth state update
```

---

## Sequence 4: Git-Ref Tree & Commit Pipeline with Base Tree SHA Resolution

Illustrates how comments are committed to `refs/md-comments/data` via the GitHub Git Data API, resolving the base tree SHA to prevent orphan tree corruption (`INV-BASE-TREE-SHA`).

```mermaid
sequenceDiagram
  autonumber
  participant Backend as gitRefBackend.ts
  participant GitHub as GitHub Git Data API
  participant Remote as Git Remote Server

  Backend->>GitHub: GET /repos/:owner/:repo/git/ref/heads/refs/md-comments/data
  alt Ref Exists
    GitHub-->>Backend: 200 OK { object: { sha: parentCommitSha } }
    Backend->>GitHub: GET /repos/:owner/:repo/git/commits/:parentCommitSha
    Note over Backend,GitHub: INV-BASE-TREE-SHA:<br/>Must resolve commit.tree.sha, NOT parent commit SHA
    GitHub-->>Backend: 200 OK { tree: { sha: baseTreeSha } }
  else Ref Does Not Exist (Initial Setup)
    GitHub-->>Backend: 404 Not Found
    Note over Backend: Initialize orphan ref with null base_tree
  end

  Backend->>GitHub: POST /repos/:owner/:repo/git/trees { base_tree: baseTreeSha, tree: [blobs] }
  GitHub-->>Backend: 201 Created { sha: newTreeSha }

  Backend->>GitHub: POST /repos/:owner/:repo/git/commits { message, tree: newTreeSha, parents: [parentCommitSha] }
  GitHub-->>Backend: 201 Created { sha: newCommitSha }

  Backend->>GitHub: PATCH /repos/:owner/:repo/git/refs/heads/refs/md-comments/data { sha: newCommitSha, force: false }
  alt Fast-Forward Update OK
    GitHub-->>Backend: 200 OK
  else 409 Conflict (Concurrent Push)
    GitHub-->>Backend: 409 Conflict
    Note over Backend: INV-FAST-FORWARD-RETRY:<br/>Perform 3-way merge and retry with exponential backoff
    Backend->>Backend: Pull latest ref, merge YAML threads, retry commit
  end
```

---

## Sequence 5: Resilient Comment Deletion & In-Preview Modal Confirmation Flow

Shows the safe, non-disruptive deletion workflow that protects against accidental deletions, input focus loss, and thread resurrection.

```mermaid
sequenceDiagram
  autonumber
  actor User as Document Author
  participant Card as Comment Card (DOM)
  participant Webview as preview-webview.js
  participant Modal as In-Webview Confirmation Modal
  participant EarlyHook as earlyHook.js
  participant Actions as commentActions.ts
  participant OptStore as optimisticStore.ts
  participant Storage as gitRefBackend.ts

  User->>Card: Clicks "Delete" icon on comment/thread
  Card->>Card: event.stopPropagation() (blocks navigation/card click)
  Card->>Modal: showConfirmationModal({ title: "Delete Comment?", message: "..." })
  Modal->>User: Displays non-blocking, accessible in-situ modal overlay

  alt User Cancels
    User->>Modal: Clicks "Cancel" / Presses Escape
    Modal->>Card: Close modal, restore focus to card
  else User Confirms
    User->>Modal: Clicks "Confirm Delete"
    Modal->>EarlyHook: dispatchAction('deleteComment', { threadId, commentId })
    EarlyHook->>Actions: postMessage({ command: 'deleteComment', payload: {...} })

    Actions->>OptStore: stageTombstone(threadId, commentId)
    OptStore-->>Actions: Optimistic state updated (marked as tombstone)

    Actions->>Webview: postMessage({ type: 'removeThread', threadId })
    Webview->>Card: Animate collapse & remove card from DOM in-place
    Webview->>Webview: Decrement anchor badge counter (guarded by equality)

    Actions->>Storage: deleteThread(threadId) (async background)
    Storage-->>Actions: Committed tombstone to refs/md-comments/data
  end
```

---

## Sequence 6: Markdown Mutation & Fuzzy Re-Anchoring Cascade

When the user modifies a Markdown file, existing comments must re-bind to shifted line numbers without failing or losing context.

```mermaid
sequenceDiagram
  autonumber
  participant Editor as VS Code / Browser Editor
  participant ReAnchor as @md-comments/shared (fuzzyReAnchor)
  participant Exact as Exact Match Step
  participant Norm as Normalized Match Step
  participant Fuzzy as Levenshtein Search Step
  participant Store as commentStore

  Editor->>ReAnchor: onDocumentChanged(filePath, newDocumentContent, existingThreads)

  loop For each Thread in File
    ReAnchor->>Exact: Check lines [startLine, endLine] for contentHash match
    alt Hash Matches
      Exact-->>ReAnchor: Exact anchor valid (lines unchanged)
    else Hash Mismatches
      ReAnchor->>Norm: Scan document for exact text ignoring whitespace
      alt Normalized Match Found
        Norm-->>ReAnchor: Re-anchor to [newStartLine, newEndLine]
      else Normalized Match Fails
        ReAnchor->>Fuzzy: Execute context-aware Levenshtein search using contextBefore & contextAfter
        alt Similarity Score >= 0.85
          Fuzzy-->>ReAnchor: Best match found at [fuzzyStart, fuzzyEnd]
        else Similarity Score < 0.85
          Fuzzy-->>ReAnchor: Mark thread as "Orphaned" (Prompt author to re-attach)
        end
      end
    end
  end

  ReAnchor->>Store: updateThreadAnchors(updatedThreads)
  Store->>Editor: Update visual gutter markers & preview badges
```

---

## Sequence 7: Author Identity Resolution & Display Name Formatting

Ensures that comment authors are clearly identified using Git configuration identities and enriched with GitHub avatars and user profiles.

```mermaid
sequenceDiagram
  autonumber
  participant Ext as VS Code Extension Activation
  participant Resolver as authorResolver.ts
  participant GitAPI as vscode.git (Git Extension API)
  participant Cache as Memory LRU Cache
  participant GitHub as GitHub Users API

  Ext->>Resolver: resolveCurrentAuthor()

  Resolver->>GitAPI: Inspect repository configuration
  GitAPI-->>Resolver: { 'user.name': 'Jane Doe', 'user.email': 'jane@example.com' }

  Resolver->>Cache: Lookup author for 'jane@example.com'
  alt Cache Hit
    Cache-->>Resolver: Cached Author Profile { name, login, avatarUrl }
  else Cache Miss
    Resolver->>GitHub: GET /user (using active auth token)
    alt GitHub Profile Available
      GitHub-->>Resolver: { login: 'janedoe', name: 'Jane Doe', avatar_url: '...' }
      Resolver->>Cache: Set 'jane@example.com' -> Profile
    else Offline / Unauthenticated
      Resolver->>Resolver: Format fallback identity using Git config name
    end
  end

  Resolver-->>Ext: Return Formatted Author { displayName: "Jane Doe (@janedoe)", avatarUrl }
```

---

## Sequence 8: Privacy-Preserving Telemetry Event Pipeline

Enforces the telemetry invariants (`INV-ZERO-CLIENT-SECRETS`, `INV-ZERO-CUSTOMER-DATA`, `INV-TELEMETRY-KILLSWITCH`).

```mermaid
sequenceDiagram
  autonumber
  participant Client as Extension / Plugin Client
  participant Scrubber as Telemetry Scrubber (sanitizer.ts)
  participant Config as Workspace Configuration
  participant Proxy as Telemetry Proxy (infrastructure/)
  participant OTel as OpenTelemetry Ingestion Collector

  Client->>Config: Check `telemetry.enabled`
  alt Telemetry Disabled (INV-TELEMETRY-KILLSWITCH)
    Config-->>Client: false
    Client->>Client: Drop event immediately
  else Telemetry Enabled
    Config-->>Client: true
    Client->>Scrubber: scrubEvent(rawEvent)

    Note over Scrubber: INV-ZERO-CUSTOMER-DATA:<br/>1. Strip markdown content & bodies<br/>2. Strip file paths & repo URLs<br/>3. Hash author usernames<br/>4. Sanitize error stack traces

    Scrubber-->>Client: Sanitized Event Payload { event: 'comment_created', durationMs: 42 }

    Client->>Proxy: POST /v1/telemetry (INV-ZERO-CLIENT-SECRETS: No embedded API keys)
    Proxy->>Proxy: Re-verify payload structure & rate limit
    Proxy->>OTel: Forward OTLP Protobuf / JSON spans
  end
```