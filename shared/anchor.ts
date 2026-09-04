import type { AnchorBlock } from './types.js';

/** FNV-1a 32-bit hash as lowercase hex (matches plan anchor_hash). */
export function fnv1aHash(text: string): string {
  const normalized = normalizeAnchorText(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function computeAnchorId(text: string, index?: number): string {
  const hash = fnv1aHash(text);
  return typeof index === 'number' ? `a_${index}_${hash}` : `a_${hash}`;
}

export function normalizeAnchorText(text: string): string {
  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\|/g, ' ')
    .replace(/^[\s\-*+>\d.]+/g, '');

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Finds which occurrence of `searchText` is closest to `charOffset` within `fullText`.
 * Returns 0-based index of the occurrence.
 */
export function findOccurrenceIndex(
  fullText: string,
  searchText: string,
  charOffset: number
): number {
  if (!fullText || !searchText) return 0;
  const escaped = searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = escaped.replace(/\s+/g, '\\s+');
  let regex: RegExp;
  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    regex = new RegExp(pattern, 'gi');
  } catch {
    return 0;
  }

  const matchIndices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullText)) !== null) {
    matchIndices.push(match.index);
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }

  if (matchIndices.length <= 1) return 0;

  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < matchIndices.length; i++) {
    const diff = Math.abs(matchIndices[i] - charOffset);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx;
}

/**
 * Split markdown into paragraph-level anchor blocks (v1: paragraph tokens only).
 * Skips fenced code blocks; treats blank-line-separated prose as paragraphs.
 */
export function parseMarkdownAnchors(markdown: string): AnchorBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: AnchorBlock[] = [];
  let headingContext = '';
  let paragraphIndex = 0;
  let inFence = false;
  let buffer: string[] = [];
  let blockStartLine = 0;

  const flush = () => {
    const raw = buffer.join('\n').trim();
    buffer = [];
    if (!raw || raw.startsWith('```')) {
      return;
    }
    const anchor_text = normalizeAnchorText(raw.replace(/\n/g, ' '));
    if (!anchor_text) {
      return;
    }
    blocks.push({
      paragraph_index: paragraphIndex,
      heading_context: headingContext,
      anchor_hash: fnv1aHash(anchor_text),
      anchor_text,
      line_number: blockStartLine,
    });
    paragraphIndex++;
  };

  const pushToBuffer = (lineIdx: number, line: string) => {
    if (buffer.length === 0) {
      blockStartLine = lineIdx;
    }
    buffer.push(line);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.trimStart().startsWith('```');
    if (fence) {
      if (inFence) {
        inFence = false;
      } else {
        flush();
        inFence = true;
      }
      continue;
    }
    if (inFence) {
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flush();
      headingContext = heading[2].trim();
      pushToBuffer(i, heading[2].trim());
      flush();
      continue;
    }

    if (/^\s*\|/.test(line)) {
      // eslint-disable-next-line security/detect-unsafe-regex
      if (/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line)) {
        flush();
        continue;
      }
      flush();
      pushToBuffer(i, line);
      flush();
      continue;
    }

    if (/^\s*$/.test(line)) {
      flush();
      continue;
    }

    if (/^(\s*[-*+]|\s*\d+\.|\s*>\s*|```)/.test(line)) {
      flush();
      pushToBuffer(i, line);
      flush();
      continue;
    }

    pushToBuffer(i, line);
  }
  flush();
  return blocks;
}

export function findBlockByIndex(blocks: AnchorBlock[], index: number): AnchorBlock | undefined {
  return blocks.find((b) => b.paragraph_index === index);
}

export function findBlockByHash(blocks: AnchorBlock[], hash: string): AnchorBlock | undefined {
  return blocks.find((b) => b.anchor_hash === hash);
}
