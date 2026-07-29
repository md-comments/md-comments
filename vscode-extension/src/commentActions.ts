import * as path from 'path';
import * as vscode from 'vscode';
import {
  addInlineComment,
  addPageComment,
  addReply,
  deleteComment,
  editComment,
  reanchorComment,
  resolveComment,
  toggleReaction,
  unresolveComment,
} from './commentStore';
import type { CommentRootType } from '../../shared/types';

/** Plain text from command bridge, or legacy base64url from URI handler. */
export function resolveText(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  if (!raw.startsWith('b64:')) {
    return raw;
  }
  const encoded = raw.slice(4);
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return decodeURIComponent(encoded);
  }
}

export type CommentActionMessage = {
  action: string;
  md?: string;
  body?: string;
  text?: string;
  heading?: string;
  hash?: string;
  index?: string;
  rootId?: string;
  type?: string;
  id?: string;
  targetId?: string;
  kind?: string;
  emoji?: string;
};

function savedToast(savedPath: string, label: string): void {
  const name = path.basename(savedPath);
  vscode.window.showInformationMessage(`Markdown Comments: ${label} (saved to ${name})`);
}

export async function executeCommentAction(
  mdUri: vscode.Uri,
  msg: CommentActionMessage
): Promise<void> {
  switch (msg.action) {
    case 'add': {
      const body = resolveText(msg.body);
      if (!body.trim()) {
        throw new Error('Comment must include text');
      }
      const { savedPath } = await addInlineComment(mdUri, {
        body,
        anchor_text: resolveText(msg.text),
        anchor_hash: msg.hash ?? '',
        paragraph_index: Number(msg.index ?? '0'),
        heading_context: resolveText(msg.heading),
      });
      savedToast(savedPath, 'inline comment added');
      break;
    }
    case 'addPage': {
      const body = resolveText(msg.body);
      if (!body.trim()) {
        throw new Error('Comment must include text');
      }
      const { savedPath } = await addPageComment(mdUri, body);
      savedToast(savedPath, 'page comment added');
      break;
    }
    case 'reply': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const body = resolveText(msg.body);
      if (!body.trim()) {
        throw new Error('Reply must include text');
      }
      const savedPath = await addReply(mdUri, msg.rootId ?? '', type, body);
      savedToast(savedPath, 'reply added');
      break;
    }
    case 'edit': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const kind = (msg.kind === 'reply' ? 'reply' : 'root') as 'root' | 'reply';
      const body = resolveText(msg.body);
      if (!body.trim()) {
        throw new Error('Comment must include text');
      }
      const savedPath = await editComment(mdUri, msg.id ?? '', type, kind, msg.rootId, body);
      savedToast(savedPath, kind === 'reply' ? 'reply updated' : 'comment updated');
      break;
    }
    case 'react': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const kind = (msg.kind === 'reply' ? 'reply' : 'root') as 'root' | 'reply';
      await toggleReaction(
        mdUri,
        msg.targetId ?? '',
        kind,
        msg.rootId ?? '',
        type,
        resolveText(msg.emoji)
      );
      break;
    }
    case 'resolve': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const savedPath = await resolveComment(mdUri, msg.id ?? '', type);
      savedToast(savedPath, 'comment resolved');
      break;
    }
    case 'unresolve': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const savedPath = await unresolveComment(mdUri, msg.id ?? '', type);
      savedToast(savedPath, 'comment reopened');
      break;
    }
    case 'delete': {
      const type = (msg.type === 'page' ? 'page' : 'inline') as CommentRootType;
      const kind = msg.kind === 'reply' ? 'reply' : 'root';
      const label = kind === 'reply' ? 'reply' : 'comment';
      const choice = await vscode.window.showWarningMessage(
        `Delete this ${label} permanently? This cannot be undone.`,
        { modal: true },
        'Delete',
        'Cancel'
      );
      if (choice !== 'Delete') {
        return;
      }
      const savedPath = await deleteComment(mdUri, msg.id ?? '', type, kind, msg.rootId);
      savedToast(savedPath, `${label} deleted`);
      break;
    }
    case 'reanchor': {
      const savedPath = await reanchorComment(mdUri, msg.id ?? '', {
        anchor_text: resolveText(msg.text),
        anchor_hash: msg.hash ?? '',
        paragraph_index: Number(msg.index ?? '0'),
        heading_context: resolveText(msg.heading),
      });
      savedToast(savedPath, 'comment re-anchored');
      break;
    }
    default:
      throw new Error(`Unknown action: ${msg.action}`);
  }
}
