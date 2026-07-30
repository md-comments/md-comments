import { Extension, Range } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { placeInlineComments } from '../../shared/placement';
import type { AnchorBlock, InlineComment, CommentsFile } from '../../shared/types';
import { App, TFile } from 'obsidian';

export function createLivePreviewExtension(
  app: App,
  getComments: (file: TFile) => Promise<CommentsFile>,
  getAnchorBlocks: (file: TFile) => Promise<AnchorBlock[]>,
  onOpenComment: (commentId: string) => void
): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = Decoration.none;
        this.updateDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.updateDecorations(update.view);
        }
      }

      async updateDecorations(view: EditorView) {
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
          this.decorations = Decoration.none;
          return;
        }

        try {
          const blocks = await getAnchorBlocks(activeFile);
          const comments = await getComments(activeFile);
          const inlineComments: InlineComment[] = comments.inline_comments || [];
          const placements = placeInlineComments(blocks, inlineComments);
          const activePlacements = placements.filter((p) => p.placed && !p.comment.resolved);

          const builder: Range<Decoration>[] = [];
          const doc = view.state.doc;

          for (const pl of activePlacements) {
            const block = blocks.find((b) => b.paragraph_index === pl.paragraphIndex);
            if (!block) continue;

            const comment = pl.comment;

            const lineNum = block.line_number ?? 1;
            const startLine = Math.max(1, lineNum - 10);
            const endLine = Math.min(doc.lines, lineNum + 30);

            for (let l = startLine; l <= endLine; l++) {
              const line = doc.line(l);
              const idx = line.text.indexOf(comment.anchor_text);
              if (idx !== -1) {
                const from = line.from + idx;
                const to = from + comment.anchor_text.length;

                builder.push(
                  Decoration.mark({
                    class: 'md-comments-highlight',
                    attributes: {
                      'data-comment-id': comment.id,
                    },
                  }).range(from, to)
                );
                break;
              }
            }
          }

          // Sort decorations by starting position (required by CodeMirror)
          builder.sort((a, b) => a.from - b.from);
          this.decorations = Decoration.set(builder);
        } catch (e) {
          console.error('[md-comments] failed to update Live Preview decorations', e);
          this.decorations = Decoration.none;
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown(e, _view) {
          const target = e.target as HTMLElement;
          if (target && target.classList.contains('md-comments-highlight')) {
            const commentId = target.getAttribute('data-comment-id');
            if (commentId) {
              e.preventDefault();
              e.stopPropagation();
              onOpenComment(commentId);
            }
          }
        },
      },
    }
  );
}
