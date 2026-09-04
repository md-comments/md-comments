# Tagging People in Comments and Multi-Channel Notifications Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## 1. Overview & Objectives

### Problem Definition

When collaborating on markdown documentation, users frequently mention teammates using `@username` to request reviews, ask questions, or assign action items. Currently:

1. There is no active autocomplete assistance for team member handles when typing `@`.
2. Tagging a user in a comment does not dispatch an alert or notification to the channels teams use daily (Slack, Microsoft Teams, Email, or internal webhooks).

### Goals

- **Interactive Mentions & Tagging UI**: Provide `@` mention autocompletion and highlighting across all `md-comments` frontends (Chrome Extension, VS Code Extension, Embed).
- **Multi-Channel Notification Dispatcher**: Support Slack (Block Kit), Microsoft Teams (Adaptive Cards), Email (Resend / SMTP), and Generic Webhooks.
- **Secure Architecture**: Provide a GitHub Action / CLI dispatcher to process Git note changes and send alerts without leaking webhook secrets to client browsers.
- **Identity & Directory Mapping**: Allow mapping GitHub handles to Slack user IDs, Teams accounts, or email addresses via a repo configuration file (`.md-comments.json`).
- **Deep-linking**: Provide direct links in notifications to jump straight to the relevant file anchor in GitHub and VS Code (`vscode://...`).

---

## 2. Current State vs. Proposed Architecture

### Current State

- `shared/author.ts` contains regex helper `extractMentionLogins()` that can extract `@username` handles from raw markdown comment text.
- Comments are persisted locally or synced via Git notes / repository files.
- No external notification triggers or autocomplete popovers exist in the comment editors.

### Proposed Architecture

```mermaid
flowchart TD
    subgraph UI ["1. Frontend Clients (VS Code, Chrome Ext, Embed)"]
        INPUT["Comment / Reply Input Box"]
        AUTO["@mention Autocomplete Dropdown"]
        INPUT -->|User types '@'| AUTO
        AUTO -->|Query Collaborators| COLLAB["Collaborator Source\n(GitHub API / Config)"]
        INPUT -->|Save Comment| SYNC["Git Notes / Storage Sync"]
    end

    subgraph Trigger ["2. Event Dispatch Layer"]
        SYNC -->|Push Commit / Notes| GHA["GitHub Action / CLI Tool\n(md-comments notify)"]
        SYNC -.->|Direct Client Mode (Optional)| CLIENT_DISPATCH["Client Webhook Dispatcher"]
    end

    subgraph Notifier ["3. Notification Engine (@md-comments/notifier)"]
        GHA --> ENGINE["Notification Engine"]
        CLIENT_DISPATCH -.-> ENGINE
        ENGINE --> CONFIG["Repo Config Resolver\n(.md-comments.json)"]
        CONFIG --> SLACK["Slack BlockKit Adapter"]
        CONFIG --> TEAMS["Teams Adaptive Card Adapter"]
        CONFIG --> EMAIL["Email Adapter (Resend / SMTP)"]
        CONFIG --> WEBHOOK["Generic Webhook Adapter"]
    end

    subgraph Targets ["4. Notification Delivery"]
        SLACK --> CH_S["Slack Channels / DMs"]
        TEAMS --> CH_T["MS Teams Webhooks"]
        EMAIL --> CH_E["Recipient Inboxes"]
        WEBHOOK --> CH_W["External Services"]
    end
```

---

## 3. Detailed Component Design

### 3.1 Mention Autocomplete Subsystem (`shared/mentions.ts` & UI frontends)

1. **Trigger Detection**: When user inputs `@` preceded by whitespace or at start of line, activate autocomplete dropdown.
2. **Directory Provider**:
   - **GitHub Context**: Queries GitHub repo collaborators (`/repos/{owner}/{repo}/collaborators`) and assignees.
   - **Local Config**: Reads team directory definitions in `.md-comments.json`.
3. **Keyboard & Selection Support**: Up/Down arrow selection, Tab / Enter to insert `@handle `, Escape to dismiss.
4. **Mention Parsing & Diffing**:
   - Extract mentions using regex `/@[a-zA-Z0-9_-]+/g`.
   - On edit, compare previous comment mentions with updated mentions so notifications only fire for newly tagged participants.

### 3.2 Notification Core Engine (`shared/notifications/`)

