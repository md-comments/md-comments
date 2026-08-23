/* eslint-disable security/detect-non-literal-fs-filename */
import * as fs from 'fs';
import * as vscode from 'vscode';
import { extractMentionLogins, getCachedAuthor, githubProfileUrl, isGitHubLogin } from './author';
import { collectAvatarLogins, getAvatarDataUrl, warmGitHubAvatars } from './githubAvatars';
import {
  authorDisplayLabel,
  authorsMatch,
  collectGitHubLogins,
  displayNamesMapForLogins,
  resolveAuthorLogin,
  schedulePreviewRefreshAfterDisplayNames,
  warmGitHubDisplayNames,
} from './githubDisplayNames';
import { parseMarkdownAnchors, fnv1aHash, normalizeAnchorText } from '../../shared/anchor';
import { placeInlineComments, isOrphanedPlacement, fuzzyMatch } from '../../shared/placement';
import type { CommentsFile, PlacementResult } from '../../shared/types';
import { escapeHtml } from '../../shared/html';
import { readComments } from './commentStore';
import { globalOptimisticStore } from './optimisticStore';
import { resolveStorageKeyForUriSync } from './repoManager';
import { logDebug } from './logger';
import { hasTokenSync } from './githubAuth';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatCommentTime(created_at: string, updated_at?: string): string {
  const base = formatTime(created_at);
  if (!updated_at) {
    return base;
  }
  try {
    if (new Date(updated_at).getTime() <= new Date(created_at).getTime()) {
      return base;
    }
  } catch {
    return base;
  }
  return `${base} · edited`;
}

/** Set during markdown-it render from env.currentAuthor. */
let renderCurrentAuthor: string | undefined;

function canEditComment(author: string): boolean {
  return !!renderCurrentAuthor && authorsMatch(author, renderCurrentAuthor);
}

function renderEditBtn(
  author: string,
  id: string,
  rootId: string,
  type: string,
  kind: 'root' | 'reply'
): string {
  const canEdit = canEditComment(author);
  const hiddenAttr = canEdit ? '' : ' hidden';
  return `<button type="button" class="md-comments-icon-btn md-comments-edit-btn"${hiddenAttr} data-md-action="edit" title="Edit comment" aria-label="Edit comment" data-md-id="${escapeHtml(id)}" data-md-root-id="${escapeHtml(rootId)}" data-md-type="${escapeHtml(type)}" data-md-kind="${escapeHtml(kind)}">${ICON_EDIT}</button>`;
}

const ICON_REPLY =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 17H5l-4-4 4-4h4M5 13h11.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-3.5-3.5H5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_RESOLVE =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l3.5 3.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_REOPEN =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.5M20 12a8 8 0 0 1-13.5 5.5M16 6.5V10h-3.5M8 17.5V14H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_REACT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.25 10.25h.01M14.75 10.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.25 14.25c.85 1.15 2 1.75 2.75 1.75s1.9-.6 2.75-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON_DELETE =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_EDIT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PARAGRAPH_COMMENT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9.5L6.5 17.5V6a1.5 1.5 0 0 1 1.5-1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 8h7.5M8.5 10.5h7.5M8.5 13h4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
const ICON_COLLAPSE_REPLIES =
  '<svg class="md-comments-icon-svg md-comments-icon-collapse" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 15l4-4 4 4M8 9l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_REANCHOR =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function actionIconBtn(
  action: string,
  title: string,
  icon: string,
  attrs: Record<string, string>,
  extraClass = ''
): string {
  const dataAttrs = Object.entries(attrs)
    .map(([k, v]) => {
      const attr = k === 'id' ? 'data-md-id' : `data-md-${k}`;
      return ` ${attr}="${escapeHtml(v)}"`;
    })
    .join('');
  return `<button type="button" class="md-comments-icon-btn${extraClass ? ` ${extraClass}` : ''}" data-md-action="${escapeHtml(action)}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"${dataAttrs}>${icon}</button>`;
}

