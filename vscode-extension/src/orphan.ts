import * as vscode from 'vscode';
import { parseMarkdownAnchors } from '../../shared/anchor';
import { placeInlineComments, isOrphanedPlacement } from '../../shared/placement';
import { readComments, updateOrphanFlags } from './commentStore';

export async function scanOrphansForMarkdown(mdUri: vscode.Uri): Promise<number> {
  let markdown: string;
  try {
    const data = await vscode.workspace.fs.readFile(mdUri);
    markdown = Buffer.from(data).toString('utf8');
  } catch {
    return 0;
  }

  const blocks = parseMarkdownAnchors(markdown);
  const comments = await readComments(mdUri);
  const active = comments.inline_comments.filter((c) => !c.resolved);
  const placements = placeInlineComments(blocks, active);
  const orphanIds = new Set(
    placements.filter((p) => isOrphanedPlacement(blocks, p)).map((p) => p.comment.id)
  );
  const changed = await updateOrphanFlags(mdUri, orphanIds);
  return changed ? orphanIds.size : 0;
}