1. **Event Model**:
   - Standardized `CommentNotificationEvent` containing repo, file path, anchor snippet, heading context, author info, comment body, and tagged user list.
2. **Channel Adapters**:
   - **Slack Adapter**: Builds Slack Block Kit payload with author avatar, markdown quote of the commented text, comment body with Slack mentions (`<@U12345>`), and action buttons ("View in GitHub", "Open in VS Code").
   - **Microsoft Teams Adapter**: Builds MS Teams Adaptive Card (v1.5) with rich formatting and deep links.
   - **Email Adapter**: Generates clean HTML email with CSS styles and plain text fallback.
   - **Custom Webhook Adapter**: Sends signed HTTP POST JSON payload for custom integrations (Discord, Zapier, PagerDuty).

### 3.3 Identity & Directory Mapping (`.md-comments.json`)

Allows mapping GitHub handles to company directory identities:

```json
{
  "$schema": "https://md-comments.org/schema/config.v1.json",
  "team": [
    {
      "username": "mona",
      "displayName": "Mona Lisa",
      "slackId": "U01234567",
      "teamsEmail": "mona@example.com",
      "email": "mona@example.com"
    }
  ],
  "notifications": {
    "slack": {
      "webhookUrlEnv": "SLACK_WEBHOOK_URL",
      "defaultChannel": "#docs-reviews",
      "notifyMentions": true
    },
    "teams": {
      "webhookUrlEnv": "TEAMS_WEBHOOK_URL"
    },
    "email": {
      "provider": "resend",
      "apiKeyEnv": "RESEND_API_KEY",
      "from": "comments@docs.example.com"
    }
  }
}
```

### 3.4 GitHub Action & CLI Dispatcher

1. **Action Workflow**: Runs on push events to `refs/notes/md-comments` or doc branches.
2. **Diff Analyzer**: Computes diff between `BEFORE` and `AFTER` commits in Git notes to extract newly added comments/replies.
3. **Dispatcher Execution**: Executes notification adapters using secrets defined in GitHub Actions secrets (never exposed to client browser).

---

## 4. Milestones & Action Items

### Milestone 1: Mention Autocomplete Engine & UI Integration

- [ ] Implement `shared/mentions.ts` (cursor parser, mention token extraction, team directory interfaces).
- [ ] Implement mention autocomplete popover in `chrome-extension/src/content.ts`.
- [ ] Implement mention autocomplete popover in `vscode-extension/src/markdownItPlugin.ts`.
- [ ] Add unit tests for mention parsing, filtering, and insertion.

### Milestone 2: Multi-Channel Notification Adapters

- [ ] Define `CommentNotificationEvent` and adapter interface in `shared/notifications/`.
- [ ] Implement Slack Block Kit adapter (`slack.ts`).
- [ ] Implement Microsoft Teams Adaptive Card adapter (`teams.ts`).
- [ ] Implement Email adapter with Resend / SMTP support (`email.ts`).
- [ ] Implement Generic Webhook adapter (`webhook.ts`).
- [ ] Add unit tests for payload formatting across all adapters.

### Milestone 3: Repository Configuration & Directory Resolution

- [ ] Define JSON schema for `.md-comments.json`.
- [ ] Implement config parser and user identity resolver.
- [ ] Add tests for directory fallback (e.g. unmapped GitHub user fallback to plain handle).

### Milestone 4: CI/CD GitHub Action & CLI Runner

- [ ] Create CLI runner `md-comments notify --diff-notes`.
- [ ] Package GitHub Action in `action/action.yml`.
- [ ] Support dry-run and test notification triggers.

### Milestone 5: Direct Client Webhook Support & End-to-End Verification

- [ ] Add optional local extension settings for direct Slack/Teams webhook posting.
- [ ] Comprehensive test suite and integration tests with mocked webhooks.
- [ ] Update documentation and user guide.

---

## 5. Verification Criteria

1. **Autocomplete**: Typing `@` in any comment editor displays matching team members and cleanly inserts `@username`.
2. **Mention Filtering**: Editing a comment does not re-notify users who were already tagged previously.
3. **Payload Correctness**: Slack, Teams, and Email test payloads match respective platform specifications.
4. **Action Execution**: GitHub Action successfully runs on note changes, detects new comments with `@mentions`, and dispatches formatted cards to configured destinations.