function renderAuthorLink(author: string): string {
  const login = author.trim();
  const label = authorDisplayLabel(login);
  if (isGitHubLogin(login)) {
    const href = githubProfileUrl(login);
    const title = label !== login ? `@${login}` : '';
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href)}" class="md-comments-author-link"${titleAttr} target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  }
  return `<span class="md-comments-author">${escapeHtml(label)}</span>`;
}

function renderCommentBody(body: string): string {
  const escaped = escapeHtml(body);
  return escaped.replace(/@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}))/g, (match, login: string) => {
    if (!isGitHubLogin(login)) {
      return match;
    }
    const href = githubProfileUrl(login);
    return `<a href="${escapeHtml(href)}" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@${escapeHtml(login)}</a>`;
  });
}

function collectMentionCandidates(comments: CommentsFile): string[] {
  const logins = new Set<string>();
  const add = (author: string, body: string) => {
    if (isGitHubLogin(author)) {
      logins.add(author.trim());
    }
    for (const m of extractMentionLogins(body)) {
      logins.add(m);
    }
  };
  for (const c of comments.page_comments) {
    add(c.author, c.body);
    for (const r of c.replies) {
      add(r.author, r.body);
    }
  }
  for (const c of comments.inline_comments) {
    add(c.author, c.body);
    for (const r of c.replies) {
      add(r.author, r.body);
    }
  }
  return [...logins].sort((a, b) => a.localeCompare(b));
}

function authorInitials(author: string): string {
  const parts = authorDisplayLabel(author).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (author.trim().slice(0, 2) || '?').toUpperCase();
}

function renderAvatar(author: string, large = false): string {
  const initials = authorInitials(author);
  const sizeClass = large ? ' md-comments-avatar-lg' : '';
  const login = resolveAuthorLogin(author);
  const px = large ? 64 : 48;
  const dataUrl = login ? getAvatarDataUrl(login, px) : undefined;
  if (dataUrl) {
    return `<div class="md-comments-avatar md-comments-avatar-loaded${sizeClass}" aria-hidden="true">
      <img class="md-comments-avatar-img" src="${escapeHtml(dataUrl)}" alt="" decoding="async" />
      <span class="md-comments-avatar-fallback">${escapeHtml(initials)}</span>
    </div>`;
  }
  return `<div class="md-comments-avatar${sizeClass} md-comments-avatar-fallback-only" aria-hidden="true"><span class="md-comments-avatar-fallback">${escapeHtml(initials)}</span></div>`;
}

function threadFooterBtn(
  action: string,
  label: string,
  icon: string,
  attrs: Record<string, string>
): string {
  const dataAttrs = Object.entries(attrs)
    .map(([k, v]) => {
      const attr = k === 'id' ? 'data-md-id' : `data-md-${k}`;
      return ` ${attr}="${escapeHtml(v)}"`;
    })
    .join('');
  return `<button type="button" class="md-comments-thread-footer-btn" data-md-action="${escapeHtml(action)}" aria-label="${escapeHtml(label)}"${dataAttrs}>${icon}<span>${escapeHtml(label)}</span></button>`;
}

function replyCountLabel(count: number, hidden: boolean): string {
  if (count === 1) {
    return hidden ? 'Show reply' : 'Hide reply';
  }
  return hidden ? `Show ${count} replies` : `Hide ${count} replies`;
}

function renderRepliesBlock(
  rootId: string,
  type: 'page' | 'inline',
  replies: Parameters<typeof renderReply>[0][],
  showReplyInFooter: boolean
): string {
  const count = replies.length;
  const replyHtml = replies.map((r) => renderReply(r, rootId, type)).join('');
  const hideLabel = replyCountLabel(count, false);
  const showLabel = replyCountLabel(count, true);
  const replyFooter = showReplyInFooter
    ? threadFooterBtn('reply', 'Reply', ICON_REPLY, { id: rootId, type, kind: 'root' })
    : '';
  return `<div class="md-comments-replies-block" data-md-root-id="${escapeHtml(rootId)}" data-md-reply-count="${count}">
    <div class="md-comments-replies-list" data-md-replies-panel>${replyHtml}</div>
    <footer class="md-comments-thread-footer${showReplyInFooter ? '' : ' md-comments-thread-footer-toggle-only'}">
      ${replyFooter}
      <button type="button" class="md-comments-thread-footer-btn md-comments-toggle-replies" data-md-action="toggle-replies" data-md-root-id="${escapeHtml(rootId)}" aria-expanded="true">
        ${ICON_COLLAPSE_REPLIES}
        <span class="md-comments-toggle-hide">${escapeHtml(hideLabel)}</span>
        <span class="md-comments-toggle-show" hidden>${escapeHtml(showLabel)}</span>
      </button>
    </footer>
  </div>`;
}

