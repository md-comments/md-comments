import { extractMentionLogins } from './author.js';
import type { CommentsFile } from './types.js';

export interface NotificationBodyParams {
  author: string;
  filePath: string;
  line?: number;
  documentUrl?: string;
  anchorSnippet?: string;
  commentBody: string;
}

/**
 * Formats a clean GitHub commit comment body alerting mentioned users.
 */
export function formatNotificationBody(params: NotificationBodyParams): string {
  const lineSuffix = params.line && params.line > 0 ? `#L${params.line}` : '';
  const fileDisplay = `${params.filePath}${lineSuffix}`;
  const docUrl = params.documentUrl || `#`;

  const parts: string[] = [];
  parts.push(`💬 **@${params.author.trim()}** mentioned you on [\`${fileDisplay}\`](${docUrl}):`);

  if (params.anchorSnippet && params.anchorSnippet.trim()) {
    const snippet = params.anchorSnippet.trim();
    // Prefix each line of anchor snippet with quote
    const quotedSnippet = snippet
      .split('\n')
      .map((l) => `> *"${l}"*`)
      .join('\n');
    parts.push(`\n${quotedSnippet}`);
  }

  parts.push(`\n${params.commentBody.trim()}`);
  parts.push(`\n---\n*Sent via [Markdown Comments](https://md-comments.com)*`);

  return parts.join('\n');
}

export interface NotificationEvent {
  commentId: string;
  author: string;
  body: string;
  filePath: string;
  line?: number;
  anchorSnippet?: string;
  newMentions: string[];
}

/**
 * Analyzes old vs. new comments to discover newly added @mentions that should trigger notifications.
 */
export function findNewlyMentionedEvents(
  previousComments: CommentsFile | null,
  newComments: CommentsFile,
  metadata: {
    owner: string;
    repo: string;
    filePath: string;
  }
): NotificationEvent[] {
  const previousMentionMap = new Map<string, Set<string>>();

  if (previousComments) {
    for (const c of previousComments.inline_comments || []) {
      previousMentionMap.set(c.id, new Set(extractMentionLogins(c.body)));
      for (const r of c.replies || []) {
        previousMentionMap.set(r.id, new Set(extractMentionLogins(r.body)));
      }
    }
    for (const c of previousComments.page_comments || []) {
      previousMentionMap.set(c.id, new Set(extractMentionLogins(c.body)));
      for (const r of c.replies || []) {
        previousMentionMap.set(r.id, new Set(extractMentionLogins(r.body)));
      }
    }
  }

  const events: NotificationEvent[] = [];

  // Check inline comments
  for (const c of newComments.inline_comments || []) {
    const currentMentions = extractMentionLogins(c.body);
    const prevMentions = previousMentionMap.get(c.id) || new Set<string>();
    const newMentions = currentMentions.filter((m) => !prevMentions.has(m));

    if (newMentions.length > 0) {
      events.push({
        commentId: c.id,
        author: c.author,
        body: c.body,
        filePath: metadata.filePath,
        anchorSnippet: c.anchor_text,
        newMentions,
      });
    }

    for (const r of c.replies || []) {
      const replyMentions = extractMentionLogins(r.body);
      const prevReplyMentions = previousMentionMap.get(r.id) || new Set<string>();
      const newReplyMentions = replyMentions.filter((m) => !prevReplyMentions.has(m));

      if (newReplyMentions.length > 0) {
        events.push({
          commentId: r.id,
          author: r.author,
          body: r.body,
          filePath: metadata.filePath,
          anchorSnippet: c.anchor_text,
          newMentions: newReplyMentions,
        });
      }
    }
  }

  // Check page comments
  for (const c of newComments.page_comments || []) {
    const currentMentions = extractMentionLogins(c.body);
    const prevMentions = previousMentionMap.get(c.id) || new Set<string>();
    const newMentions = currentMentions.filter((m) => !prevMentions.has(m));

    if (newMentions.length > 0) {
      events.push({
        commentId: c.id,
        author: c.author,
        body: c.body,
        filePath: metadata.filePath,
        newMentions,
      });
    }

    for (const r of c.replies || []) {
      const replyMentions = extractMentionLogins(r.body);
      const prevReplyMentions = previousMentionMap.get(r.id) || new Set<string>();
      const newReplyMentions = replyMentions.filter((m) => !prevReplyMentions.has(m));

      if (newReplyMentions.length > 0) {
        events.push({
          commentId: r.id,
          author: r.author,
          body: r.body,
          filePath: metadata.filePath,
          newMentions: newReplyMentions,
        });
      }
    }
  }

  return events;
}

export interface DispatchParams {
  owner: string;
  repo: string;
  commitSha: string;
  event: NotificationEvent;
  getToken: () => Promise<string | null> | string | null;
  defaultBranch?: string;
  fetchFn?: typeof fetch;
}

/**
 * Dispatches a commit comment to GitHub on the target commitSha for a newly mentioned collaborator.
 * Non-blocking: fails gracefully without throwing errors so comment persistence is never compromised.
 */
export async function dispatchCommitCommentNotification(params: DispatchParams): Promise<boolean> {
  try {
    const fetchApi = params.fetchFn || fetch;
    const token = await params.getToken();

    const branch = params.defaultBranch || 'main';
    const documentUrl = `https://github.com/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.repo)}/blob/${encodeURIComponent(branch)}/${params.event.filePath}`;

    const body = formatNotificationBody({
      author: params.event.author,
      filePath: params.event.filePath,
      line: params.event.line,
      documentUrl,
      anchorSnippet: params.event.anchorSnippet,
      commentBody: params.event.body,
    });

    const commitCommentUrl = `https://api.github.com/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.repo)}/commits/${encodeURIComponent(params.commitSha)}/comments`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchApi(commitCommentUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[md-comments] Notification commit comment failed (${res.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[md-comments] Exception dispatching commit comment notification:', err);
    return false;
  }
}
