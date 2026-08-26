(function () {
  const vscode = acquireVsCodeApi();
  let mdPath = document.body.getAttribute('data-md-md-path') || '';
  let reanchorCommentId = null;
  let anchorBlocks = null;
  let selectionTimer = null;
  let pendingAnchor = null;
  let pendingRect = null;

  function getMdPath() {
    const footer = document.querySelector('.md-comments-footer');
    if (footer) {
      const p = footer.getAttribute('data-md-md-path') || '';
      if (p) {
        mdPath = p;
      }
    }
    return mdPath || document.body.getAttribute('data-md-md-path') || '';
  }

  function loadAnchorBlocks() {
    if (anchorBlocks) {
      return anchorBlocks;
    }
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) {
      return [];
    }
    const raw = footer.getAttribute('data-code');
    if (!raw) {
      return [];
    }
    try {
      anchorBlocks = JSON.parse(atob(raw));
      return anchorBlocks;
    } catch {
      return [];
    }
  }

  function postAction(payload) {
    const md = getMdPath();
    if (!md) {
      console.error('[md-comments] missing md path');
      return;
    }
    vscode.postMessage(Object.assign({ md: md }, payload));
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    }
  }

  function clearPendingAnchorHighlight() {
    document.querySelectorAll('.md-comments-text-anchor.pending, [data-md-pending="true"]').forEach(function (node) {
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        parent.normalize();
      }
    });
  }

  function applyPendingAnchorHighlight(anchor) {
    clearPendingAnchorHighlight();
    if (!anchor || !anchor.text || !anchor.text.trim()) return;

    const searchText = anchor.text.replace(/\s+/g, ' ').trim();
    const paragraphs = document.querySelectorAll('p');
    let targetP = null;

    if (anchor.index !== undefined) {
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (p.getAttribute('data-md-paragraph-index') === String(anchor.index)) {
          targetP = p;
          break;
        }
      }
      if (!targetP && paragraphs[Number(anchor.index)]) {
        targetP = paragraphs[Number(anchor.index)];
      }
    }

    if (!targetP) return;

    const walker = document.createTreeWalker(targetP, NodeFilter.SHOW_TEXT, null);
    let textNode = null;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentNode;
      if (parent && (parent.classList.contains('md-comments-text-anchor') || parent.classList.contains('md-comments-para-actions'))) {
        continue;
      }
      const val = textNode.nodeValue || '';
      const idx = val.indexOf(searchText);
      if (idx !== -1) {
        const before = val.slice(0, idx);
        const matchText = val.slice(idx, idx + searchText.length);
        const after = val.slice(idx + searchText.length);

        const span = document.createElement('span');
        span.className = 'md-comments-text-anchor pending';
        span.setAttribute('data-md-pending', 'true');
        span.textContent = matchText;

        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));

        parent.replaceChild(frag, textNode);
        break;
      }
    }
  }

  function removeOverlays() {
    clearPendingAnchorHighlight();
    removeEl('md-comments-selection-bar');
    removeEl('md-comments-composer');
    removeEl('md-comments-emoji-popover');
    removeEl('md-comments-backdrop');
  }

  function showSelectionBar(rect) {
    removeEl('md-comments-selection-bar');
    const bar = document.createElement('div');
    bar.id = 'md-comments-selection-bar';
    bar.className = 'md-comments-selection-bar';
    bar.innerHTML =
      '<button type="button" class="md-comments-selection-btn" data-bar-action="comment">' +
      '<span class="md-comments-icon-comment" aria-hidden="true"></span> Comment</button>';
    document.body.appendChild(bar);
    bar.style.top = Math.max(8, rect.top + window.scrollY - bar.offsetHeight - 10) + 'px';
    bar.style.left =
      Math.max(8, rect.left + window.scrollX + rect.width / 2 - bar.offsetWidth / 2) + 'px';
    bar.querySelector('[data-bar-action="comment"]').addEventListener('click', function (e) {
      e.preventDefault();
      removeEl('md-comments-selection-bar');
      if (pendingAnchor && pendingRect) {
        showInlineComposer(pendingRect, pendingAnchor);
      }
    });
  }

  function showInlineComposer(rect, anchor, options) {
    options = options || {};
    removeOverlays();
    if (anchor) {
      applyPendingAnchorHighlight(anchor);
    }
    const submitLabel = options.submitLabel || 'Add comment';
    const onSubmit = options.onSubmit;

    const box = document.createElement('div');
    box.id = 'md-comments-composer';
    box.className = 'md-comments-composer md-comments-composer-inline';
    box.innerHTML =
      '<div class="md-comments-composer-layout">' +
      '<div class="md-comments-composer-main">' +
      '<div class="md-comments-editor-shell">' +
      '<textarea class="md-comments-editor-input" rows="4" placeholder="Add a comment… Use @username to mention someone on GitHub."></textarea>' +
      '</div>' +
      '<div class="md-comments-composer-footer">' +
      '<button type="button" class="md-comments-btn-primary" data-action="submit">' +
      submitLabel +
      '</button>' +
      '<button type="button" class="md-comments-btn-text" data-action="cancel">Cancel</button>' +
      '</div></div></div>';
    document.body.appendChild(box);

    if (options.modal) {
      box.classList.add('md-comments-composer-modal');
      const backdrop = document.createElement('div');
      backdrop.className = 'md-comments-backdrop';
      backdrop.id = 'md-comments-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', removeOverlays);
    } else {
      box.style.top =
        Math.min(rect.bottom + window.scrollY + 12, window.scrollY + window.innerHeight - 280) +
        'px';
      box.style.left =
        Math.min(
          Math.max(8, rect.left + window.scrollX - 40),
          window.scrollX + window.innerWidth - 420
        ) + 'px';
    }

    const textarea = box.querySelector('textarea');
    if (options.initialBody) {
      textarea.value = options.initialBody;
    }
    textarea.focus();

    function finishSubmit(body) {
      if (onSubmit) {
        onSubmit(body);
      } else if (anchor) {
        postAction({
          action: 'add',
          body: body,
          index: String(anchor.index),
          hash: anchor.hash,
          text: anchor.text,
          heading: anchor.heading,
        });
      }
      removeOverlays();
      window.getSelection()?.removeAllRanges();
    }

    box.querySelector('[data-action="cancel"]').addEventListener('click', function () {
      if (window.mdCommentsClearReplyNav) {
        window.mdCommentsClearReplyNav();
      }
      removeOverlays();
    });
    box.querySelector('[data-action="submit"]').addEventListener('click', function () {
      const body = textarea.value.trim();
      if (!body) {
        return;
      }
      finishSubmit(body);
    });
  }

  function showPromptComposer(title, submitLabel, onSubmit, extraOptions) {
    const opts = extraOptions || {};
    opts.modal = true;
    opts.submitLabel = submitLabel;
    opts.onSubmit = onSubmit;
    showInlineComposer({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }, null, opts);
  }

  function findParagraphFromNode(node) {
    if (!node) {
      return null;
    }
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return el?.closest?.('p') || null;
  }

  function getSelectedText(range) {
    return (range.toString() || '').replace(/\s+/g, ' ').trim();
  }

  function getAnchorFromSelection(range, p) {
    const base = getAnchorFromParagraph(p);
    const selected = getSelectedText(range);
    if (!selected) {
      return base;
    }
    return {
      index: base.index,
      hash: base.hash,
      text: selected,
      heading: base.heading,
    };
  }

  function getAnchorFromParagraph(p) {
    const idxAttr = p.getAttribute('data-md-paragraph-index');
    const hashAttr = p.getAttribute('data-md-anchor-hash');
    if (idxAttr !== null && hashAttr) {
      return {
        index: idxAttr,
        hash: hashAttr,
        text: p.getAttribute('data-md-anchor-text') || p.textContent || '',
        heading: p.getAttribute('data-md-heading') || '',
      };
    }
    const blocks = loadAnchorBlocks();
    const paragraphs = document.querySelectorAll('p');
    const domIndex = Array.prototype.indexOf.call(paragraphs, p);
    const block = blocks[domIndex];
    if (block) {
      return {
        index: String(block.paragraph_index),
        hash: block.anchor_hash,
        text: block.anchor_text,
        heading: block.heading_context || '',
      };
    }
    return {
      index: String(domIndex >= 0 ? domIndex : 0),
      hash: '',
      text: (p.textContent || '').replace(/\s+/g, ' ').trim(),
      heading: '',
    };
  }

  function handleTextSelection() {
    if (reanchorCommentId || document.getElementById('md-comments-composer')) {
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      removeEl('md-comments-selection-bar');
      return;
    }
    const range = sel.getRangeAt(0);
    const p = findParagraphFromNode(range.commonAncestorContainer);
    if (!p) {
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return;
    }
    pendingAnchor = getAnchorFromSelection(range, p);
    pendingRect = rect;
    showSelectionBar(rect);
  }

  function scheduleSelectionCheck() {
    if (selectionTimer) {
      clearTimeout(selectionTimer);
    }
    selectionTimer = setTimeout(function () {
      selectionTimer = null;
      handleTextSelection();
    }, 100);
  }

  document.addEventListener('selectionchange', scheduleSelectionCheck);
  document.addEventListener('mouseup', scheduleSelectionCheck);

  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-md-action]');
    if (!target) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const action = target.getAttribute('data-md-action');

    if (action === 'toggle-replies') {
      if (window.mdCommentsToggleReplies) {
        window.mdCommentsToggleReplies(target);
      }
      return;
    }

    if (action === 'addPage') {
      showPromptComposer('Page comment', 'Add comment', function (body) {
        postAction({ action: 'addPage', body: body });
      });
      return;
    }
    if (action === 'edit') {
      const id = target.getAttribute('data-md-id');
      const rootId = target.getAttribute('data-md-root-id') || id;
      const type = target.getAttribute('data-md-type') || 'inline';
      const kind = target.getAttribute('data-md-kind') || 'root';
      const initialBody = window.mdCommentsExtractEditBody
        ? window.mdCommentsExtractEditBody(target)
        : '';
      showPromptComposer(
        'Edit comment',
        'Save',
        function (body) {
          postAction({
            action: 'edit',
            id: id,
            rootId: rootId,
            type: type,
            kind: kind,
            body: body,
          });
        },
        { initialBody: initialBody }
      );
      return;
    }
    if (action === 'reply') {
      const id = target.getAttribute('data-md-id');
      const type = target.getAttribute('data-md-type') || 'inline';
      const tab = window.mdCommentsTabForReply && window.mdCommentsTabForReply(target, type);
      if (window.mdCommentsPrepareReplyNav && tab) {
        window.mdCommentsPrepareReplyNav(id, tab);
      }
      showPromptComposer('Reply', 'Add comment', function (body) {
        if (window.mdCommentsMarkReplySubmitted) {
          window.mdCommentsMarkReplySubmitted();
        }
        postAction({ action: 'reply', rootId: id, type: type, body: body });
      });
      return;
    }
    if (action === 'resolve') {
      postAction({
        action: 'resolve',
        id: target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
      });
      return;
    }
    if (action === 'unresolve') {
      postAction({
        action: 'unresolve',
        id: target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
      });
      return;
    }
    if (action === 'delete') {
      postAction({
        action: 'delete',
        id: target.getAttribute('data-md-id'),
        rootId: target.getAttribute('data-md-root-id') || target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
        kind: target.getAttribute('data-md-kind') || 'root',
      });
      return;
    }
    if (action === 'comment-paragraph') {
      const idx = target.getAttribute('data-md-id');
      const p =
        target.closest('p[data-md-paragraph-index]') ||
        (idx ? document.querySelector('p[data-md-paragraph-index="' + idx + '"]') : null);
      if (p) {
        const anchor = getAnchorFromParagraph(p);
        showInlineComposer(target.getBoundingClientRect(), anchor);
        document.dispatchEvent(
          new CustomEvent('md-comments:open-sidebar', { detail: { commentId: null } })
        );
      }
      return;
    }
    if (action === 'react-picker') {
      const rootId = target.getAttribute('data-md-root-id') || target.getAttribute('data-md-id');
      const targetId = target.getAttribute('data-md-target-id') || rootId;
      if (window.mdCommentsShowEmojiPicker) {
        window.mdCommentsShowEmojiPicker(
          rootId,
          target.getAttribute('data-md-type') || 'inline',
          target.getAttribute('data-md-kind') || 'root',
          targetId,
          target.getBoundingClientRect(),
          postAction
        );
      }
      return;
    }
    if (action === 'react') {
      postAction({
        action: 'react',
        targetId: target.getAttribute('data-md-target'),
        rootId: target.getAttribute('data-md-root'),
        type: target.getAttribute('data-md-type'),
        kind: target.getAttribute('data-md-kind') || 'root',
        emoji: target.getAttribute('data-md-emoji') || '',
      });
    }
    if (action === 'reanchor-start') {
      reanchorCommentId = target.getAttribute('data-md-id');
      document.body.setAttribute('data-md-reanchor-mode', reanchorCommentId);
    }
  });

  document.addEventListener(
    'click',
    function (e) {
      if (!reanchorCommentId) {
        return;
      }
      const p = e.target.closest('p');
      if (!p) {
        return;
      }
      e.preventDefault();
      const anchor = getAnchorFromParagraph(p);
      postAction({
        action: 'reanchor',
        id: reanchorCommentId,
        index: anchor.index,
        hash: anchor.hash,
        text: anchor.text,
        heading: anchor.heading,
      });
      reanchorCommentId = null;
      document.body.removeAttribute('data-md-reanchor-mode');
    },
    true
  );

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      reanchorCommentId = null;
      document.body.removeAttribute('data-md-reanchor-mode');
      removeOverlays();
    }
  });
})();