function renderReactions(
  reactions: { emoji: string; users: string[] }[],
  targetId: string,
  rootId: string,
  type: string,
  kind: string
): string {
  if (!reactions.length) {
    return '';
  }
  const chips = reactions
    .map(
      (r) =>
        `<button type="button" class="md-comments-reaction-chip" data-md-action="react" data-md-target="${escapeHtml(targetId)}" data-md-root="${escapeHtml(rootId)}" data-md-type="${type}" data-md-kind="${kind}" data-md-emoji="${escapeHtml(r.emoji)}">${escapeHtml(r.emoji)} ${r.users.length}</button>`
    )
    .join('');
  return `<div class="md-comments-reactions">${chips}</div>`;
}

function renderReply(
  reply: {
    id: string;
    author: string;
    body: string;
    created_at: string;
    updated_at?: string;
    reactions: { emoji: string; users: string[] }[];
  },
  rootId: string,
  type: string
): string {
  return `<div class="md-comments-reply" data-md-comment-id="${escapeHtml(reply.id)}" data-md-stored-author="${escapeHtml(reply.author)}">
    <div class="md-comments-thread-row">
      ${renderAvatar(reply.author)}
      <div class="md-comments-thread-content">
        <div class="md-comments-meta">${renderAuthorLink(reply.author)}<span class="md-comments-time">${escapeHtml(formatCommentTime(reply.created_at, reply.updated_at))}</span></div>
        <div class="md-comments-body">${renderCommentBody(reply.body)}</div>
        ${renderReactions(reply.reactions, reply.id, rootId, type, 'reply')}
        <div class="md-comments-actions md-comments-actions-icons">
          ${renderEditBtn(reply.author, reply.id, rootId, type, 'reply')}
          ${actionIconBtn('react-picker', 'Add reaction', ICON_REACT, {
            id: reply.id,
            'target-id': reply.id,
            'root-id': rootId,
            type,
            kind: 'reply',
          })}
          ${actionIconBtn(
            'delete',
            'Delete reply',
            ICON_DELETE,
            { id: reply.id, 'root-id': rootId, type, kind: 'reply' },
            'md-comments-icon-btn-danger'
          )}
        </div>
      </div>
    </div>
  </div>`;
}

