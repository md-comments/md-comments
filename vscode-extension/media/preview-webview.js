(function () {
  const vscode = acquireVsCodeApi();
  let mdPath = document.body.getAttribute('data-md-md-path') || '';
  let reanchorCommentId = null;
  let anchorBlocks = null;
  let selectionTimer = null;
  let pendingAnchor = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

  function getCurrentAuthor() {
    const footer = document.querySelector('.md-comments-footer');
    return (footer && footer.getAttribute('data-md-current-author')) || 'You';
  }

  function getAuthorInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || '?').toUpperCase();
  }

  function insertOptimisticCard(author, body, anchor, isPage) {
    const targetList = document.getElementById(isPage ? 'page-threads' : 'inline-threads');
    if (!targetList) return;

    const empty = targetList.querySelector('.md-comments-empty-state, .empty-state');
    if (empty) empty.remove();

    const tempId = 'optimistic-' + Date.now();
    const initials = escapeHtml(getAuthorInitials(author));
    const quoteHtml =
      !isPage && anchor && anchor.text
        ? '<blockquote class="md-comments-quote" data-md-quote="true">' +
          (anchor.heading
            ? '<div class="md-comments-quote-heading">' + escapeHtml(anchor.heading) + '</div>'
            : '') +
          '<div class="md-comments-quote-text">' +
          escapeHtml(anchor.text) +
          '</div></blockquote>'
        : '';

    const article = document.createElement('article');
    article.className = 'md-comments-sidebar-thread md-comments-thread-optimistic';
    article.setAttribute('data-md-comment-id', tempId);

    article.innerHTML =
      quoteHtml +
      '<div class="md-comments-card md-comments-card-optimistic" data-md-comment-id="' +
      tempId +
      '" data-md-type="' +
      (isPage ? 'page' : 'inline') +
      '">' +
      '<div class="md-comments-thread-row md-comments-thread-root">' +
      '<div class="md-comments-avatar-wrap">' +
      '<div class="md-comments-avatar md-comments-avatar-fallback-only" aria-hidden="true">' +
      '<span class="md-comments-avatar-fallback">' +
      initials +
      '</span>' +
      '</div>' +
      '</div>' +
      '<div class="md-comments-thread-content">' +
      '<div class="md-comments-meta">' +
      (isPage ? '<span class="md-comments-badge md-comments-type-label">Page comment</span>' : '') +
      '<span class="md-comments-author">' +
      escapeHtml(author) +
      '</span>' +
      '<span class="md-comments-time">Just now</span>' +
      '<span class="md-comments-badge" style="opacity:0.7; font-style:italic;">Saving…</span>' +
      '</div>' +
      '<div class="md-comments-body">' +
      escapeHtml(body) +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    targetList.prepend(article);

    const countEl = document.querySelector(isPage ? '.page-tab-count' : '.inline-tab-count');
    if (countEl) {
      const current = parseInt(countEl.textContent || '0', 10);
      countEl.textContent = String(current + 1);
    }

    const fabBadge = document.querySelector('#md-comments-panel-fab .badge-count');
    const layout = document.getElementById('md-comments-layout');
    if (layout) {
      const current = parseInt(layout.getAttribute('data-md-thread-count') || '0', 10);
      layout.setAttribute('data-md-thread-count', String(current + 1));
      if (fabBadge) {
        fabBadge.textContent = String(current + 1);
        fabBadge.style.display = 'inline-block';
      }
    }

    if (!isPage && anchor && anchor.index !== undefined) {
      const targetP = document.querySelector('[data-md-paragraph-index="' + anchor.index + '"]');
      if (targetP) {
        targetP.classList.add('md-comments-paragraph-marked');
      }
    }
  }

  function insertOptimisticReply(cardEl, rootId, body, _type) {
    if (!cardEl) return;
    let block = cardEl.querySelector('.md-comments-replies-block');
    let list = cardEl.querySelector('.md-comments-replies-list');
    if (!block || !list) {
      block = document.createElement('div');
      block.className = 'md-comments-replies-block';
      block.setAttribute('data-md-root-id', rootId);
      block.setAttribute('data-md-reply-count', '1');
      list = document.createElement('div');
      list.className = 'md-comments-replies-list';
      list.setAttribute('data-md-replies-panel', 'true');
      block.appendChild(list);
      const comp = cardEl.querySelector(
        '.reply-composer, .md-comments-reply-composer, .md-comments-panel-composer'
      );
      if (comp) {
        cardEl.insertBefore(block, comp);
      } else {
        cardEl.appendChild(block);
      }
      cardEl.classList.add('md-comments-card-has-replies');
    }

    const author = getCurrentAuthor();
    const initials = escapeHtml(getAuthorInitials(author));
    const replyEl = document.createElement('div');
    replyEl.className = 'md-comments-reply md-comments-reply-optimistic';
    replyEl.innerHTML =
      '<div class="md-comments-thread-row">' +
      '<div class="md-comments-avatar md-comments-avatar-fallback-only" aria-hidden="true">' +
      '<span class="md-comments-avatar-fallback">' +
      initials +
      '</span>' +
      '</div>' +
      '<div class="md-comments-thread-content">' +
      '<div class="md-comments-meta">' +
      '<span class="md-comments-author">' +
      escapeHtml(author) +
      '</span>' +
      '<span class="md-comments-time">Just now</span>' +
      '<span class="md-comments-badge" style="opacity:0.7; font-style:italic;">Saving…</span>' +
      '</div>' +
      '<div class="md-comments-body">' +
      escapeHtml(body) +
      '</div>' +
      '</div>' +
      '</div>';
    list.appendChild(replyEl);

    const currentCount = parseInt(block.getAttribute('data-md-reply-count') || '0', 10);
    block.setAttribute('data-md-reply-count', String(currentCount + 1));
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    }
  }

  function clearPendingAnchorHighlight() {
    document
      .querySelectorAll('.md-comments-text-anchor.pending, [data-md-pending="true"]')
      .forEach(function (node) {
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
    let targetP = null;

    if (anchor.index !== undefined) {
      targetP = document.querySelector('[data-md-paragraph-index="' + anchor.index + '"]');
      if (!targetP) {
        const paragraphs = document.querySelectorAll(BLOCK_SELECTOR);
        targetP = paragraphs[Number(anchor.index)] || null;
      }
    }

    if (!targetP) return;

    const walker = document.createTreeWalker(targetP, NodeFilter.SHOW_TEXT, null);
    let textNode = null;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentNode;
      if (
        parent &&
        (parent.classList.contains('md-comments-text-anchor') ||
          parent.classList.contains('md-comments-para-actions'))
      ) {
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
      if (pendingAnchor) {
        applyPendingAnchorHighlight(pendingAnchor);
        showSidebarNewCommentComposer(pendingAnchor, false);
      }
    });
  }

  function removePanelComposers() {
    document.querySelectorAll('.md-comments-panel-composer').forEach(function (el) {
      el.remove();
    });
  }

  function showInlineCardReplyComposer(target, id, type) {
    removePanelComposers();
    const rootEl = target.closest('.md-comments-card');
    if (!rootEl) {
      return;
    }

    const composer = document.createElement('div');
    composer.className = 'md-comments-panel-composer';
    composer.innerHTML =
      '<div class="md-comments-editor-shell">' +
      '<textarea class="md-comments-editor-input" rows="3" placeholder="Write a reply… Use @username to mention."></textarea>' +
      '</div>' +
      '<div class="md-comments-composer-footer">' +
      '<button type="button" class="md-comments-btn-primary" data-action="submit">Add comment</button>' +
      '<button type="button" class="md-comments-btn-text" data-action="cancel">Cancel</button>' +
      '</div>';

    rootEl.appendChild(composer);
    const textarea = composer.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }

    composer.querySelector('[data-action="cancel"]').addEventListener('click', function () {
      composer.remove();
    });
    composer.querySelector('[data-action="submit"]').addEventListener('click', function () {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        return;
      }
      insertOptimisticReply(rootEl, id, body, type);
      if (window.mdCommentsMarkReplySubmitted) {
        window.mdCommentsMarkReplySubmitted();
      }
      postAction({ action: 'reply', rootId: id, type: type, body: body });
      composer.remove();
    });
  }

  function showInlineCardEditComposer(target, id, rootId, type, kind, initialBody) {
    removePanelComposers();
    const itemEl = target.closest('.md-comments-reply, .md-comments-card');
    if (!itemEl) {
      return;
    }

    const bodyEl = itemEl.querySelector('.md-comments-body');
    if (bodyEl) {
      bodyEl.style.display = 'none';
    }

    const composer = document.createElement('div');
    composer.className = 'md-comments-panel-composer';
    composer.innerHTML =
      '<div class="md-comments-editor-shell">' +
      '<textarea class="md-comments-editor-input" rows="3"></textarea>' +
      '</div>' +
      '<div class="md-comments-composer-footer">' +
      '<button type="button" class="md-comments-btn-primary" data-action="submit">Save</button>' +
      '<button type="button" class="md-comments-btn-text" data-action="cancel">Cancel</button>' +
      '</div>';

    itemEl.appendChild(composer);
    const textarea = composer.querySelector('textarea');
    if (textarea) {
      textarea.value = initialBody;
      textarea.focus();
    }

    function cleanup() {
      composer.remove();
      if (bodyEl) {
        bodyEl.style.display = '';
      }
    }

    composer.querySelector('[data-action="cancel"]').addEventListener('click', cleanup);
    composer.querySelector('[data-action="submit"]').addEventListener('click', function () {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        return;
      }
      postAction({
        action: 'edit',
        id: id,
        rootId: rootId,
        type: type,
        kind: kind,
        body: body,
      });
      cleanup();
    });
  }

  function showSidebarNewCommentComposer(anchor, isPage) {
    removeOverlays();
    removePanelComposers();
    document.dispatchEvent(
      new CustomEvent('md-comments:open-sidebar', { detail: { commentId: null } })
    );

    if (window.mdCommentsActivateTab) {
      window.mdCommentsActivateTab(isPage ? 'page' : 'inline');
    }

    const panelId = isPage ? 'md-comments-sidebar-page' : 'md-comments-sidebar-inline';
    const panelEl =
      document.getElementById(panelId) ||
      document.getElementById(isPage ? 'tab-page' : 'tab-inline') ||
      document.querySelector(isPage ? '[data-panel="page"]' : '[data-panel="inline"]') ||
      document.querySelector('.md-comments-tab-panel-active');
    if (!panelEl) {
      return;
    }

    const composer = document.createElement('div');
    composer.className = 'md-comments-panel-composer md-comments-new-comment-composer';
    const quoteHtml =
      anchor && anchor.text
        ? '<div class="md-comments-quote-excerpt">"' + escapeHtml(anchor.text) + '"</div>'
        : '';
    composer.innerHTML =
      quoteHtml +
      '<div class="md-comments-editor-shell">' +
      '<textarea class="md-comments-editor-input" rows="3" placeholder="Add a comment… Use @username to mention."></textarea>' +
      '</div>' +
      '<div class="md-comments-composer-footer">' +
      '<button type="button" class="md-comments-btn-primary" data-action="submit">Add comment</button>' +
      '<button type="button" class="md-comments-btn-text" data-action="cancel">Cancel</button>' +
      '</div>';

    panelEl.prepend(composer);
    const textarea = composer.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }

    composer.querySelector('[data-action="cancel"]').addEventListener('click', function () {
      composer.remove();
    });
    composer.querySelector('[data-action="submit"]').addEventListener('click', function () {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        return;
      }
      if (isPage) {
        insertOptimisticCard(getCurrentAuthor(), body, null, true);
        postAction({ action: 'addPage', body: body });
      } else if (anchor) {
        insertOptimisticCard(getCurrentAuthor(), body, anchor, false);
        postAction({
          action: 'add',
          body: body,
          index: String(anchor.index),
          hash: anchor.hash,
          text: anchor.text,
          heading: anchor.heading,
          occurrence: anchor.occurrence !== undefined ? String(anchor.occurrence) : undefined,
        });
      }
      composer.remove();
    });
  }

  const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, tr, blockquote, details, summary';

  function findParagraphFromNode(node) {
    if (!node) {
      return null;
    }
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) {
      return null;
    }
    const tagged = el.closest('[data-md-paragraph-index]');
    if (tagged) {
      return tagged;
    }
    const tr = el.closest('tr');
    if (tr) {
      return tr;
    }
    return el?.closest?.(BLOCK_SELECTOR) || null;
  }

  function getSelectedText(range) {
    return (range.toString() || '').replace(/\s+/g, ' ').trim();
  }

  function findOccurrenceIndex(fullText, searchText, charOffset) {
    if (!fullText || !searchText) return 0;
    const escaped = searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = escaped.replace(/\s+/g, '\\s+');
    let regex;
    try {
      // eslint-disable-next-line security/detect-non-literal-regexp
      regex = new RegExp(pattern, 'gi');
    } catch {
      return 0;
    }
    const matchIndices = [];
    let match;
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

  function getAnchorFromSelection(range, p) {
    const base = getAnchorFromParagraph(p);
    const selected = getSelectedText(range);
    if (!selected) {
      return base;
    }
    let charOffset = 0;
    try {
      const preRange = document.createRange();
      preRange.selectNodeContents(p);
      preRange.setEnd(range.startContainer, range.startOffset);
      charOffset = preRange.toString().length;
    } catch {
      charOffset = 0;
    }
    const occurrence = findOccurrenceIndex(p.textContent || '', selected, charOffset);
    return {
      index: base.index,
      hash: base.hash,
      text: selected,
      heading: base.heading,
      occurrence: occurrence,
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
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    if (Array.isArray(blocks) && blocks.length > 0) {
      const lowerText = text.toLowerCase();
      const matchedBlock = blocks.find(function (b) {
        const bText = (b.anchor_text || '').toLowerCase();
        return (
          bText === lowerText ||
          bText.includes(lowerText) ||
          (lowerText.length >= 12 && lowerText.includes(bText))
        );
      });
      if (matchedBlock) {
        return {
          index: String(matchedBlock.paragraph_index),
          hash: matchedBlock.anchor_hash,
          text: matchedBlock.anchor_text,
          heading: matchedBlock.heading_context || '',
        };
      }
    }
    const paragraphs = document.querySelectorAll(BLOCK_SELECTOR);
    const domIndex = Array.prototype.indexOf.call(paragraphs, p);
    const block = blocks ? blocks[domIndex] : null;
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
      text: text,
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

  document.addEventListener('md-comments:submit-page', function (e) {
    if (e.detail && e.detail.body) {
      insertOptimisticCard(getCurrentAuthor(), e.detail.body, null, true);
      postAction({ action: 'addPage', body: e.detail.body });
    }
  });

  document.addEventListener('md-comments:submit-reply', function (e) {
    if (e.detail && e.detail.body) {
      const card = document.querySelector(
        '.md-comments-card[data-md-comment-id="' + e.detail.rootId + '"]'
      );
      if (card) {
        insertOptimisticReply(card, e.detail.rootId, e.detail.body, e.detail.type || 'inline');
      }
      postAction({
        action: 'reply',
        rootId: e.detail.rootId,
        type: e.detail.type || 'inline',
        body: e.detail.body,
      });
    }
  });

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

    if (action === 'submit-page') {
      const composer = target.closest('.page-composer, .md-comments-page-composer');
      const ta = composer && composer.querySelector('.page-textarea');
      const body = ta ? ta.value.trim() : '';
      if (body) {
        target.classList.add('loading');
        target.disabled = true;
        insertOptimisticCard(getCurrentAuthor(), body, null, true);
        if (ta) ta.value = '';
        setTimeout(function () {
          target.classList.remove('loading');
          target.disabled = false;
        }, 4000);
        postAction({ action: 'addPage', body: body });
      }
      return;
    }

    if (action === 'submit-reply') {
      const card = target.closest('.md-comments-card');
      const rootId =
        target.getAttribute('data-md-id') || (card && card.getAttribute('data-md-comment-id'));
      const type =
        target.getAttribute('data-md-type') ||
        (card && card.getAttribute('data-md-type')) ||
        'inline';
      const wrapper = target.closest('.reply-composer-wrapper, .md-comments-reply-wrapper');
      const ta = wrapper && wrapper.querySelector('.fallback-reply-textarea');
      const body = ta ? ta.value.trim() : '';
      if (body && rootId) {
        target.classList.add('loading');
        target.disabled = true;
        if (card) {
          insertOptimisticReply(card, rootId, body, type);
        }
        if (ta) ta.value = '';
        if (wrapper) wrapper.style.display = 'none';
        const replyInput = card && card.querySelector('.reply-input');
        if (replyInput) replyInput.style.display = 'block';
        setTimeout(function () {
          target.classList.remove('loading');
          target.disabled = false;
        }, 4000);
        if (window.mdCommentsPrepareReplyNav) {
          window.mdCommentsPrepareReplyNav(rootId, type === 'page' ? 'page' : 'inline');
        }
        if (window.mdCommentsMarkReplySubmitted) {
          window.mdCommentsMarkReplySubmitted();
        }
        postAction({ action: 'reply', rootId: rootId, type: type, body: body });
      }
      return;
    }

    if (action === 'cancel-reply') {
      const card = target.closest('.md-comments-card');
      if (card) {
        const replyInput = card.querySelector('.reply-input');
        const replyWrapper = card.querySelector('.reply-composer-wrapper');
        const ta = card.querySelector('.fallback-reply-textarea');
        if (ta) ta.value = '';
        if (replyWrapper) replyWrapper.style.display = 'none';
        if (replyInput) replyInput.style.display = 'block';
      }
      return;
    }

    if (action === 'refresh') {
      const refreshBtn = target.closest('button');
      if (refreshBtn) {
        refreshBtn.classList.add('is-refreshing');
        setTimeout(() => refreshBtn.classList.remove('is-refreshing'), 1000);
      }
      postAction({ action: 'refresh' });
      return;
    }

    if (action === 'addPage') {
      showSidebarNewCommentComposer(null, true);
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
      showInlineCardEditComposer(target, id, rootId, type, kind, initialBody);
      return;
    }

    if (action === 'reply') {
      const id = target.getAttribute('data-md-id');
      const type = target.getAttribute('data-md-type') || 'inline';
      const tab = window.mdCommentsTabForReply && window.mdCommentsTabForReply(target, type);
      if (window.mdCommentsPrepareReplyNav && tab) {
        window.mdCommentsPrepareReplyNav(id, tab);
      }
      showInlineCardReplyComposer(target, id, type);
      return;
    }

    if (action === 'resolve') {
      const card = target.closest('.md-comments-card');
      if (card) {
        card.classList.add('md-comments-card-resolved');
        const meta = card.querySelector('.md-comments-meta');
        if (meta && !meta.querySelector('.md-comments-badge-resolved')) {
          const badge = document.createElement('span');
          badge.className = 'md-comments-badge resolved md-comments-badge-resolved';
          badge.textContent = 'Resolved';
          meta.appendChild(badge);
        }
      }
      postAction({
        action: 'resolve',
        id: target.getAttribute('data-md-id'),
        type: target.getAttribute('data-md-type') || 'inline',
      });
      return;
    }

    if (action === 'unresolve') {
      const card = target.closest('.md-comments-card');
      if (card) {
        card.classList.remove('md-comments-card-resolved');
        const badge = card.querySelector('.md-comments-badge-resolved');
        if (badge) badge.remove();
      }
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
        target.closest('[data-md-paragraph-index]') ||
        (idx ? document.querySelector('[data-md-paragraph-index="' + idx + '"]') : null);
      if (p) {
        const anchor = getAnchorFromParagraph(p);
        showSidebarNewCommentComposer(anchor, false);
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

  function applyCommentsUpdate(bodyHtml) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(bodyHtml, 'text/html');

      // 1. Update sidebar body if not currently typing in a composer
      const newSidebarBody = doc.querySelector('.md-comments-sidebar-body');
      const curSidebarBody = document.querySelector('.md-comments-sidebar-body');
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') &&
        curSidebarBody &&
        curSidebarBody.contains(activeEl);

      if (newSidebarBody && curSidebarBody && !isTyping) {
        curSidebarBody.innerHTML = newSidebarBody.innerHTML;
      }

      // 2. Update thread count attribute & FAB badge
      const newLayout = doc.querySelector('#md-comments-layout');
      const curLayout = document.querySelector('#md-comments-layout');
      if (newLayout && curLayout) {
        const newCount = newLayout.getAttribute('data-md-thread-count') || '0';
        curLayout.setAttribute('data-md-thread-count', newCount);
        const fabBadge = document.querySelector('#md-comments-panel-fab .badge-count');
        if (fabBadge) {
          fabBadge.textContent = newCount;
          const count = parseInt(newCount, 10);
          fabBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
      }

      // 3. Update tabs counts
      ['inline', 'page'].forEach(function (tab) {
        const newTabCount = doc.querySelector('.' + tab + '-tab-count');
        const curTabCount = document.querySelector('.' + tab + '-tab-count');
        if (newTabCount && curTabCount) {
          curTabCount.textContent = newTabCount.textContent;
        }
      });

      // 4. Update footer data attributes
      const newFooter = doc.querySelector('.md-comments-footer');
      const curFooter = document.querySelector('.md-comments-footer');
      if (newFooter && curFooter) {
        Array.from(newFooter.attributes).forEach(function (attr) {
          curFooter.setAttribute(attr.name, attr.value);
        });
        anchorBlocks = null;
      }

      // 5. Update marked paragraphs in document without touching text nodes
      const markedIndexes = new Set();
      doc.querySelectorAll('.md-comments-paragraph-marked').forEach(function (el) {
        const idx = el.getAttribute('data-md-paragraph-index');
        if (idx !== null) {
          markedIndexes.add(idx);
        }
      });

      document
        .querySelectorAll('.md-comments-document [data-md-paragraph-index]')
        .forEach(function (p) {
          const idx = p.getAttribute('data-md-paragraph-index');
          const shouldBeMarked = idx !== null && markedIndexes.has(idx);
          p.classList.toggle('md-comments-paragraph-marked', shouldBeMarked);
        });
    } catch (err) {
      console.error('[md-comments] failed to apply in-place comments update:', err);
    }
  }

  window.addEventListener('message', function (event) {
    const msg = event.data;
    if (!msg) {
      return;
    }
    if (msg.type === 'updateComments' && msg.bodyHtml) {
      applyCommentsUpdate(msg.bodyHtml);
    }
  });
})();
