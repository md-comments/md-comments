import type { AnchorBlock } from './types';

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

export function normalizeAnchorText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
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