function renderCard(
  id: string,
  author: string,
  created_at: string,
  body: string,
  type: 'page' | 'inline',
  reactions: { emoji: string; users: string[] }[],
  replies: Parameters<typeof renderReply>[0][],
  orphaned?: boolean,
  inlineMeta?: { paragraphIndex: number; anchorText: string },
  resolved?: boolean,
  updated_at?: string,
  reanchor?: boolean
): string {
  const badges = [
    orphaned ? '<span class="md-comments-badge md-comments-badge-orphan">orphaned</span>' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const hasReplies = replies.length > 0;
  const inlineAttrs =
    type === 'inline' && inlineMeta
      ? ` data-md-paragraph-index="${inlineMeta.paragraphIndex}" data-md-anchor-text="${escapeHtml(inlineMeta.anchorText)}"${
          resolved ? ' data-md-resolved="true"' : ''
        }`
      : '';
  const pageLabel =
    type === 'page' ? '<span class="md-comments-type-label">Page comment</span>' : '';
  const threadStateBtn = !resolved
    ? actionIconBtn('resolve', 'Resolve thread', ICON_RESOLVE, { id, type, kind: 'root' })
    : actionIconBtn('unresolve', 'Reopen thread', ICON_REOPEN, { id, type, kind: 'root' });
  const editBtn = renderEditBtn(author, id, id, type, 'root');
  const reanchorBtn = reanchor
    ? actionIconBtn('reanchor-start', 'Re-anchor', ICON_REANCHOR, { id })
    : '';
  const resolvedActions = resolved
    ? `${editBtn}${threadStateBtn}${actionIconBtn(
        'delete',
        'Delete comment',
        ICON_DELETE,
        { id, type, kind: 'root' },
        'md-comments-icon-btn-danger'
      )}`
    : `${editBtn}${reanchorBtn}${hasReplies ? '' : actionIconBtn('reply', 'Reply', ICON_REPLY, { id, type, kind: 'root' })}
          ${threadStateBtn}
          ${actionIconBtn('react-picker', 'Add reaction', ICON_REACT, {
            id,
            'target-id': id,
            'root-id': id,
            type,
            kind: 'root',
          })}
          ${actionIconBtn(
            'delete',
            'Delete comment',
            ICON_DELETE,
            { id, type, kind: 'root' },
            'md-comments-icon-btn-danger'
          )}`;
  const repliesBlock = hasReplies ? renderRepliesBlock(id, type, replies, !resolved) : '';
  return `<div class="md-comments-card${hasReplies ? ' md-comments-card-has-replies' : ''}" data-md-comment-id="${escapeHtml(id)}" data-md-type="${type}" data-md-stored-author="${escapeHtml(author)}"${inlineAttrs}>
    <div class="md-comments-thread-row md-comments-thread-root">
      <div class="md-comments-avatar-wrap">${renderAvatar(author)}</div>
      <div class="md-comments-thread-content">
        <div class="md-comments-meta">${pageLabel}${renderAuthorLink(author)}<span class="md-comments-time">${escapeHtml(formatCommentTime(created_at, updated_at))}</span>${badges}</div>
        <div class="md-comments-body">${renderCommentBody(body)}</div>
        ${renderReactions(reactions, id, id, type, 'root')}
        <div class="md-comments-actions md-comments-actions-icons">${resolvedActions}</div>
      </div>
    </div>
    ${repliesBlock}
  </div>`;
}

interface RenderContext {
  blocks: ReturnType<typeof parseMarkdownAnchors>;
  placements: PlacementResult[];
  comments: CommentsFile;
  mdPath: string;
}

function renderQuoteExcerpt(anchorText: string, heading?: string): string {
  const headingHtml = heading
    ? `<div class="md-comments-quote-heading">${escapeHtml(heading)}</div>`
    : '';
  return `<blockquote class="md-comments-quote" data-md-quote="true">${headingHtml}<div class="md-comments-quote-text">${escapeHtml(anchorText)}</div></blockquote>`;
}

function renderSidebarThread(
  cardHtml: string,
  options?: { quote?: string; heading?: string }
): string {
  const quote = options?.quote ? renderQuoteExcerpt(options.quote, options.heading) : '';
  return `<article class="md-comments-sidebar-thread">${quote}${cardHtml}</article>`;
}

function renderResolvedSummary(author: string, created_at: string, excerpt: string): string {
  const short = excerpt.length > 72 ? `${excerpt.slice(0, 72)}…` : excerpt;
  return `<span class="md-comments-resolved-summary-author">${renderAuthorLink(author)}</span>
    <span class="md-comments-resolved-summary-time">${escapeHtml(formatTime(created_at))}</span>
    <span class="md-comments-resolved-summary-excerpt">${escapeHtml(short)}</span>`;
}

function renderResolvedThread(
  cardHtml: string,
  author: string,
  created_at: string,
  excerpt: string
): string {
  return `<details class="md-comments-resolved-collapse">
    <summary class="md-comments-resolved-summary">${renderResolvedSummary(author, created_at, excerpt)}</summary>
    <div class="md-comments-resolved-body">${cardHtml}</div>
  </details>`;
}

function panelEmpty(message: string): string {
  return `<p class="md-comments-sidebar-empty">${escapeHtml(message)}</p>`;
}

function buildSidebarHtml(ctx: RenderContext): string {
  const pageActive = ctx.comments.page_comments.filter((c) => !c.resolved);
  const pageResolved = ctx.comments.page_comments.filter((c) => c.resolved);

  const inlineOpen = ctx.placements
    .filter((p) => p.placed && !p.comment.resolved && !isOrphanedPlacement(ctx.blocks, p))
    .sort(
      (a, b) =>
        (a.paragraphIndex ?? 0) - (b.paragraphIndex ?? 0) ||
        a.comment.created_at.localeCompare(b.comment.created_at)
    );
  const inlineResolved = ctx.placements
    .filter((p) => p.placed && p.comment.resolved)
    .sort((a, b) => b.comment.created_at.localeCompare(a.comment.created_at));
  const orphans = ctx.placements.filter(
    (p) => !p.comment.resolved && isOrphanedPlacement(ctx.blocks, p)
  );

  const resolvedAll = [
    ...pageResolved.map((c) => ({
      kind: 'page' as const,
      card: renderCard(
        c.id,
        c.author,
        c.created_at,
        c.body,
        'page',
        c.reactions,
        c.replies,
        false,
        undefined,
        true,
        c.updated_at
      ),
      author: c.author,
      created_at: c.created_at,
      excerpt: c.body,
    })),
    ...inlineResolved.map((p) => {
      const c = p.comment;
      return {
        kind: 'inline' as const,
        card: renderCard(
          c.id,
          c.author,
          c.created_at,
          c.body,
          'inline',
          c.reactions,
          c.replies,
          c.orphaned,
          { paragraphIndex: c.paragraph_index, anchorText: c.anchor_text },
          true,
          c.updated_at
        ),
        author: c.author,
        created_at: c.created_at,
        excerpt: c.anchor_text,
      };
    }),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const inlineHtml = inlineOpen.length
    ? inlineOpen
        .map((p) => {
          const c = p.comment;
          return renderSidebarThread(
            renderCard(
              c.id,
              c.author,
              c.created_at,
              c.body,
              'inline',
              c.reactions,
              c.replies,
              c.orphaned,
              { paragraphIndex: c.paragraph_index, anchorText: c.anchor_text },
              false,
              c.updated_at
            ),
            { quote: c.anchor_text, heading: c.heading_context || undefined }
          );
        })
        .join('')
    : panelEmpty(
        'No open inline comments. Select text or use the comment icon beside a paragraph.'
      );

  const pageHtml = pageActive.length
    ? pageActive
        .map((c) =>
          renderSidebarThread(
            renderCard(
              c.id,
              c.author,
              c.created_at,
              c.body,
              'page',
              c.reactions,
              c.replies,
              false,
              undefined,
              false,
              c.updated_at
            )
          )
        )
        .join('')
    : panelEmpty('No open page comments. Use “Add a comment” below.');

  const orphanHtml = orphans.length
    ? orphans
        .map((p) => {
          const c = p.comment;
          return renderSidebarThread(
            renderCard(
              c.id,
              c.author,
              c.created_at,
              c.body,
              'inline',
              c.reactions,
              c.replies,
              true,
              { paragraphIndex: c.paragraph_index, anchorText: c.anchor_text },
              false,
              c.updated_at,
              true
            ),
            {
              quote: c.anchor_text,
              heading: c.heading_context || undefined,
            }
          );
        })
        .join('')
    : panelEmpty('No orphaned comments.');

  const resolvedHtml = resolvedAll.length
    ? resolvedAll
        .map((r) => renderResolvedThread(r.card, r.author, r.created_at, r.excerpt))
        .join('')
    : panelEmpty('No resolved comments.');

  const defaultTab = inlineOpen.length
    ? 'inline'
    : pageActive.length
      ? 'page'
      : orphans.length
        ? 'orphan'
        : resolvedAll.length
          ? 'resolved'
          : 'inline';

  const tab = (id: string, label: string, count: number) =>
    `<button type="button" class="md-comments-tab${id === defaultTab ? ' md-comments-tab-active' : ''}" role="tab" data-tab="${id}" aria-selected="${id === defaultTab ? 'true' : 'false'}">${escapeHtml(label)} <span class="md-comments-tab-count">${count}</span></button>`;

  const panel = (id: string, html: string) => {
    const active = id === defaultTab;
    return `<div class="md-comments-tab-panel${active ? ' md-comments-tab-panel-active' : ''}" data-panel="${id}" role="tabpanel"${active ? '' : ' hidden'}>${html}</div>`;
  };

  return `<nav class="md-comments-tabs" role="tablist">
      ${tab('inline', 'Inline', inlineOpen.length)}
      ${tab('page', 'Page', pageActive.length)}
      ${tab('orphan', 'Orphan', orphans.length)}
      ${tab('resolved', 'Resolved', resolvedAll.length)}
    </nav>
    <div class="md-comments-tab-panels">
      ${panel('inline', inlineHtml)}
      ${panel('page', pageHtml)}
      ${panel('orphan', orphanHtml)}
      ${panel('resolved', resolvedHtml)}
    </div>`;
}

function getReactionEmojisJson(): string {
  const cfg = vscode.workspace.getConfiguration('mdComments');
  const emojis = cfg.get<string[]>('reactionEmojis', ['👍', '👀', '❤️', '🎉', '❓']);
  return escapeHtml(
    JSON.stringify(Array.isArray(emojis) ? emojis : ['👍', '👀', '❤️', '🎉', '❓'])
  );
}

function getDefaultSidebarWidth(): number {
  const cfg = vscode.workspace.getConfiguration('mdComments');
  const w = cfg.get<number>('sidebarWidth', 340);
  const n = typeof w === 'number' ? w : 340;
  return Math.min(600, Math.max(260, n));
}

function renderDocumentLayout(
  docHtml: string,
  ctx: RenderContext,
  saveHint: string,
  footer: string
): string {
  const threadCount =
    ctx.comments.page_comments.filter((c) => !c.resolved).length +
    ctx.placements.filter(
      (p) => !p.comment.resolved && p.placed && !isOrphanedPlacement(ctx.blocks, p)
    ).length;
  const defaultOpen = threadCount > 0 ? 'true' : 'false';
  const sidebarBody = buildSidebarHtml(ctx);
  const sidebarWidth = getDefaultSidebarWidth();

  const authBanner = hasTokenSync()
    ? ''
    : `<div class="md-comments-auth-banner" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); padding: 8px 12px; margin: 8px; border-radius: 6px; font-size: 12px; color: var(--vscode-foreground);">
        ⚠️ <strong>Not Logged In to GitHub</strong>. Sign in to view and post comments for private repositories.
        <a href="command:mdComments.signIn" style="color: var(--vscode-textLink-foreground); font-weight: bold; margin-left: 6px; text-decoration: underline;">Sign In to GitHub</a>
      </div>`;

  return `<div id="md-comments-layout" class="md-comments-layout" data-md-default-open="${defaultOpen}" data-md-thread-count="${threadCount}" style="--gc-sidebar-width: ${sidebarWidth}px">
    <div class="md-comments-main">
      ${authBanner}
      ${saveHint}
      <div class="md-comments-document">${docHtml}</div>
    </div>
    <button type="button" class="md-comments-fab" id="md-comments-panel-fab" title="Show comments" aria-label="Show comments" aria-expanded="false">
      <svg class="md-comments-fab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9.5L6.5 17.5V6a1.5 1.5 0 0 1 1.5-1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M6.5 17.5 4.5 20.5 6.5 19.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 8h7.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
        <path d="M8.5 10.5h7.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
        <path d="M8.5 13h4.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
      </svg>
    </button>
    <aside id="md-comments-sidebar" class="md-comments-sidebar" aria-label="Comments">
      <div class="md-comments-sidebar-resizer" id="md-comments-sidebar-resizer" role="separator" aria-orientation="vertical" aria-label="Resize comments panel" title="Drag to resize"></div>
      <header class="md-comments-sidebar-header">
         <h2 class="md-comments-sidebar-title">Comments</h2>
         <div class="md-comments-sidebar-header-actions">
           <button type="button" class="md-comments-sidebar-icon-btn" id="md-comments-sidebar-close" title="Close comments" aria-label="Close comments">×</button>
         </div>
      </header>
      ${authBanner}
      <div class="md-comments-sidebar-body">${sidebarBody}</div>
      <footer class="md-comments-sidebar-footer">
        <button type="button" class="md-comments-sidebar-add" data-md-action="addPage">
          <span class="md-comments-icon-comment" aria-hidden="true"></span> Add a comment
        </button>
      </footer>
    </aside>
    ${footer}
  </div>`;
}

function getMdUri(env: Record<string, unknown>): vscode.Uri | undefined {
  const raw = env['currentDocument'] ?? env['containingUri'] ?? env['sourceResource'];
  if (!raw) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return vscode.Uri.parse(raw);
  }
  if (typeof raw === 'object' && raw !== null) {
    const u = raw as vscode.Uri;
    if (typeof u.toString === 'function') {
      try {
        return vscode.Uri.parse(u.toString(true));
      } catch {
        // fall through
      }
    }
    if (typeof u.fsPath === 'string' && u.fsPath.length > 0) {
      return vscode.Uri.file(u.fsPath);
    }
    if (typeof u.path === 'string' && u.path.length > 0) {
      return vscode.Uri.file(u.path);
    }
  }
  return vscode.Uri.parse(String(raw));
}

function loadContext(uri: vscode.Uri): RenderContext | null {
  try {
    logDebug(`loadContext invoked for URI: ${uri.toString()}`);
    const mdPath = uri.fsPath || uri.path;
    const markdown = fs.readFileSync(mdPath, 'utf8');
    const blocks = parseMarkdownAnchors(markdown);

    let comments: CommentsFile = { page_comments: [], inline_comments: [] };
    const key = resolveStorageKeyForUriSync(uri);
    logDebug(`loadContext resolved storage key:`, key);
    if (key) {
      const cached = globalOptimisticStore.getCached(key);
      if (cached) {
        logDebug(`loadContext cache hit. Loaded inline count: ${cached.inline_comments.length}`);
        comments = cached;
      } else {
        logDebug(`loadContext cache cold. Launching async readComments for: ${uri.toString()}`);
        void readComments(uri).then((fetched) => {
          logDebug(
            `loadContext async readComments returned. inline count: ${fetched.inline_comments.length}`
          );
        });
      }
    } else {
      logDebug(
        `loadContext storage key is null for URI: ${uri.toString()}. Remote features will be unavailable.`
      );
    }

    const placements = placeInlineComments(blocks, comments.inline_comments);
    return {
      blocks,
      placements,
      comments,
      mdPath,
    };
  } catch (err) {
    console.error('[md-comments] failed to load comment context for', uri.toString(), err);
    logDebug('[md-comments] failed to load comment context for', uri.toString(), err);
    return null;
  }
}

/** Per-render state (VS Code caches tokens — attrs must be applied at render time). */
let renderCtx: RenderContext | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function extendMarkdownIt(md: any): any {
  const defaultParagraphOpen =
    md.renderer.rules.paragraph_open ||
    function (tokens: any, idx: any, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.paragraph_open = (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any
  ) => {
    if (renderCtx) {
      const token = tokens[idx];
      const nextToken = tokens[idx + 1];
      if (nextToken && nextToken.type === 'inline' && nextToken.content) {
        const text = normalizeAnchorText(nextToken.content);
        const hash = fnv1aHash(text);
        let block = renderCtx.blocks.find((b) => b.anchor_hash === hash);
        if (!block) {
          block = renderCtx.blocks.find((b) => fuzzyMatch(text, b.anchor_text));
        }
        if (block) {
          token.attrJoin('class', 'md-comments-paragraph');
          token.attrSet('data-md-paragraph-index', String(block.paragraph_index));
          token.attrSet('data-md-anchor-hash', block.anchor_hash);
          token.attrSet('data-md-heading', block.heading_context);
          token.attrSet('data-md-anchor-text', block.anchor_text);
        }
      }
    }
    return defaultParagraphOpen(tokens, idx, options, env, self);
  };

  const defaultParagraphClose =
    md.renderer.rules.paragraph_close ||
    function (tokens: any, idx: any, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  function getAttr(token: any, name: string): string | null {
    if (!token.attrs) return null;
    const attr = token.attrs.find((a: any) => a[0] === name);
    return attr ? attr[1] : null;
  }

  md.renderer.rules.paragraph_close = (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any
  ) => {
    let paraBtn = '';
    if (renderCtx) {
      let openToken = null;
      for (let i = idx - 1; i >= 0; i--) {
        if (tokens[i].type === 'paragraph_open') {
          openToken = tokens[i];
          break;
        }
      }
      if (openToken) {
        const paragraphIndex = getAttr(openToken, 'data-md-paragraph-index');
        if (paragraphIndex !== null) {
          paraBtn = `<span class="md-comments-para-actions">${actionIconBtn(
            'comment-paragraph',
            'Comment on paragraph',
            ICON_PARAGRAPH_COMMENT,
            { id: paragraphIndex }
          )}</span>`;
        }
      }
    }
    return defaultParagraphClose(tokens, idx, options, env, self) + paraBtn;
  };

  const defaultRender = md.renderer.render.bind(md.renderer);

  md.renderer.render = function (tokens: any, options: any, env: any) {
    const envRecord = (env ?? {}) as Record<string, unknown>;
    const uri = getMdUri(envRecord);
    const fromEnv =
      typeof envRecord.currentAuthor === 'string' ? envRecord.currentAuthor.trim() : '';
    const currentAuthor = fromEnv || getCachedAuthor()?.trim() || '';
    renderCurrentAuthor = currentAuthor || undefined;
    renderCtx = uri ? loadContext(uri) : null;

    const html = defaultRender(tokens, options, env);

    if (!renderCtx) {
      const hint = uri
        ? `Could not load comments for ${escapeHtml(uri.fsPath)}`
        : 'No document URI in preview render env';
      return `<div class="md-comments-debug">${hint}. Check Markdown Comments output.</div>` + html;
    }

    const inCommentPreview = envRecord.mdCommentsWebview === true;
    const saveHint = inCommentPreview
      ? ''
      : `<div class="md-comments-save-hint">
          <div class="md-comments-save-hint-line"><strong>Saving comments in Cursor:</strong> use
          <a href="command:mdComments.openCommentPreview">Markdown Comments: Open Comment Preview</a>
          — the built-in Markdown preview cannot reach the extension here.</div>
          <div class="md-comments-save-hint-line">Or run <em>Markdown: Change Preview Security Settings</em> → <em>Allow in workspace</em> and retry.</div>
        </div>`;

    const mdEncoded = encodeURIComponent(renderCtx.mdPath);
    const anchorsPayload = Buffer.from(JSON.stringify(renderCtx.blocks), 'utf8').toString('base64');
    const mentionLogins = collectMentionCandidates(renderCtx.comments);
    const mentionUsers = escapeHtml(JSON.stringify(mentionLogins));
    const displayNames = escapeHtml(
      JSON.stringify(displayNamesMapForLogins(collectGitHubLogins(renderCtx.comments)))
    );
    const currentAuthorAttr = escapeHtml(currentAuthor);
    const footer = `<div class="md-comments-footer" data-md-md-path="${escapeHtml(renderCtx.mdPath)}" data-md-md-encoded="${mdEncoded}" data-code="${escapeHtml(anchorsPayload)}" data-md-reaction-emojis="${getReactionEmojisJson()}" data-md-mention-users="${mentionUsers}" data-md-display-names="${displayNames}" data-md-current-author="${currentAuthorAttr}"></div>
      <a id="md-comments-messenger" href="#" style="display:none" aria-hidden="true"></a>`;

    const comments = renderCtx.comments;
    const logins = collectGitHubLogins(comments);
    void warmGitHubDisplayNames(logins)
      .then((namesLoaded) =>
        warmGitHubAvatars(collectAvatarLogins(comments)).then(
          (avatarsLoaded) => namesLoaded + avatarsLoaded
        )
      )
      .then((loaded) => {
        if (loaded > 0) {
          schedulePreviewRefreshAfterDisplayNames();
        }
      });

    renderCurrentAuthor = undefined;
    return renderDocumentLayout(html, renderCtx, saveHint, footer);
  };

  return md;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
