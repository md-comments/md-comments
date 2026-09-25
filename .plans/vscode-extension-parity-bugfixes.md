# VS Code Extension Quality & GitHub Extension Alignment Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

During manual validation against the Markdown Comments pilot checklist (`.temp/chrome.md`), 10 concrete issues were discovered in the VS Code extension webview, markdown-it renderer, anchor highlighting engine, and interaction flows.

This plan addresses all 10 issues systematically, restoring functional reliability, optimistic responsiveness, and visual parity with the GitHub extension (`chrome-extension/`).

To maintain strict traceability, test isolation, and effortless bisectability, **each change is implemented and verified as a separate, atomic commit** with its corresponding unit/integration test co-evolution.

### Identified Issues & Target Solutions

| #      | Issue Description                                                                                                                                                                                                                | Location                                                                                                                       | Root Cause                                                                                                                                                                                                                                                                           | Target Solution                                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **Page comment indicator redundant**<br>Redundant "Page comment" badge shown on document comments; GitHub extension doesn't have it.                                                                                             | `markdownItPlugin.ts`, `preview-webview.js`, `preview.js`                                                                      | `pageLabel` badge `<span class="md-comments-badge md-comments-type-label">Page comment</span>` rendered unconditionally on page cards.                                                                                                                                               | Remove `pageLabel` badge from card rendering in `markdownItPlugin.ts` and `preview-webview.js`. Document comments already reside exclusively under the "Document" tab.                                                      |
| **2**  | **Triple-click not showing comment bubble**<br>Triple-clicking paragraph (e.g., in QA-INLINE-1) fails to open the selection chip / bubble; only manual drag selection works.                                                     | `preview-webview.js:1020` (`handleTextSelection`)                                                                              | On triple-click, `range.commonAncestorContainer` expands to the parent container (`div.markdown-body` or `body`), causing `findParagraphFromNode()` to return `null`.                                                                                                                | Align with `chrome-extension/src/content.ts` (lines 5452–5470): when `commonAncestorContainer` fails, resolve `startNode` (`range.startContainer`), verify `startMatch`, and ensure boundary matches the paragraph element. |
| **3**  | **Long timestamps & missing hover tooltip (All Interfaces)**<br>Timestamps formatted as long locale strings ("9/24/2026, 7:12 PM") instead of "just now", "2d ago"; interfaces lack a hover tooltip with the concrete date/time. | All interfaces (`vscode-extension`, `chrome-extension`, `safari-extension`, `obsidian-plugin`, `starlight-plugin`, demo/embed) | Inconsistent formatting: VS Code & Obsidian call `toLocaleString()` for text display; Chrome, Safari, Starlight, and Demo embeds lack `title="..."` hover tooltips on `.md-comments-time` and `.tooltip-time`.                                                                       | Create canonical `shared/time.ts` with `formatRelativeTime(iso)` and `formatConcreteTime(iso)`. Output short relative format with `title="${formatConcreteTime(created_at)}"` consistently across ALL interfaces.           |
| **4**  | **QA-INLINE-3 duplicate phrase second occurrence underscored first**<br>Commenting on the 2nd occurrence of duplicate token underscores the 1st occurrence instead.                                                              | `markdownItPlugin.ts`, `inlineAnchors.js:205` (`findNeedleRange`), `wireCommentHighlight`                                      | Card DOM lacks `data-md-anchor-occurrence` attribute; `inlineAnchors.js` ignores occurrence index and performs `raw.indexOf(needle)`, always hitting occurrence 0.                                                                                                                   | Render `data-md-anchor-occurrence="${inlineMeta.occurrence ?? 0}"` on cards. Upgrade `findNeedleRange` in `inlineAnchors.js` to search for the N-th occurrence (0-indexed).                                                 |
| **5**  | **QA-INLINE-4 list item neither underscored nor scrolled to on click**<br>Commenting on list item does not highlight the list item, and clicking the comment card does not scroll to it.                                         | `markdownItPlugin.ts:930`                                                                                                      | `markdownItPlugin.ts` overrides `paragraph_open`, `heading_open`, and `tr_open`, but NOT `list_item_open` or `blockquote_open`. Tight list items render as `<li>` without `data-md-paragraph-index`.                                                                                 | Hook `list_item_open` and `blockquote_open` in `markdownItPlugin.ts` to attach `data-md-paragraph-index`, `data-md-anchor-hash`, `data-md-anchor-text`, and `data-md-heading` from `renderCtx.blocks`.                      |
| **6**  | **Slow timestamp & underscore appearance after saving**<br>Highlight and timestamp only update after backend save completes and preview completely reloads.                                                                      | `preview-webview.js:280` (`insertOptimisticCard`)                                                                              | `insertOptimisticCard` omits `data-md-paragraph-index`, `data-md-anchor-text`, and `data-md-anchor-occurrence` from the created card and fails to invoke `wireCommentHighlight(card)` or `wrapAnchorText` for selection anchors.                                                     | Set full anchor attributes on the optimistic card immediately upon submission and trigger `wireCommentHighlight(card)` directly. Render optimistic short relative timestamp with concrete title.                            |
| **7**  | **Mention retains '@' before display full name**<br>Mentioning a user with a display name renders `@Marat Strelets` instead of `Marat Strelets`.                                                                                 | `shared/mentions.ts:39`                                                                                                        | `formatCommentBodyWithMentions` prefixes `@` even when a display full name exists: `@${displayName!.trim()}`.                                                                                                                                                                        | Change to `${displayName!.trim()}` when display name is present. Retain `@${login}` when only username is available, and keep `title="@${escapeHtml(login)}"` for hover inspection.                                         |
| **8**  | **Redundant reply button in inline card actions**<br>Inline comments show a Reply button in header actions even though the reply box is directly below the card.                                                                 | `markdownItPlugin.ts:349`, `preview-webview.js:187`                                                                            | Header actions include `actionIconBtn('reply', 'Reply', ICON_REPLY, ...)` for inline root cards. In `chrome-extension`, this button does not exist.                                                                                                                                  | Remove the `reply` button from root card header actions in `markdownItPlugin.ts` and `preview-webview.js`. The reply composer below the card remains the sole, clear entry point.                                           |
| **9**  | **Clicking existing emoji bumps count to 2 then removes**<br>Clicking an existing own emoji reaction chip increments from 1 to 2 before disappearing after server sync.                                                          | `markdownItPlugin.ts:254`, `preview-webview.js:487`, `commentStore.ts:409`                                                     | `toggleReactionOptimistic` checks `classList.contains('md-comments-reaction-active')`. If active class was missing due to author/display name mismatch, it branches to add reaction (`+1`). Server-side `applyReactionToggle` uses strict `indexOf(user)` instead of `authorsMatch`. | Add `data-md-users` and `data-md-is-mine` to reaction chips. Update `toggleReactionOptimistic` to inspect `data-md-is-mine` and author matching. Update `commentStore.ts` to use `authorsMatch` in `applyReactionToggle`.   |
| **10** | **Hovering yellow highlight on QA-INLINE-2 shows nothing**<br>Hovering highlighted text in preview does not display speech bubble tooltip.                                                                                       | `inlineAnchors.js:59`, `preview.css`                                                                                           | VS Code extension has no tooltip DOM implementation or CSS styling on anchor hover (unlike GitHub extension's `showCommentTooltip` and `.md-comments-tooltip`).                                                                                                                      | Port `.md-comments-tooltip` speech bubble styling to `vscode-extension/media/preview.css` and implement `showCommentTooltip` / `hideCommentTooltip` in `inlineAnchors.js`.                                                  |

---

## Current State vs. Proposed Architecture

### 1. Document Comment Badging (`pageLabel`)

#### Current State

In `vscode-extension/src/markdownItPlugin.ts` (lines 335–338):

```ts
const pageLabel =
  type === 'page'
    ? '<span class="md-comments-badge md-comments-type-label">Page comment</span>'
    : '';
```

This is injected into `<div class="md-comments-meta">${pageLabel}...</div>`. In `preview-webview.js` (line 265) and `preview.js` (line 331), optimistic cards similarly inject this label. In `chrome-extension/src/content.ts`, document comments under the Document tab never display a "Page comment" badge.

#### Proposed Change

Remove `pageLabel` rendering across `markdownItPlugin.ts`, `preview-webview.js`, and `preview.js`. Update tests expecting `.md-comments-type-label` (e.g., `tests/badge-styling-parity.test.ts`).

---

### 2. Triple-Click Paragraph Detection (`handleTextSelection`)

#### Current State

In `vscode-extension/media/preview-webview.js` (lines 1029–1033):

```js
const range = sel.getRangeAt(0);
const p = findParagraphFromNode(range.commonAncestorContainer);
if (!p) {
  return;
}
```

When triple-clicking, WebKit/Blink selects the entire paragraph block, expanding the `commonAncestorContainer` to `.markdown-body` or `<div class="md-comments-document">`. `findParagraphFromNode(container)` fails because the container is not a block element matching `BLOCK_SELECTOR`.

#### Proposed Change

Adopt the boundary detection algorithm from `chrome-extension/src/content.ts:5452-5470`:

```js
let p = findParagraphFromNode(range.commonAncestorContainer);
if (!p) {
  let startNode = range.startContainer;
  if (startNode.nodeType === Node.ELEMENT_NODE && range.startOffset < startNode.childNodes.length) {
    startNode = startNode.childNodes[range.startOffset];
  }
  const startMatch = findParagraphFromNode(startNode);
  if (startMatch) {
    const endMatch = findParagraphFromNode(range.endContainer);
    if (!endMatch || endMatch === startMatch || range.endOffset === 0) {
      p = startMatch;
    }
  }
}
```

---

### 3. Timestamp Formatting & Hover Tooltips (Across ALL Interfaces)

#### Current State

- `vscode-extension`: Renders `new Date(iso).toLocaleString()` (e.g., `"9/24/2026, 7:12:43 PM"`), which is verbose and inconsistent with the browser extension. No `title` attribute is present.
- `chrome-extension`: Renders `formatRelativeTime(dateStr)` (e.g., `"just now"`, `"2d ago"`), but lacks a `title` attribute on `<span class="md-comments-time">` and `.tooltip-time`.
- `obsidian-plugin`: Calls `new Date(iso).toLocaleString()` on root comments and replies without `title` attributes.
- `starlight-plugin`: Calls `formatRelativeTime(comment.created_at)` without `title` hover tooltips on timestamps.
- `website/demo-mock/` & `website/demo-html/`: Calls `formatRelativeTime(comment.created_at)` without `title` attributes in `embed/md-comments.js`.

#### Proposed Change

1. Create canonical time module in `shared/time.ts`:
   ```ts
   export function formatRelativeTime(dateStr: string): string {
     const date = new Date(dateStr);
     const diff = Date.now() - date.getTime();
     const seconds = Math.floor(diff / 1000);
     const minutes = Math.floor(seconds / 60);
     const hours = Math.floor(minutes / 60);
     const days = Math.floor(hours / 24);

     if (days > 7) {
       return date.toLocaleDateString();
     }
     if (days > 0) {
       return `${days}d ago`;
     }
     if (hours > 0) {
       return `${hours}h ago`;
     }
     if (minutes > 0) {
       return `${minutes}m ago`;
     }
     return 'just now';
   }

   export function formatConcreteTime(dateStr: string): string {
     try {
       return new Date(dateStr).toLocaleString();
     } catch {
       return dateStr;
     }
   }
   ```
2. Implement across **ALL** interfaces:
   - **VS Code Extension** (`vscode-extension/src/markdownItPlugin.ts`, `media/preview-webview.js`, `media/preview.js`):
     Render `<span class="md-comments-time" title="${formatConcreteTime(created_at)}">${formatRelativeTime(created_at)}${editedText}</span>`.
   - **GitHub Browser Extension** (`chrome-extension/src/content.ts`):
     Add `title="${formatConcreteTime(comment.created_at)}"` to `<span class="md-comments-time">` on root cards and replies, as well as `<span class="tooltip-time" title="${formatConcreteTime(comment.created_at)}">`.
   - **Obsidian Plugin** (`obsidian-plugin/src/sidebarView.ts`):
     Use `formatRelativeTime` for display text and `formatConcreteTime` for `title` on `.md-comments-time` and `.md-comments-resolved-summary-time`.
   - **Starlight Plugin** (`starlight-plugin/src/client/components/CommentsOverlay.ts`):
     Add `title="${formatConcreteTime(comment.created_at)}"` to `.md-comments-time` and `.tooltip-time`.
   - **Embed & Demo Sites** (`website/demo-mock/embed/md-comments.js`, `website/demo-html/embed/md-comments.js`):
     Add `title="${formatConcreteTime(comment.created_at)}"` to `.md-comments-time` and `.tooltip-time`.

---

### 4. Duplicate Phrase Occurrence Anchoring (QA-INLINE-3)

#### Current State

- `shared/anchor.ts`: Correctly calculates `occurrence` (0-based) via `findOccurrenceIndex()`.
- `vscode-extension/src/commentStore.ts`: Persists `anchor_occurrence`.
- `vscode-extension/src/markdownItPlugin.ts`: `inlineMeta` parameter omits `occurrence`, so `data-md-anchor-occurrence` is never written to `.md-comments-card`.
- `vscode-extension/media/inlineAnchors.js`: `findNeedleRange(raw, needle)` uses `raw.indexOf(needle)` without occurrence offset, always selecting the 1st match.

#### Proposed Change

1. In `markdownItPlugin.ts`, include `occurrence?: number` in `inlineMeta` and render `data-md-anchor-occurrence="${inlineMeta.occurrence ?? 0}"`.
2. In `preview-webview.js`, pass `occurrence` to optimistic cards and set `data-md-anchor-occurrence`.
3. In `inlineAnchors.js`:
   ```js
   function findNeedleRange(raw, needle, targetOccurrence = 0) {
     if (!needle || !raw) return null;
     const flexible = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
     const re = new RegExp(flexible, 'gi');
     let match;
     let curOccurrence = 0;
     while ((match = re.exec(raw)) !== null) {
       if (curOccurrence === targetOccurrence) {
         return { start: match.index, length: match[0].length };
       }
       curOccurrence++;
       if (match.index === re.lastIndex) re.lastIndex++;
     }
     // Fallback to occurrence 0 if target not reached
     ...
   }
   ```
4. In `wireCommentHighlight(card)`:
   ```js
   const occurrence = parseInt(card.getAttribute('data-md-anchor-occurrence') || '0', 10);
   wrapAnchorText(container, anchorText, commentId, occurrence);
   ```

---

### 5. Markdown-It List Item & Blockquote Open Rules (QA-INLINE-4)

#### Current State

In `vscode-extension/src/markdownItPlugin.ts`:
Renderer rules are attached to `paragraph_open`, `heading_open`, and `tr_open`. Tight list items render as `<li>` without wrapping `<p>`, so `attachBlockAttributes` is never executed for list items. The rendered DOM has no `data-md-paragraph-index`, preventing `inlineAnchors.js` from wrapping text and preventing card clicks from scrolling.

#### Proposed Change

Add `list_item_open` and `blockquote_open` renderer rules to `markdownItPlugin.ts`:

```ts
const defaultListItemOpen =
  md.renderer.rules.list_item_open ||
  function (tokens: any, idx: any, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.list_item_open = (
  tokens: any,
  idx: number,
  options: any,
  env: any,
  self: any
) => {
  if (renderCtx) {
    const token = tokens[idx];
    const nextToken = tokens[idx + 1];
    const content =
      nextToken?.type === 'inline'
        ? nextToken.content
        : tokens[idx + 2]?.type === 'inline'
          ? tokens[idx + 2].content
          : '';
    if (content) {
      const text = normalizeAnchorText(content);
      const hash = fnv1aHash(text);
      const block = findBlockForElement(renderCtx.blocks, hash, text);
      if (block) {
        attachBlockAttributes(token, block, renderCtx);
      }
    }
  }
  return defaultListItemOpen(tokens, idx, options, env, self);
};
```

---

### 6. Instant Optimistic Underscoring & Timestamp Responsiveness

#### Current State

In `preview-webview.js` (`insertOptimisticCard`):
Selection comments do not receive `data-md-paragraph-index`, `data-md-anchor-text`, or `data-md-anchor-occurrence`. Highlighting only executes for exact full-paragraph text matches. The underscore only appears seconds later after the backend git ref write completes and `markdown.preview.refresh` triggers a full DOM rebuild.

#### Proposed Change

1. In `insertOptimisticCard`:
   - Set `data-md-paragraph-index="${anchor.index}"`, `data-md-anchor-text="${escapeHtml(anchor.text)}"`, and `data-md-anchor-occurrence="${anchor.occurrence ?? 0}"` on the newly created `.md-comments-card`.
   - Call `window.mdCommentsScheduleWire()` or `wireCommentHighlight(card)` immediately.
   - The phrase is wrapped with `.md-comments-text-anchor` synchronously at 0ms.
2. Render short relative timestamp (`"just now"`) with `title="${new Date().toLocaleString()}"`.

---

### 7. Mention Display Name '@' Removal

#### Current State

In `shared/mentions.ts` (line 39):

```ts
const label = hasDisplayName ? `@${displayName!.trim()}` : `@${login}`;
```

When user has full name "Marat Strelets", output is `@Marat Strelets`.

#### Proposed Change

```ts
const label = hasDisplayName ? displayName!.trim() : `@${login}`;
```

Output becomes `Marat Strelets` (without `@`), while keeping `title="@${escapeHtml(login)}"` on the `<a>` tag so hovering displays the GitHub handle. Update test assertions in `tests/mentions.test.ts`.

---

### 8. Inline Reply Action Button Removal

#### Current State

Inline root cards render a Reply icon button in the card header actions (`resolvedActions` in `markdownItPlugin.ts:349`), duplicating the reply input field already visible at the card footer.

#### Proposed Change

Remove `actionIconBtn('reply', 'Reply', ...)` from root card header actions in `markdownItPlugin.ts`, `preview-webview.js`, and `preview.js`. The bottom reply input remains the sole, clear entry point.

---

### 9. Reaction Toggle Count & State Parity

#### Current State

- If `authorsMatch(u, renderCurrentAuthor)` returns `false` during render (e.g. login vs display name mismatch), the reaction chip renders without `md-comments-reaction-active`.
- Clicking the chip executes `toggleReactionOptimistic`: finding no active class, it increments count (`+1`).
- Backend receives `action: 'react'` and `applyReactionToggle` strips the user, so upon reload the chip disappears. User sees count jump to 2 before disappearing.
- Backend `applyReactionToggle` in `commentStore.ts` uses strict `indexOf(user)`, failing if case or name format diverges.

#### Proposed Change

1. In `markdownItPlugin.ts`:
   - Render `data-md-users="${escapeHtml(JSON.stringify(r.users))}"` and `data-md-is-mine="${isMine ? 'true' : 'false'}"` on each `.md-comments-reaction-chip`.
2. In `preview-webview.js` (`toggleReactionOptimistic`):
   - Check `existingChip.classList.contains('md-comments-reaction-active') || existingChip.getAttribute('data-md-is-mine') === 'true' || chipUsersContainCurrentAuthor(existingChip)`.
   - If true: remove active class, decrement count (or remove chip if 0).
   - If false: add active class, increment count.
3. In `vscode-extension/src/commentStore.ts` (`applyReactionToggle`):
   - Use `authorsMatch(u, user)` instead of strict `indexOf(user)`.

---

### 10. Yellow Highlight Hover Tooltip

#### Current State

In `vscode-extension`, hovering `.md-comments-text-anchor` or `.md-comments-paragraph-marked` only adds CSS active outline classes. No floating tooltip element is shown.

#### Proposed Change

1. Add `.md-comments-tooltip` speech bubble styles to `vscode-extension/media/preview.css` (matching `chrome-extension/src/sidebar.css`).
2. In `vscode-extension/media/inlineAnchors.js`, implement `showCommentTooltip(targetEl, commentId)` and `hideCommentTooltip()`:
   - On `mouseenter` of `.md-comments-text-anchor` or `.md-comments-paragraph-marked`, look up the card `.md-comments-card[data-md-comment-id="${commentId}"]`.
   - Extract author avatar, author name, timestamp, and body excerpt.
   - Position floating tooltip with speech arrow above/below the anchor.
   - Dismiss on `mouseleave` or scroll.

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### 1. New Tests to Create

- **`tests/vscode-triple-click-selection.test.ts`**:
  - Validates `handleTextSelection` boundary resolution when selection spans across paragraph boundaries or `commonAncestorContainer` is the root container.
- **`tests/vscode-list-item-anchors.test.ts`**:
  - Validates `markdownItPlugin.ts` attaching `data-md-paragraph-index` and block attributes to `<li>` list items and `<blockquote>`.
  - Verifies that clicking a list item card scrolls to the `<li>` element.
- **`tests/vscode-duplicate-occurrence.test.ts`**:
  - Validates `findNeedleRange` with occurrence index `0` vs `1` on identical phrases.
  - Verifies that `data-md-anchor-occurrence="1"` wraps the second match in the DOM.
- **`tests/vscode-tooltip-hover.test.ts`**:
  - Validates `showCommentTooltip` creating and positioning `.md-comments-tooltip` upon hovering `.md-comments-text-anchor`.
- **`tests/vscode-optimistic-inline.test.ts`**:
  - Validates that `insertOptimisticCard` attaches full anchor attributes and immediately invokes `wrapAnchorText` without waiting for save/refresh.
- **`tests/vscode-reaction-toggle.test.ts`**:
  - Validates clicking an existing own reaction decrements count to 0 and removes chip immediately, without bumping to 2.
- **`tests/shared-time-formatting.test.ts`**:
  - Unit tests for `formatRelativeTime` ("just now", "5m ago", "2h ago", "2d ago") and `formatConcreteTime`.

### 2. Existing Tests to Update (Prevent Behavioral Drift)

- **`tests/mentions.test.ts`**:
  - Update expected output for display name mentions: `@Marat Strelets` -> `Marat Strelets` with `title="@mstrelex"`.
- **`tests/badge-styling-parity.test.ts`**:
  - Remove expectation for `.md-comments-type-label` / `Page comment` badge on document comments.
- **`tests/vscode-document-comments.test.ts`**:
  - Align assertions with removed `Page comment` badge.
- **`tests/e2e/vscode-mentions.spec.ts`**:
  - Update E2E assertions for mention display text in comment body.

### 3. In-Code Knowledge Graph & Architectural Invariants

- **Nodes to Add / Update in `.agents/rules/` & Knowledge Graph**:
  - `FEAT-INLINE-ANCHOR-OCCURRENCE`: Precise multi-occurrence text selection and DOM wrapping.
  - `FEAT-LIST-ITEM-ANCHORING`: Full parity for Markdown lists and blockquotes in editor preview.
  - `FEAT-HOVER-TOOLTIP-PARITY`: Cross-surface hover speech bubble for inline highlights.
  - `INV-NO-PAT`: Re-enforce zero-PAT invariant across GitHub and VS Code extensions.
- **Coverage Strategy**:
  - Guarantee 100% statement and branch coverage across new routines in `shared/time.ts`, `shared/mentions.ts`, `inlineAnchors.js`, and `markdownItPlugin.ts`.

---

## Commit-by-Commit Execution Plan (1 Commit Per Change)

To ensure surgical precision, isolated diffs, and rapid bisectability, each of the 10 fixes will be developed, tested, verified, and committed individually following Conventional Commits format.

---

### Commit 1: Remove Redundant "Page Comment" Indicator (Issue #1)

- **Commit Message**: `fix(vscode-ext): remove redundant page comment indicator from document cards`
- **Scope & Files**:
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/preview-webview.js`
  - `vscode-extension/media/preview.js`
  - `tests/badge-styling-parity.test.ts`
  - `tests/vscode-document-comments.test.ts`
- **Action Items**:
  - [ ] Remove `pageLabel` (`.md-comments-type-label`) rendering from document comment cards in `markdownItPlugin.ts`.
  - [ ] Remove `pageLabel` generation in optimistic card creation in `preview-webview.js` and `preview.js`.
  - [ ] Update unit tests in `tests/badge-styling-parity.test.ts` and `tests/vscode-document-comments.test.ts` to assert that document cards omit the redundant type badge.
- **Verification Command**:
  ```bash
  pnpm test tests/badge-styling-parity.test.ts tests/vscode-document-comments.test.ts
  ```

---

### Commit 2: Remove Leading '@' from Mention Display Names (Issue #7)

- **Commit Message**: `fix(shared): omit leading at-symbol when mention has display name`
- **Scope & Files**:
  - `shared/mentions.ts`
  - `tests/mentions.test.ts`
  - `tests/e2e/vscode-mentions.spec.ts`
- **Action Items**:
  - [ ] Update `formatCommentBodyWithMentions` in `shared/mentions.ts` to render `${displayName.trim()}` instead of `@${displayName.trim()}` when a display name is present.
  - [ ] Preserve `@${login}` when only GitHub username is available, and retain `title="@${escapeHtml(login)}"`.
  - [ ] Update unit tests in `tests/mentions.test.ts` to verify full name formatting and handle tooltip preservation.
- **Verification Command**:
  ```bash
  pnpm test tests/mentions.test.ts
  ```

---

### Commit 3: Remove Redundant Reply Button in Inline Card Actions (Issue #8)

- **Commit Message**: `fix(vscode-ext): remove redundant reply button from inline card actions`
- **Scope & Files**:
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/preview-webview.js`
  - `vscode-extension/media/preview.js`
- **Action Items**:
  - [ ] Strip `actionIconBtn('reply', 'Reply', ICON_REPLY, ...)` from root card header actions in `markdownItPlugin.ts`.
  - [ ] Strip the reply icon button from optimistic root cards in `preview-webview.js` and `preview.js`.
  - [ ] Ensure the inline reply composer directly beneath the card remains the sole, clear entry point.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-inline-composer.test.ts tests/vscode-actions.test.ts
  ```

---

### Commit 4: Fix Triple-Click Paragraph Selection in Webview (Issue #2)

- **Commit Message**: `fix(vscode-ext): fix paragraph selection on triple-click in preview webview`
- **Scope & Files**:
  - `vscode-extension/media/preview-webview.js`
  - `tests/vscode-triple-click-selection.test.ts` (new)
- **Action Items**:
  - [ ] In `handleTextSelection` (`preview-webview.js`), implement the fallback boundary resolution algorithm from `chrome-extension/src/content.ts` (lines 5452–5470) when `range.commonAncestorContainer` expands to the parent container.
  - [ ] Inspect `range.startContainer`, resolve child element if offset provided, and verify `findParagraphFromNode(startNode)`.
  - [ ] Co-evolve new unit test `tests/vscode-triple-click-selection.test.ts` simulating DOM triple-click boundary conditions on paragraph elements.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-triple-click-selection.test.ts
  ```

---

### Commit 5: Standardize Relative Timestamps & Concrete Tooltips Across All Interfaces (Issue #3)

- **Commit Message**: `fix(shared): standardize relative timestamps and concrete date tooltips across all interfaces`
- **Scope & Files**:
  - `shared/time.ts` (new)
  - `shared/index.ts`
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/preview-webview.js`
  - `vscode-extension/media/preview.js`
  - `chrome-extension/src/content.ts`
  - `obsidian-plugin/src/sidebarView.ts`
  - `starlight-plugin/src/client/components/CommentsOverlay.ts`
  - `website/demo-mock/embed/md-comments.js`
  - `website/demo-html/embed/md-comments.js`
  - `tests/shared-time-formatting.test.ts` (new)
- **Action Items**:
  - [ ] Create `shared/time.ts` with `formatRelativeTime(iso)` and `formatConcreteTime(iso)`.
  - [ ] Export both helpers from `shared/index.ts`.
  - [ ] Update VS Code extension (`markdownItPlugin.ts`, `preview-webview.js`, `preview.js`) to display relative time with concrete tooltip `title`.
  - [ ] Update GitHub browser extension (`chrome-extension/src/content.ts`) to add `title="${formatConcreteTime(comment.created_at)}"` on `.md-comments-time` and `.tooltip-time`.
  - [ ] Update Obsidian plugin (`obsidian-plugin/src/sidebarView.ts`) to render relative time with concrete `title`.
  - [ ] Update Starlight plugin and Demo embeds to attach `title` tooltip attributes on all timestamps.
  - [ ] Co-evolve `tests/shared-time-formatting.test.ts` covering thresholds: `<60s` ("just now"), `<60m` ("5m ago"), `<24h` ("2h ago"), `<7d` ("2d ago"), and `>7d` locale date.
- **Verification Command**:
  ```bash
  pnpm test tests/shared-time-formatting.test.ts
  ```

---

### Commit 6: Support Duplicate Phrase Occurrence Anchoring (Issue #4)

- **Commit Message**: `fix(vscode-ext): support duplicate phrase occurrence anchoring for inline comments`
- **Scope & Files**:
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/inlineAnchors.js`
  - `vscode-extension/media/preview-webview.js`
  - `tests/vscode-duplicate-occurrence.test.ts` (new)
- **Action Items**:
  - [ ] Pass `occurrence?: number` in `inlineMeta` and render `data-md-anchor-occurrence="${inlineMeta.occurrence ?? 0}"` on `.md-comments-card`.
  - [ ] Upgrade `findNeedleRange(raw, needle, targetOccurrence)` in `inlineAnchors.js` to iterate matches and return the exact N-th occurrence.
  - [ ] Update `wireCommentHighlight` to read `data-md-anchor-occurrence` and pass it to `wrapAnchorText`.
  - [ ] Co-evolve `tests/vscode-duplicate-occurrence.test.ts` asserting that occurrence `0` highlights the first match and occurrence `1` highlights the second identical phrase.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-duplicate-occurrence.test.ts
  ```

---

### Commit 7: Attach Anchor Block Attributes to List Items & Blockquotes (Issue #5)

- **Commit Message**: `fix(vscode-ext): attach anchor block attributes to list items and blockquotes`
- **Scope & Files**:
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/inlineAnchors.js`
  - `tests/vscode-list-item-anchors.test.ts` (new)
- **Action Items**:
  - [ ] Implement `list_item_open` and `blockquote_open` renderer rules in `markdownItPlugin.ts`.
  - [ ] Extract inline content from subsequent tokens and resolve matching block from `renderCtx.blocks`.
  - [ ] Attach `data-md-paragraph-index`, `data-md-anchor-hash`, `data-md-anchor-text`, and `data-md-heading` to the generated `<li>` or `<blockquote>`.
  - [ ] Verify that clicking an inline comment targeting a list item scrolls smoothly to the `<li>` element.
  - [ ] Co-evolve `tests/vscode-list-item-anchors.test.ts` testing DOM token attribution on lists and blockquotes.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-list-item-anchors.test.ts
  ```

---

### Commit 8: Instant Optimistic Text Underscore & Timestamp Responsiveness (Issue #6)

- **Commit Message**: `fix(vscode-ext): render instant optimistic text highlight and timestamp upon comment submission`
- **Scope & Files**:
  - `vscode-extension/media/preview-webview.js`
  - `tests/vscode-optimistic-inline.test.ts` (new)
  - `tests/vscode-optimistic-actions.test.ts`
- **Action Items**:
  - [ ] In `insertOptimisticCard` (`preview-webview.js`), populate `data-md-paragraph-index`, `data-md-anchor-text`, and `data-md-anchor-occurrence` on the optimistic card DOM.
  - [ ] Immediately trigger `wireCommentHighlight(card)` or `wrapAnchorText` at 0ms so the yellow underline appears synchronously without waiting for git ref persistence or preview reload.
  - [ ] Render optimistic relative timestamp ("just now") with formatted `title` tooltip.
  - [ ] Co-evolve `tests/vscode-optimistic-inline.test.ts` verifying synchronous DOM wrap upon card insertion.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-optimistic-inline.test.ts tests/vscode-optimistic-actions.test.ts
  ```

---

### Commit 9: Fix Reaction Toggle Count Decrement & State Parity (Issue #9)

- **Commit Message**: `fix(vscode-ext): fix reaction toggle count decrement and state parity for own emoji`
- **Scope & Files**:
  - `vscode-extension/src/markdownItPlugin.ts`
  - `vscode-extension/media/preview-webview.js`
  - `vscode-extension/src/commentStore.ts`
  - `tests/vscode-reaction-toggle.test.ts` (new)
- **Action Items**:
  - [ ] Render `data-md-users="${escapeHtml(JSON.stringify(r.users))}"` and `data-md-is-mine="${isMine ? 'true' : 'false'}"` on `.md-comments-reaction-chip` in `markdownItPlugin.ts`.
  - [ ] Update `toggleReactionOptimistic` in `preview-webview.js` to inspect `data-md-is-mine` and author matching; when clicking an existing own reaction, decrement count and remove chip immediately if count hits 0.
  - [ ] In `commentStore.ts` (`applyReactionToggle`), use `authorsMatch` instead of strict `indexOf` to ensure consistent author identification.
  - [ ] Co-evolve `tests/vscode-reaction-toggle.test.ts` verifying decrement-to-zero behavior and chip removal.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-reaction-toggle.test.ts
  ```

---

### Commit 10: Speech Bubble Tooltip on Hovering Highlight (Issue #10)

- **Commit Message**: `feat(vscode-ext): display speech bubble tooltip when hovering inline highlight`
- **Scope & Files**:
  - `vscode-extension/media/preview.css`
  - `vscode-extension/media/inlineAnchors.js`
  - `tests/vscode-tooltip-hover.test.ts` (new)
- **Action Items**:
  - [ ] Port `.md-comments-tooltip` speech bubble styles and positioning into `vscode-extension/media/preview.css`.
  - [ ] Implement `showCommentTooltip(targetEl, commentId)` and `hideCommentTooltip()` in `inlineAnchors.js`.
  - [ ] Bind `mouseenter` / `mouseleave` on `.md-comments-text-anchor` and `.md-comments-paragraph-marked` to show/hide the floating preview bubble with avatar, author, relative time, and comment snippet.
  - [ ] Co-evolve `tests/vscode-tooltip-hover.test.ts` verifying tooltip DOM insertion, content extraction, and dismiss events.
- **Verification Command**:
  ```bash
  pnpm test tests/vscode-tooltip-hover.test.ts
  ```

---

### Commit 11: Final Quality Assurance, Pre-commit Checks & Knowledge Graph Sync

- **Commit Message**: `chore: update knowledge graph and run full pre-commit verification`
- **Scope & Files**:
  - `graphify-out/` (AST knowledge graph update)
  - Full codebase pre-commit verification
- **Action Items**:
  - [ ] Run full test suite: `pnpm test`.
  - [ ] Run TypeScript typecheck: `pnpm typecheck`.
  - [ ] Run lint and format checks: `pnpm run lint && pnpm run format`.
  - [ ] Run AST knowledge graph sync: `graphify update .`.
  - [ ] Verify checklist items QA-PAGE-1, QA-INLINE-1, QA-INLINE-2, QA-INLINE-3, QA-INLINE-4, R1-R3, H1-H3.
- **Verification Command**:
  ```bash
  pnpm test && pnpm typecheck && pnpm run lint
  ```

---

## Mandatory Authentication Invariant (Zero PAT for GitHub Extension)

- **`INV-NO-PAT` Strict Prohibition**: Under no circumstances shall PAT authentication be introduced, proposed, or permitted. All GitHub interactions remain authenticated strictly via OAuth Device Flow or native host tokens.
