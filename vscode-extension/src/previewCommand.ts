import type { CommentActionMessage } from './commentActions';

/** Decode payload from markdown preview command link (single base64 arg). */
export function parsePreviewCommandArg(raw: unknown): CommentActionMessage {
  if (raw === undefined || raw === null) {
    throw new Error('Markdown Comments: missing command payload');
  }

  if (typeof raw === 'string') {
    try {
      const json = Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(json) as CommentActionMessage;
      if (parsed?.action) {
        return parsed;
      }
    } catch {
      // fall through — may be legacy JSON array string
    }
    try {
      const parsed = JSON.parse(raw) as CommentActionMessage | CommentActionMessage[];
      if (Array.isArray(parsed)) {
        return normalizeObject(parsed[0]);
      }
      return normalizeObject(parsed);
    } catch {
      throw new Error('Markdown Comments: could not parse command payload');
    }
  }

  if (Array.isArray(raw)) {
    if (raw.length === 1 && typeof raw[0] === 'string') {
      return parsePreviewCommandArg(raw[0]);
    }
    return normalizeObject(raw[0]);
  }

  if (typeof raw === 'object') {
    return normalizeObject(raw as CommentActionMessage);
  }

  throw new Error('Markdown Comments: invalid command payload type');
}

function normalizeObject(value: unknown): CommentActionMessage {
  const msg = value as CommentActionMessage;
  if (!msg?.action) {
    throw new Error('Markdown Comments: preview action missing "action" field');
  }
  return msg;
}
