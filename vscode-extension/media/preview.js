(function () {
  const COMMAND = 'mdComments.handlePreviewAction';
  let mdPath = '';
  let reanchorCommentId = null;
  let anchorBlocks = null;
  let selectionTimer = null;
  let pendingAnchor = null;
  let pendingRect = null;

  function getMdPath() {
    const footer = document.querySelector('.md-comments-footer');
    if (footer) {
      const fromFooter = footer.getAttribute('data-md-md-path') || '';
      if (fromFooter) {
        mdPath = fromFooter;
      }
    }
    return mdPath;
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

  function packPayload(obj) {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function sendAction(payload) {
    const md = getMdPath();
    if (!md) {
      console.error('[md-comments] Cannot save: missing markdown path in preview footer');
      return;
    }
    const message = Object.assign({ md: md }, payload);
    const packed = packPayload(message);
    const href = 'command:' + COMMAND + '?' + encodeURIComponent(JSON.stringify([packed]));
    let messenger = document.getElementById('md-comments-messenger');
    if (!messenger) {
      messenger = document.createElement('a');
      messenger.id = 'md-comments-messenger';
      messenger.style.display = 'none';
      messenger.setAttribute('aria-hidden', 'true');
      document.body.appendChild(messenger);
    }
    messenger.setAttribute('href', href);
    messenger.click();
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    }
  }

  function removeOverlays() {
    removeEl('md-comments-selection-bar');
    removeEl('md-comments-composer');
    removeEl('md-comments-emoji-popover');
  }

  function showSelectionBar(rect) {
    removeEl('md-comments-selection-bar');
    const bar = document.createElement('div');
    bar.id = 'md-comments-selection-bar';
    bar.className = 'md-comments-selection-bar';
    bar.innerHTML =
      '<button type="button" class="md-comments-selection-btn" data-bar-action="comment">' +
      '<span class="md-comments-icon-comment" aria-hidden="true"></span> Comment</button>' +
      '<button type="button" class="md-comments-selection-btn md-comments-selection-more" data-bar-action="more" title="More">⋯</button>';
    document.body.appendChild(bar);
    const top = rect.top + window.scrollY - bar.offsetHeight - 10;
    const left = rect.left + window.scrollX + rect.width / 2 - bar.offsetWidth / 2;
    bar.style.top = Math.max(8, top) + 'px';
    bar.style.left = Math.max(8, left) + 'px';

    bar.querySelector('[data-bar-action="comment"]').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeEl('md-comments-selection-bar');
      if (pendingAnchor && pendingRect) {
        showInlineComposer(pendingRect, pendingAnchor, 'inline');
      }
    });
    bar.querySelector('[data-bar-action="more"]').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeEl('md-comments-selection-bar');
      if (pendingAnchor && pendingRect) {
        showInlineComposer(pendingRect, pendingAnchor, 'inline');
      }
    });
  }

  function showInlineComposer(rect, anchor, mode, options) {
    options = options || {};
    removeOverlays();
    const submitLabel = options.submitLabel || 'Add comment';
    const onSubmit = options.onSubmit;

    const box = document.createElement('div');
    box.id = 'md-comments-composer';
    box.className = 'md-comments-composer md-comments-composer-inline';
    box.innerHTML =
      '<div class="md-comments-composer-layout">' +
      '<div class="md-comments-composer-main">' +
      '<div class="md-comments-editor-shell">' +
      '<div class="md-comments-editor-toolbar" aria-hidden="true">' +
      '<span class="md-comments-tb">Tt</span><span class="md-comments-tb">B</span><span class="md-comments-tb">≡</span><span class="md-comments-tb">@</span>' +
      '</div>' +
      '<textarea class="md-comments-editor-input" rows="4" placeholder="Add a comment… Use @username to mention someone on GitHub."></textarea>' +
      '</div>' +
      '<div class="md-comments-composer-footer">' +
      '<button type="button" class="md-comments-btn-primary" data-action="submit">' +
      submitLabel +
      '</button>' +
      '<button type="button" class="md-comments-btn-text" data-action="cancel">Cancel</button>' +
      '</div></div></div>';

    document.body.appendChild(box);

    if (mode === 'modal') {
      box.classList.add('md-comments-composer-modal');
      const backdrop = document.createElement('div');
      backdrop.className = 'md-comments-backdrop';
      backdrop.id = 'md-comments-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', removeOverlays);
    } else {
      const top = Math.min(
        rect.bottom + window.scrollY + 12,
        window.scrollY + window.innerHeight - 280
      );
      const left = Math.min(
        Math.max(8, rect.left + window.scrollX - 40),
        window.scrollX + window.innerWidth - 420
      );
      box.style.top = top + 'px';
      box.style.left = left + 'px';
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
        sendAction({
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

    box.querySelector('[data-action="cancel"]').addEventListener('click', function (e) {
      e.preventDefault();
      if (window.mdCommentsClearReplyNav) {
        window.mdCommentsClearReplyNav();
      }
      removeOverlays();
    });
    box.querySelector('[data-action="submit"]').addEventListener('click', function (e) {
      e.preventDefault();
      const body = textarea.value.trim();
      if (!body) {
        return;
      }
      finishSubmit(body);
    });
  }

  function showPromptComposer(title, submitLabel, onSubmit, extraOptions) {
    const opts = extraOptions || {};
    opts.title = title;
    opts.submitLabel = submitLabel;
    opts.onSubmit = onSubmit;
    showInlineComposer(
      { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 },
      null,
      'modal',
      opts
    );
  }

  function openEmojiPicker(target) {
    const rootId = target.getAttribute('data-md-root-id') || target.getAttribute('data-md-id');
    const targetId = target.getAttribute('data-md-target-id') || rootId;
    const picker = window.mdCommentsShowEmojiPicker;
    if (!picker) {
      return;
    }
    picker(
      rootId,
      target.getAttribute('data-md-type') || 'inline',
      target.getAttribute('data-md-kind') || 'root',
      targetId,
      target.getBoundingClientRect(),
      sendAction
    );
  }

  function findParagraphFromNode(node) {
    if (!node) {
      return null;
    }
    const el =
      node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : node.nodeType === Node.ELEMENT_NODE
          ? node
          : null;
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
    const textAttr = p.getAttribute('data-md-anchor-text');
    const headingAttr = p.getAttribute('data-md-heading');
    if (idxAttr !== null && hashAttr) {
      return {
        index: idxAttr,
        hash: hashAttr,
        text: textAttr || p.textContent || '',
        heading: headingAttr || '',
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
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      index: String(domIndex >= 0 ? domIndex : 0),
      hash: '',
      text: text,
      heading: '',
    };
  }

  function handleTextSelection() {
    if (reanchorCommentId) {
      return;
    }
    if (document.getElementById('md-comments-composer')) {
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      removeEl('md-comments-selection-bar');
      pendingAnchor = null;
      pendingRect = null;
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
    const action = target.getAttribute('data-md-action');
    e.preventDefault();
    e.stopPropagation();

    if (action === 'toggle-replies') {
      if (window.mdCommentsToggleReplies) {
        window.mdCommentsToggleReplies(target);
      }
      return;
    }

    if (action === 'addPage') {
      showPromptComposer('Page comment', 'Add comment', function (body) {
        sendAction({ action: 'addPage', body: body });
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
          sendAction({
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
        sendAction({ action: 'reply', rootId: id, type: type, body: body });
      });
      return;
    }

    if (action === 'resolve') {
      sendAction({
        action: 'resolve',
        id: target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
      });
      return;
    }

    if (action === 'unresolve') {
      sendAction({
        action: 'unresolve',
        id: target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
      });
      return;
    }

    if (action === 'delete') {
      const kind = target.getAttribute('data-md-kind') || 'root';
      const label = kind === 'reply' ? 'reply' : 'comment';
      if (!window.confirm('Delete this ' + label + ' permanently? This cannot be undone.')) {
        return;
      }
      sendAction({
        action: 'delete',
        id: target.getAttribute('data-md-id'),
        rootId: target.getAttribute('data-md-root-id') || target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
        kind: kind,
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
        showInlineComposer(target.getBoundingClientRect(), anchor, 'inline');
        document.dispatchEvent(
          new CustomEvent('md-comments:open-sidebar', { detail: { commentId: null } })
        );
      }
      return;
    }

    if (action === 'react-picker') {
      openEmojiPicker(target);
      return;
    }

    if (action === 'react') {
      sendAction({
        action: 'react',
        targetId: target.getAttribute('data-md-target'),
        rootId: target.getAttribute('data-md-root'),
        type: target.getAttribute('data-md-type'),
        kind: target.getAttribute('data-md-kind') || 'root',
        emoji: target.getAttribute('data-md-emoji') || '',
      });
      return;
    }

    if (action === 'reanchor-start') {
      reanchorCommentId = target.getAttribute('data-md-id');
      document.body.setAttribute('data-md-reanchor-mode', reanchorCommentId);
      return;
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
      sendAction({
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

  document.addEventListener('click', function (e) {
    if (
      e.target.closest('#md-comments-composer') ||
      e.target.closest('#md-comments-selection-bar') ||
      e.target.closest('[data-md-action]')
    ) {
      return;
    }
    if (!window.getSelection()?.toString()) {
      removeEl('md-comments-selection-bar');
    }
  });
})();
