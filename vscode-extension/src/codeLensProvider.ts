import * as vscode from 'vscode';
import { readComments } from './commentStore';
import { parseMarkdownAnchors } from '../../shared/anchor';
import { placeInlineComments, isOrphanedPlacement } from '../../shared/placement';

export class MarkdownCommentsCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (document.languageId !== 'markdown') {
      return [];
    }

    try {
      const markdown = document.getText();
      const blocks = parseMarkdownAnchors(markdown);
      const comments = await readComments(document.uri);

      if (!comments.inline_comments || comments.inline_comments.length === 0) {
        return [];
      }

      // Compute placements
      const placements = placeInlineComments(blocks, comments.inline_comments);

      // Group placements by line number of their matched block
      const lineToPlacements = new Map<number, typeof placements>();
      for (const p of placements) {
        if (!p.placed || isOrphanedPlacement(blocks, p)) {
          continue;
        }
        // Find the block corresponding to this placement to get its line number
        const block = blocks.find((b) => b.paragraph_index === p.paragraphIndex);
        if (block && typeof block.line_number === 'number') {
          const list = lineToPlacements.get(block.line_number) || [];
          list.push(p);
          lineToPlacements.set(block.line_number, list);
        }
      }

      const lenses: vscode.CodeLens[] = [];
      for (const [lineNum, list] of lineToPlacements.entries()) {
        const total = list.length;
        const active = list.filter((p) => !p.comment.resolved).length;
        if (total === 0) {
          continue;
        }

        const range = new vscode.Range(lineNum, 0, lineNum, 0);
        // Label format: 💬 {count} comment(s) ({activeCount} active)
        const label = `💬 ${total} comment${total === 1 ? '' : 's'} (${active} active)`;

        const lens = new vscode.CodeLens(range, {
          title: label,
          command: 'mdComments.openCommentPreview',
          arguments: [document.uri],
        });
        lenses.push(lens);
      }

      return lenses;
    } catch (err) {
      console.error('[md-comments] failed to provide CodeLenses:', err);
      return [];
    }
  }
}
