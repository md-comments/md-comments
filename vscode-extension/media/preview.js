(function () {
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

  function getUriScheme() {
    const footer = document.querySelector('.md-comments-footer');
    return (footer && footer.getAttribute('data-md-uri-scheme')) || 'vscode';
  }

  function toBase64Url(str) {
    if (!str) return '';
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
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

  function getCurrentAuthor() {
    const footer = document.querySelector('.md-comments-footer');
    return (footer && footer.getAttribute('data-md-current-author')) || 'You';
  }

  function getCurrentAuthorDisplayName() {
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) return 'You';
    const nameAttr = footer.getAttribute('data-md-current-author-name');
    if (nameAttr && nameAttr.trim()) {
      return nameAttr.trim();
    }
    const author = footer.getAttribute('data-md-current-author');
    if (author) {
      try {
        const names = JSON.parse(footer.getAttribute('data-md-display-names') || '{}');
        if (names[author]) {
          return names[author];
        }
      } catch (_err) {
        /* ignore */
      }
      return author;
    }
    return 'You';
  }

  function getAuthorInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || '?').toUpperCase();
  }

  function isGitHubLogin(login) {
    // eslint-disable-next-line security/detect-unsafe-regex
    return !!login && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(login);
  }

  const ICON_REPLY =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 17H5l-4-4 4-4h4M5 13h11.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-3.5-3.5H5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_RESOLVE =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_REOPEN =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_REACT =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.25 10.25h.01M14.75 10.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.25 14.25c.85 1.15 2 1.75 2.75 1.75s1.9-.6 2.75-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const ICON_DELETE =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_EDIT =
    '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildActionUri(payload) {
    const md = getMdPath();
    if (!md) return '';
    const scheme = getUriScheme();
    const query = new URLSearchParams();
    query.set('action', payload.action || '');
    query.set('md', md);
    if (payload.body) query.set('body', toBase64Url(payload.body));
    if (payload.text) query.set('text', toBase64Url(payload.text));
    if (payload.heading) query.set('heading', toBase64Url(payload.heading));
    if (payload.emoji) query.set('emoji', toBase64Url(payload.emoji));
    if (payload.hash) query.set('hash', payload.hash);
    if (payload.index !== undefined && payload.index !== null)
      query.set('index', String(payload.index));
    if (payload.occurrence !== undefined && payload.occurrence !== null)
      query.set('occurrence', String(payload.occurrence));
    if (payload.rootId) query.set('rootId', payload.rootId);
    if (payload.type) query.set('type', payload.type);
    if (payload.id) query.set('id', payload.id);
    if (payload.targetId) query.set('targetId', payload.targetId);
    if (payload.kind) query.set('kind', payload.kind);
    if (payload.confirmed) query.set('confirmed', 'true');
    query.set('_t', String(Date.now()));
    return scheme + '://md-comments.md-preview-comments/?' + query.toString();
  }

  function actionIconBtn(action, title, icon, attrs, extraClass, customHref) {
    let dataAttrs = '';
    for (const [k, v] of Object.entries(attrs || {})) {
      const attr = k === 'id' ? 'data-md-id' : 'data-md-' + k;
      dataAttrs += ' ' + attr + '="' + escapeHtml(String(v)) + '"';
    }
    let href = customHref;
    if (!href && (action === 'delete' || action === 'resolve' || action === 'unresolve')) {
      href = buildActionUri({
        action: action,
        id: attrs?.id,
        rootId: attrs?.['root-id'] || attrs?.id,
        type: attrs?.type || 'inline',
        kind: attrs?.kind || 'root',
      });
    }
    if (href) {
      return (
        '<a role="button" class="md-comments-icon-btn' +
        (extraClass ? ' ' + extraClass : '') +
        '" data-md-action="' +
        escapeHtml(action) +
        '" title="' +
        escapeHtml(title) +
        '" aria-label="' +
        escapeHtml(title) +
        '" href="' +
        escapeHtml(href) +
        '"' +
        dataAttrs +
        '>' +
        icon +
        '</a>'
      );
    }
    return (
      '<button type="button" class="md-comments-icon-btn' +
      (extraClass ? ' ' + extraClass : '') +
      '" data-md-action="' +
      escapeHtml(action) +
      '" title="' +
      escapeHtml(title) +
      '" aria-label="' +
      escapeHtml(title) +
      '"' +
      dataAttrs +
      '>' +
      icon +
      '</button>'
    );
  }

  function generateCommentId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function insertOptimisticCard(author, body, anchor, isPage, optId) {
    const targetList = document.getElementById(isPage ? 'page-threads' : 'inline-threads');
    if (!targetList) return null;

    const empty = targetList.querySelector('.md-comments-empty-state, .empty-state');
    if (empty) empty.remove();
    const loading = targetList.querySelector('.panel-loading-container');
    if (loading) loading.remove();

    const commentId = optId || generateCommentId('c');
    const displayName = getCurrentAuthorDisplayName();
    const login = getCurrentAuthor();
    const resolvedName = displayName && displayName !== 'You' ? displayName : author || login;
    const initials = escapeHtml(getAuthorInitials(resolvedName));
    const titleAttr =
      login && login !== resolvedName && login !== 'You'
        ? ' title="@' + escapeHtml(login) + '"'
        : '';
    const avatarLogin =
      login && login !== 'You' && isGitHubLogin(login)
        ? login
        : author && isGitHubLogin(author)
          ? author
          : '';
    const avatarImgHtml = avatarLogin
      ? '<img class="md-comments-avatar-img" src="https://avatars.githubusercontent.com/' +
        encodeURIComponent(avatarLogin) +
        '?s=48" alt="" decoding="async" />'
      : '';
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

    const cardType = isPage ? 'page' : 'inline';
    const editBtn = actionIconBtn(
      'edit',
      'Edit comment',
      ICON_EDIT,
      { id: commentId, 'root-id': commentId, type: cardType, kind: 'root' },
      'md-comments-edit-btn'
    );
    const replyBtn = actionIconBtn('reply', 'Reply', ICON_REPLY, {
      id: commentId,
      type: cardType,
      kind: 'root',
    });
    const resolveBtn = actionIconBtn('resolve', 'Resolve thread', ICON_RESOLVE, {
      id: commentId,
      type: cardType,
      kind: 'root',
    });
    const reactBtn = actionIconBtn('react-picker', 'Add reaction', ICON_REACT, {
      id: commentId,
      'target-id': commentId,
      'root-id': commentId,
      type: cardType,
      kind: 'root',
    });
    const deleteBtn = actionIconBtn(
      'delete',
      'Delete comment',
      ICON_DELETE,
      { id: commentId, type: cardType, kind: 'root' },
      'md-comments-icon-btn-danger'
    );
    const actionsHtml =
      '<div class="md-comments-actions md-comments-actions-icons">' +
      editBtn +
      replyBtn +
      resolveBtn +
      reactBtn +
      deleteBtn +
      '</div>';
    const replyComposerHtml =
      '<div class="reply-composer md-comments-reply-composer" data-md-comment-id="' +
      escapeHtml(commentId) +
      '" data-md-type="' +
      cardType +
      '">' +
      '<input type="text" placeholder="Reply..." class="reply-input md-comments-reply-input" aria-label="Reply to comment">' +
      '<div class="reply-composer-wrapper md-comments-reply-wrapper" style="display: none;">' +
      '<div class="fallback-reply-composer">' +
      '<textarea class="fallback-reply-textarea md-comments-reply-textarea" placeholder="Write a reply..." rows="3" aria-label="Write a reply"></textarea>' +
      '<div class="composer-actions md-comments-composer-actions">' +
      '<button type="button" class="btn btn-secondary fallback-cancel-btn md-comments-btn-secondary" data-md-action="cancel-reply" data-action="cancel">Cancel</button>' +
      '<a role="button" class="btn btn-primary fallback-submit-btn md-comments-btn-primary" data-md-action="submit-reply" data-action="submit" data-md-id="' +
      escapeHtml(commentId) +
      '" data-md-type="' +
      cardType +
      '" href="#">Send</a>' +
      '</div></div></div></div>';

    const article = document.createElement('article');
    article.className = 'md-comments-sidebar-thread md-comments-thread-optimistic';
    article.setAttribute('data-md-comment-id', commentId);

    article.innerHTML =
      quoteHtml +
      '<div class="md-comments-card md-comments-card-optimistic" data-md-comment-id="' +
      commentId +
      '" data-md-type="' +
      cardType +
      '" data-md-stored-author="' +
      escapeHtml(login || author) +
      '">' +
      '<div class="md-comments-thread-row md-comments-thread-root">' +
      '<div class="md-comments-avatar-wrap">' +
      '<div class="md-comments-avatar' +
      (!avatarImgHtml ? ' md-comments-avatar-fallback-only' : '') +
      '" aria-hidden="true">' +
      avatarImgHtml +
      '<span class="md-comments-avatar-fallback">' +
      initials +
      '</span>' +
      '</div>' +
      '</div>' +
      '<div class="md-comments-thread-content">' +
      '<div class="md-comments-meta">' +
      (isPage ? '<span class="md-comments-badge md-comments-type-label">Page comment</span>' : '') +
      '<span class="md-comments-author"' +
      titleAttr +
      '>' +
      escapeHtml(resolvedName) +
      '</span>' +
      '<span class="md-comments-time">Just now</span>' +
      '</div>' +
      '<div class="md-comments-body">' +
      escapeHtml(body) +
      '</div>' +
      actionsHtml +
      '</div>' +
      '</div>' +
      replyComposerHtml +
      '</div>';

    targetList.prepend(article);

    setTimeout(function () {
      const card = article.querySelector('.md-comments-card');
      if (card) {
        card.classList.add('md-comments-optimistic-synced');
        setTimeout(function () {
          card.classList.remove('md-comments-card-optimistic', 'md-comments-optimistic-synced');
        }, 500);
      }
    }, 4000);

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
        const blockText = targetP.getAttribute('data-md-anchor-text') || targetP.textContent || '';
        if (
          (anchor.text || '').replace(/\s+/g, ' ').trim() ===
          (blockText || '').replace(/\s+/g, ' ').trim()
        ) {
          targetP.classList.add('md-comments-paragraph-marked');
        }
      }
    }

    return commentId;
  }

  function insertOptimisticReply(cardEl, rootId, body, _type, optReplyId) {
    if (!cardEl) return null;
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

    const replyId = optReplyId || generateCommentId(rootId + '-r');
    const author = getCurrentAuthor();
    const displayName = getCurrentAuthorDisplayName();
    const resolvedName = displayName && displayName !== 'You' ? displayName : author;
    const initials = escapeHtml(getAuthorInitials(resolvedName));
    const titleAttr =
      author && author !== resolvedName && author !== 'You'
        ? ' title="@' + escapeHtml(author) + '"'
        : '';
    const avatarLogin = author && author !== 'You' && isGitHubLogin(author) ? author : '';
    const avatarImgHtml = avatarLogin
      ? '<img class="md-comments-avatar-img" src="https://avatars.githubusercontent.com/' +
        encodeURIComponent(avatarLogin) +
        '?s=48" alt="" decoding="async" />'
      : '';

    const replyType = _type || 'inline';
    const editBtn = actionIconBtn(
      'edit',
      'Edit reply',
      ICON_EDIT,
      { id: replyId, 'root-id': rootId, type: replyType, kind: 'reply' },
      'md-comments-edit-btn'
    );
    const reactBtn = actionIconBtn('react-picker', 'Add reaction', ICON_REACT, {
      id: replyId,
      'target-id': replyId,
      'root-id': rootId,
      type: replyType,
      kind: 'reply',
    });
    const deleteBtn = actionIconBtn(
      'delete',
      'Delete reply',
      ICON_DELETE,
      { id: replyId, 'root-id': rootId, type: replyType, kind: 'reply' },
      'md-comments-icon-btn-danger'
    );
    const actionsHtml =
      '<div class="md-comments-actions md-comments-actions-icons">' +
      editBtn +
      reactBtn +
      deleteBtn +
      '</div>';

    const replyEl = document.createElement('div');
    replyEl.className = 'md-comments-reply md-comments-reply-optimistic';
    replyEl.setAttribute('data-md-comment-id', replyId);
    replyEl.setAttribute('data-md-stored-author', author);
    replyEl.innerHTML =
      '<div class="md-comments-thread-row">' +
      '<div class="md-comments-avatar' +
      (!avatarImgHtml ? ' md-comments-avatar-fallback-only' : '') +
      '" aria-hidden="true">' +
      avatarImgHtml +
      '<span class="md-comments-avatar-fallback">' +
      initials +
      '</span>' +
      '</div>' +
      '<div class="md-comments-thread-content">' +
      '<div class="md-comments-meta">' +
      '<span class="md-comments-author"' +
      titleAttr +
      '>' +
      escapeHtml(resolvedName) +
      '</span>' +
      '<span class="md-comments-time">Just now</span>' +
      '</div>' +
      '<div class="md-comments-body">' +
      escapeHtml(body) +
      '</div>' +
      actionsHtml +
      '</div>' +
      '</div>';
    list.appendChild(replyEl);

    setTimeout(function () {
      replyEl.classList.add('md-comments-optimistic-synced');
      setTimeout(function () {
        replyEl.classList.remove('md-comments-reply-optimistic', 'md-comments-optimistic-synced');
      }, 500);
    }, 4000);

    const currentCount = parseInt(block.getAttribute('data-md-reply-count') || '0', 10);
    block.setAttribute('data-md-reply-count', String(currentCount + 1));
    return replyId;
  }

  function toggleReactionOptimistic(targetId, rootId, type, kind, emoji) {
    if (!emoji) return;
    const targetEl =
      (kind === 'reply'
        ? document.querySelector('.md-comments-reply[data-md-comment-id="' + targetId + '"]')
        : document.querySelector('.md-comments-card[data-md-comment-id="' + targetId + '"]')) ||
      document.querySelector(
        '.md-comments-card[data-md-comment-id="' + (rootId || targetId) + '"]'
      ) ||
      document.querySelector(
        '.md-comments-reply[data-md-comment-id="' + (targetId || rootId) + '"]'
      );
    if (!targetEl) return;

    const contentEl =
      kind === 'root'
        ? targetEl.querySelector('.md-comments-thread-root .md-comments-thread-content') ||
          targetEl.querySelector(
            ':scope > .md-comments-thread-row > .md-comments-thread-content'
          ) ||
          targetEl.querySelector('.md-comments-thread-content') ||
          targetEl
        : targetEl.querySelector('.md-comments-thread-content') || targetEl;

    let reactionsDiv = contentEl.querySelector
      ? contentEl.querySelector('.md-comments-reactions')
      : targetEl.querySelector('.md-comments-reactions');
    if (!reactionsDiv) {
      reactionsDiv = document.createElement('div');
      reactionsDiv.className = 'md-comments-reactions';
      const actionsEl = contentEl.querySelector
        ? contentEl.querySelector('.md-comments-actions')
        : targetEl.querySelector('.md-comments-actions');
      if (actionsEl && actionsEl.parentNode) {
        actionsEl.parentNode.insertBefore(reactionsDiv, actionsEl);
      } else if (contentEl && contentEl.appendChild) {
        contentEl.appendChild(reactionsDiv);
      } else {
        targetEl.appendChild(reactionsDiv);
      }
    }

    const existingChip = reactionsDiv.querySelector(
      '.md-comments-reaction-chip[data-md-emoji="' + emoji + '"]'
    );
    if (existingChip) {
      const match = existingChip.textContent.trim().match(/\d+$/);
      let count = match ? parseInt(match[0], 10) : 1;
      if (existingChip.classList.contains('md-comments-reaction-active')) {
        existingChip.classList.remove('md-comments-reaction-active');
        count -= 1;
        if (count <= 0) {
          existingChip.remove();
          if (!reactionsDiv.children.length) {
            reactionsDiv.remove();
          }
          return;
        }
      } else {
        existingChip.classList.add('md-comments-reaction-active');
        count += 1;
      }
      existingChip.textContent = emoji + ' ' + count;
    } else {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'md-comments-reaction-chip md-comments-reaction-active';
      chip.setAttribute('data-md-action', 'react');
      chip.setAttribute('data-md-target', targetId || rootId);
      chip.setAttribute('data-md-root', rootId);
      chip.setAttribute('data-md-type', type || 'inline');
      chip.setAttribute('data-md-kind', kind || 'root');
      chip.setAttribute('data-md-emoji', emoji);
      chip.textContent = emoji + ' 1';
      reactionsDiv.appendChild(chip);
    }
  }

  window.mdCommentsToggleReactionOptimistic = toggleReactionOptimistic;

  function removeOptimisticComment(id, rootId, type, kind) {
    if (!id) return;
    const isReply = kind === 'reply';
    if (isReply) {
      const replyEl = document.querySelector('.md-comments-reply[data-md-comment-id="' + id + '"]');
      if (replyEl) {
        const card = replyEl.closest('.md-comments-card');
        replyEl.classList.add('md-comments-card-deleting');
        setTimeout(function () {
          replyEl.remove();
          if (card) {
            const remainingReplies = card.querySelectorAll('.md-comments-reply');
            const toggleBtn = card.querySelector('[data-md-action="toggle-replies"]');
            if (toggleBtn) {
              const labelEl = toggleBtn.querySelector('.toggle-label') || toggleBtn;
              if (remainingReplies.length === 0) {
                const repliesBlock = card.querySelector('.md-comments-replies-block');
                if (repliesBlock) repliesBlock.remove();
                card.classList.remove('md-comments-card-has-replies');
              } else {
                labelEl.textContent =
                  remainingReplies.length === 1 ? '1 reply' : remainingReplies.length + ' replies';
              }
            }
          }
        }, 220);
      }
      return;
    }

    const card = document.querySelector('.md-comments-card[data-md-comment-id="' + id + '"]');
    const actualType = (card && card.getAttribute('data-md-type')) || type || 'inline';
    if (card) {
      const parentThread = card.closest('.md-comments-sidebar-thread, .md-comments-thread');
      const targetEl = parentThread || card;
      targetEl.classList.add('md-comments-card-deleting');
      setTimeout(function () {
        targetEl.remove();
        const listId = actualType === 'page' ? 'page-threads' : 'inline-threads';
        const listEl = document.getElementById(listId);
        if (listEl && !listEl.querySelector('.md-comments-card')) {
          const emptyMsg =
            actualType === 'page'
              ? 'No page comments yet. Add general document feedback below.'
              : 'No inline comments yet. Hover over paragraphs to add feedback.';
          listEl.innerHTML =
            '<div class="empty-state md-comments-empty-state">' + emptyMsg + '</div>';
        }
      }, 220);
    }

    if (actualType === 'inline' && typeof window.mdCommentsUnwrapAnchor === 'function') {
      window.mdCommentsUnwrapAnchor(id);
    }

    const layout = document.querySelector('#md-comments-layout');
    if (layout) {
      const curCount = parseInt(layout.getAttribute('data-md-thread-count') || '0', 10);
      const newCount = Math.max(0, curCount - 1);
      layout.setAttribute('data-md-thread-count', String(newCount));
      const fabBadge = document.querySelector('#md-comments-panel-fab .badge-count');
      if (fabBadge) {
        fabBadge.textContent = String(newCount);
        fabBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
      }
    }

    const tabCountEl = document.querySelector('.' + actualType + '-tab-count');
    if (tabCountEl) {
      const match = tabCountEl.textContent.match(/\d+/);
      if (match) {
        const c = Math.max(0, parseInt(match[0], 10) - 1);
        tabCountEl.textContent = '(' + c + ')';
      }
    }

    const listId = actualType === 'page' ? 'page-threads' : 'inline-threads';
    const listEl = document.getElementById(listId);
    if (listEl && !listEl.querySelector('.md-comments-card')) {
      const emptyMsg =
        actualType === 'page'
          ? 'No page comments yet. Add general document feedback below.'
          : 'No inline comments yet. Hover over paragraphs to add feedback.';
      listEl.innerHTML = '<div class="empty-state md-comments-empty-state">' + emptyMsg + '</div>';
    }
  }

  window.mdCommentsRemoveOptimisticComment = removeOptimisticComment;

  function getCapturedPoster() {
    if (window.__mdCommentsCapturedPoster) {
      return window.__mdCommentsCapturedPoster;
    }
    if (window.X && typeof window.X.postMessage === 'function') {
      window.__mdCommentsCapturedPoster = window.X;
      window.__mdCommentsCapturedPosterSource = 'window.X';
      return window.X;
    }
    const wrap = (obj, name) => {
      if (!obj) return;
      if (obj.poster && typeof obj.poster.postMessage === 'function') {
        window.__mdCommentsCapturedPoster = obj.poster;
        window.__mdCommentsCapturedPosterSource = name;
        return;
      }
      if (typeof obj.setPoster === 'function') {
        const orig = obj.setPoster.bind(obj);
        obj.setPoster = function (p) {
          window.__mdCommentsCapturedPoster = p;
          window.__mdCommentsCapturedPosterSource = name;
          return orig(p);
        };
      }
    };
    wrap(window.cspAlerter, 'cspAlerter');
    wrap(window.styleLoadingMonitor, 'styleLoadingMonitor');
    return window.__mdCommentsCapturedPoster || null;
  }

  function getPreviewSource() {
    try {
      const el = document.getElementById('vscode-markdown-preview-data');
      if (el) {
        const raw = el.getAttribute('data-settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.source) return parsed.source;
        }
      }
    } catch (err) {
      void err;
    }
    try {
      const footer = document.querySelector('.md-comments-footer');
      if (footer && footer.getAttribute('data-md-md-path')) {
        const p = footer.getAttribute('data-md-md-path');
        return p.startsWith('file:') ? p : 'file://' + (p.startsWith('/') ? '' : '/') + p;
      }
    } catch (err) {
      void err;
    }
    return null;
  }

  function postAction(payload) {
    const md = getMdPath();
    if (!md) {
      console.error('[md-comments] missing md path');
      return;
    }

    const scheme = getUriScheme();
    const query = new URLSearchParams();
    query.set('action', payload.action || '');
    query.set('md', md);
    if (payload.body) query.set('body', toBase64Url(payload.body));
    if (payload.text) query.set('text', toBase64Url(payload.text));
    if (payload.heading) query.set('heading', toBase64Url(payload.heading));
    if (payload.emoji) query.set('emoji', toBase64Url(payload.emoji));
    if (payload.hash) query.set('hash', payload.hash);
    if (payload.index !== undefined && payload.index !== null)
      query.set('index', String(payload.index));
    if (payload.occurrence !== undefined && payload.occurrence !== null)
      query.set('occurrence', String(payload.occurrence));
    if (payload.rootId) query.set('rootId', payload.rootId);
    if (payload.type) query.set('type', payload.type);
    if (payload.id) query.set('id', payload.id);
    if (payload.targetId) query.set('targetId', payload.targetId);
    if (payload.kind) query.set('kind', payload.kind);
    if (payload.confirmed) query.set('confirmed', 'true');
    query.set('_t', String(Date.now()));

    const uri = scheme + '://md-comments.md-preview-comments/?' + query.toString();

    let trigger = document.getElementById('md-comments-action-trigger');
    if (!trigger) {
      trigger = document.createElement('a');
      trigger.id = 'md-comments-action-trigger';
      trigger.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      trigger.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('rel', 'noreferrer noopener');
      document.body.appendChild(trigger);
    }
    trigger.removeAttribute('target');
    trigger.setAttribute('rel', 'noreferrer noopener');
    trigger.href = uri;

    if (!window.__mdCommentsVsCodeApi) {
      if (typeof acquireVsCodeApi === 'function') {
        try {
          window.__mdCommentsVsCodeApi = acquireVsCodeApi();
        } catch {
          // May already be acquired
        }
      }
      if (!window.__mdCommentsVsCodeApi) {
        if (
          window.Y &&
          typeof window.Y.postMessage === 'function' &&
          typeof window.Y.getState === 'function'
        ) {
          window.__mdCommentsVsCodeApi = window.Y;
        } else {
          try {
            for (const key of Object.getOwnPropertyNames(window)) {
              try {
                const val = window[key];
                if (
                  val &&
                  typeof val === 'object' &&
                  typeof val.postMessage === 'function' &&
                  typeof val.getState === 'function' &&
                  typeof val.setState === 'function' &&
                  Object.isFrozen(val)
                ) {
                  window.__mdCommentsVsCodeApi = val;
                  break;
                }
              } catch (_) {
                /* ignore */
              }
            }
          } catch (_) {
            /* ignore */
          }
        }
      }
      if (
        !window.__mdCommentsVsCodeApi &&
        window.parent &&
        typeof window.parent.__vscode_post_message__ === 'function'
      ) {
        window.__mdCommentsVsCodeApi = Object.freeze({
          postMessage: function (msg, transfer) {
            window.parent.__vscode_post_message__(
              'onmessage',
              { message: msg, transfer },
              transfer
            );
          },
          setState: function () {},
          getState: function () {
            return {};
          },
        });
      }
    }

    let posted = false;
    const poster = getCapturedPoster();
    const source = getPreviewSource();
    window.__mdCommentsLastAction = {
      uri: uri,
      hasPoster: !!poster,
      hasVsCodeApi: !!window.__mdCommentsVsCodeApi,
      posterType: typeof (poster?.postMessage || window.__mdCommentsVsCodeApi?.postMessage),
      source: source,
    };

    if (poster && typeof poster.postMessage === 'function') {
      try {
        poster.postMessage('openLink', { href: uri });
        window.__mdCommentsLastAction.posted = true;
        window.__mdCommentsLastAction.method = 'poster';
        posted = true;
        console.error('[md-comments:postAction] sent via poster.postMessage:', payload.action);
      } catch (err) {
        window.__mdCommentsLastAction.posterError = String(err);
        console.error('[md-comments:postAction] poster.postMessage threw:', err);
      }
    }

    if (
      !posted &&
      window.__mdCommentsVsCodeApi &&
      typeof window.__mdCommentsVsCodeApi.postMessage === 'function'
    ) {
      try {
        window.__mdCommentsVsCodeApi.postMessage({
          type: 'openLink',
          source: source,
          href: uri,
        });
        window.__mdCommentsLastAction.posted = true;
        window.__mdCommentsLastAction.method = 'vscodeApi';
        posted = true;
        console.error('[md-comments:postAction] sent via vscodeApi.postMessage:', payload.action);
      } catch (err) {
        window.__mdCommentsLastAction.apiError = String(err);
        console.error('[md-comments:postAction] vscodeApi.postMessage threw:', err);
      }
    }

    if (!posted) {
      const getHostParent = window.__mdCommentsGetHostParent;
      const host = typeof getHostParent === 'function' ? getHostParent() : null;
      if (host && typeof host.__vscode_post_message__ === 'function') {
        try {
          host.__vscode_post_message__('onmessage', {
            message: {
              type: 'openLink',
              source: source,
              href: uri,
            },
          });
          window.__mdCommentsLastAction.posted = true;
          window.__mdCommentsLastAction.method = 'hostParentPostMessage';
          posted = true;
          console.error(
            '[md-comments:postAction] sent via hostParent.__vscode_post_message__:',
            payload.action
          );
        } catch (err) {
          window.__mdCommentsLastAction.hostPostError = String(err);
          console.error('[md-comments:postAction] host.__vscode_post_message__ threw:', err);
        }
      } else if (window.parent && typeof window.parent.__vscode_post_message__ === 'function') {
        try {
          window.parent.__vscode_post_message__('onmessage', {
            message: {
              type: 'openLink',
              source: source,
              href: uri,
            },
          });
          window.__mdCommentsLastAction.posted = true;
          window.__mdCommentsLastAction.method = 'parentPostMessage';
          posted = true;
          console.error(
            '[md-comments:postAction] sent via window.parent.__vscode_post_message__:',
            payload.action
          );
        } catch (err) {
          window.__mdCommentsLastAction.parentPostError = String(err);
          console.error('[md-comments:postAction] parent.__vscode_post_message__ threw:', err);
        }
      }
    }

    if (!posted) {
      console.warn('[md-comments:postAction] initial postMessage failed, retrying via bridge...');
      let retries = 0;
      const retryTimer = setInterval(function () {
        retries++;
        let retryPosted = false;
        const p = getCapturedPoster();
        if (p && typeof p.postMessage === 'function') {
          try {
            p.postMessage('openLink', { href: uri });
            retryPosted = true;
          } catch (_e) {
            void _e;
          }
        }
        if (
          !retryPosted &&
          window.__mdCommentsVsCodeApi &&
          typeof window.__mdCommentsVsCodeApi.postMessage === 'function'
        ) {
          try {
            window.__mdCommentsVsCodeApi.postMessage({
              type: 'openLink',
              source: source,
              href: uri,
            });
            retryPosted = true;
          } catch (_e) {
            void _e;
          }
        }
        if (!retryPosted) {
          const getHost = window.__mdCommentsGetHostParent;
          const h = typeof getHost === 'function' ? getHost() : null;
          if (h && typeof h.__vscode_post_message__ === 'function') {
            try {
              h.__vscode_post_message__('onmessage', {
                message: { type: 'openLink', source: source, href: uri },
              });
              retryPosted = true;
            } catch (_e) {
              void _e;
            }
          }
        }
        if (retryPosted || retries >= 5) {
          clearInterval(retryTimer);
          if (retryPosted) {
            console.error('[md-comments:postAction] dispatch succeeded on retry', retries);
          } else {
            console.error('[md-comments:postAction] failed to dispatch action after retries');
          }
        }
      }, 50);
    }
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
      '<a role="button" class="md-comments-btn-primary" data-action="submit" href="#">Add comment</a>' +
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
    const submitBtn = composer.querySelector('[data-action="submit"]');
    submitBtn.addEventListener('click', function (e) {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        e.preventDefault();
        return;
      }
      if (textarea) textarea.blur();
      const replyId = insertOptimisticReply(rootEl, id, body, type);
      if (window.mdCommentsMarkReplySubmitted) {
        window.mdCommentsMarkReplySubmitted();
      }
      const payload = { action: 'reply', rootId: id, type: type, body: body, id: replyId };
      const uri = buildActionUri(payload);
      submitBtn.href = uri;
      postAction({ action: 'reply', rootId: id, type: type, body: body, id: replyId });
      setTimeout(function () {
        composer.remove();
      }, 50);
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
      '<a role="button" class="md-comments-btn-primary" data-action="submit" href="#">Save</a>' +
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
    const submitBtn = composer.querySelector('[data-action="submit"]');
    submitBtn.addEventListener('click', function (e) {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        e.preventDefault();
        return;
      }
      if (bodyEl) {
        bodyEl.textContent = body;
      }
      const payload = {
        action: 'edit',
        id: id,
        rootId: rootId,
        type: type,
        kind: kind,
        body: body,
      };
      const uri = buildActionUri(payload);
      submitBtn.href = uri;
      postAction(payload);
      setTimeout(cleanup, 50);
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
      '<a role="button" class="md-comments-btn-primary" data-action="submit" href="#">Add comment</a>' +
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
    const submitBtn = composer.querySelector('[data-action="submit"]');
    submitBtn.addEventListener('click', function (e) {
      const body = textarea ? textarea.value.trim() : '';
      if (!body) {
        e.preventDefault();
        return;
      }
      if (textarea) textarea.blur();
      if (isPage) {
        const commentId = insertOptimisticCard(getCurrentAuthor(), body, null, true);
        postAction({ action: 'addPage', body: body, id: commentId });
        submitBtn.href = buildActionUri({ action: 'addPage', body: body, id: commentId });
      } else if (anchor) {
        const commentId = insertOptimisticCard(getCurrentAuthor(), body, anchor, false);
        const payload = {
          action: 'add',
          body: body,
          id: commentId,
          index: String(anchor.index),
          hash: anchor.hash,
          text: anchor.text,
          heading: anchor.heading,
          occurrence: anchor.occurrence !== undefined ? String(anchor.occurrence) : undefined,
        };
        postAction(payload);
        submitBtn.href = buildActionUri(payload);
      }
      setTimeout(function () {
        composer.remove();
      }, 50);
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
      const commentId = insertOptimisticCard(
        getCurrentAuthor(),
        e.detail.body,
        null,
        true,
        e.detail.id
      );
      postAction({ action: 'addPage', body: e.detail.body, id: commentId });
    }
  });

  document.addEventListener('md-comments:submit-reply', function (e) {
    if (e.detail && e.detail.body) {
      const card = document.querySelector(
        '.md-comments-card[data-md-comment-id="' + e.detail.rootId + '"]'
      );
      let replyId = e.detail.id;
      if (!replyId && card) {
        replyId = insertOptimisticReply(
          card,
          e.detail.rootId,
          e.detail.body,
          e.detail.type || 'inline'
        );
      }
      postAction({
        action: 'reply',
        rootId: e.detail.rootId,
        type: e.detail.type || 'inline',
        body: e.detail.body,
        id: replyId,
      });
    }
  });

  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-md-action]');
    if (!target) {
      return;
    }
    const action = target.getAttribute('data-md-action');
    const anchor =
      target.tagName && target.tagName.toLowerCase() === 'a' ? target : target.closest('a');

    if (action === 'delete') {
      const delId = target.getAttribute('data-md-id');
      const delRootId = target.getAttribute('data-md-root-id') || delId;
      const delType = target.getAttribute('data-md-type') || 'inline';
      const delKind = target.getAttribute('data-md-kind') || 'root';
      const payload = {
        action: action,
        id: delId,
        rootId: delRootId,
        type: delType,
        kind: delKind,
      };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction(payload);
      return;
    }

    if (action === 'submit-page') {
      const composer = target.closest('.page-composer, .md-comments-page-composer');
      const ta = composer && composer.querySelector('.page-textarea');
      const body = ta ? ta.value.trim() : '';
      if (!body) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (ta) ta.blur();
      target.classList.add('loading');
      target.disabled = true;
      const commentId = insertOptimisticCard(getCurrentAuthor(), body, null, true);
      if (ta) ta.value = '';
      setTimeout(function () {
        target.classList.remove('loading');
        target.disabled = false;
      }, 4000);
      const payload = { action: 'addPage', body: body, id: commentId };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction(payload);
      return;
    }

    if (action === 'submit-reply') {
      const card = target.closest('.md-comments-card');
      const composer = target.closest('.reply-composer, .md-comments-reply-composer');
      if (composer && composer.getAttribute('data-submitting') === 'true') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (composer) {
        composer.setAttribute('data-submitting', 'true');
      }

      const rootId =
        target.getAttribute('data-md-id') || (card && card.getAttribute('data-md-comment-id'));
      const type =
        target.getAttribute('data-md-type') ||
        (card && card.getAttribute('data-md-type')) ||
        'inline';
      const wrapper = target.closest('.reply-composer-wrapper, .md-comments-reply-wrapper');
      const ta = wrapper && wrapper.querySelector('.fallback-reply-textarea');
      const body = ta ? ta.value.trim() : '';
      if (!body || !rootId) {
        if (composer) composer.removeAttribute('data-submitting');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (ta) ta.blur();
      target.classList.add('loading');
      target.disabled = true;
      let replyId;
      if (card) {
        replyId = insertOptimisticReply(card, rootId, body, type);
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
      const payload = { action: 'reply', rootId: rootId, type: type, body: body, id: replyId };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction({ action: 'reply', rootId: rootId, type: type, body: body, id: replyId });
      setTimeout(function () {
        if (composer) composer.removeAttribute('data-submitting');
      }, 1500);
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
      const commentId = target.getAttribute('data-md-id');
      const cardType =
        target.getAttribute('data-md-type') ||
        (card && card.getAttribute('data-md-type')) ||
        'inline';
      if (card) {
        card.classList.add('md-comments-card-resolved');
        card.setAttribute('data-md-resolved', 'true');
        const meta = card.querySelector('.md-comments-meta');
        if (meta && !meta.querySelector('.md-comments-badge-resolved')) {
          const badge = document.createElement('span');
          badge.className = 'md-comments-badge resolved md-comments-badge-resolved';
          badge.textContent = 'Resolved';
          meta.appendChild(badge);
        }
        const composer = card.querySelector('.md-comments-reply-composer');
        if (composer) composer.style.display = 'none';
        const replyBtn = card.querySelector('[data-md-action="reply"]');
        if (replyBtn) replyBtn.style.display = 'none';
        const reactBtn = card.querySelector('[data-md-action="react-picker"]');
        if (reactBtn) reactBtn.style.display = 'none';
      }

      target.setAttribute('data-md-action', 'unresolve');
      target.setAttribute('title', 'Reopen thread');
      target.setAttribute('aria-label', 'Reopen thread');
      target.innerHTML = ICON_REOPEN;

      if (cardType === 'inline' && typeof window.mdCommentsUnwrapAnchor === 'function') {
        window.mdCommentsUnwrapAnchor(commentId);
      }

      const layout = document.querySelector('#md-comments-layout');
      if (layout) {
        const curCount = parseInt(layout.getAttribute('data-md-thread-count') || '0', 10);
        const newCount = Math.max(0, curCount - 1);
        layout.setAttribute('data-md-thread-count', String(newCount));
        const fabBadge = document.querySelector('#md-comments-panel-fab .badge-count');
        if (fabBadge) {
          fabBadge.textContent = String(newCount);
          fabBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
        }
      }
      const tabCountEl = document.querySelector('.' + cardType + '-tab-count');
      if (tabCountEl) {
        const match = tabCountEl.textContent.match(/\d+/);
        if (match) {
          const c = Math.max(0, parseInt(match[0], 10) - 1);
          tabCountEl.textContent = '(' + c + ')';
        }
      }

      const payload = {
        action: 'resolve',
        id: commentId,
        type: cardType,
      };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction(payload);
      return;
    }

    if (action === 'unresolve') {
      const card = target.closest('.md-comments-card');
      const commentId = target.getAttribute('data-md-id');
      const cardType =
        target.getAttribute('data-md-type') ||
        (card && card.getAttribute('data-md-type')) ||
        'inline';
      if (card) {
        card.classList.remove('md-comments-card-resolved');
        card.removeAttribute('data-md-resolved');
        const badge = card.querySelector('.md-comments-badge-resolved');
        if (badge) badge.remove();
        const composer = card.querySelector('.md-comments-reply-composer');
        if (composer) composer.style.display = '';
        const replyBtn = card.querySelector('[data-md-action="reply"]');
        if (replyBtn) replyBtn.style.display = '';
        const reactBtn = card.querySelector('[data-md-action="react-picker"]');
        if (reactBtn) reactBtn.style.display = '';
      }

      target.setAttribute('data-md-action', 'resolve');
      target.setAttribute('title', 'Resolve thread');
      target.setAttribute('aria-label', 'Resolve thread');
      target.innerHTML = ICON_RESOLVE;

      if (cardType === 'inline' && typeof window.mdCommentsScheduleWire === 'function') {
        window.mdCommentsScheduleWire();
      }

      const layout = document.querySelector('#md-comments-layout');
      if (layout) {
        const curCount = parseInt(layout.getAttribute('data-md-thread-count') || '0', 10);
        const newCount = curCount + 1;
        layout.setAttribute('data-md-thread-count', String(newCount));
        const fabBadge = document.querySelector('#md-comments-panel-fab .badge-count');
        if (fabBadge) {
          fabBadge.textContent = String(newCount);
          fabBadge.style.display = 'inline-block';
        }
      }
      const tabCountEl = document.querySelector('.' + cardType + '-tab-count');
      if (tabCountEl) {
        const match = tabCountEl.textContent.match(/\d+/);
        if (match) {
          const c = parseInt(match[0], 10) + 1;
          tabCountEl.textContent = '(' + c + ')';
        }
      }

      const payload = {
        action: 'unresolve',
        id: commentId,
        type: cardType,
      };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction(payload);
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
      const targetId = target.getAttribute('data-md-target');
      const rootId = target.getAttribute('data-md-root');
      const type = target.getAttribute('data-md-type');
      const kind = target.getAttribute('data-md-kind') || 'root';
      const emoji = target.getAttribute('data-md-emoji') || '';
      toggleReactionOptimistic(targetId, rootId, type, kind, emoji);
      const payload = {
        action: 'react',
        targetId: targetId,
        rootId: rootId,
        type: type,
        kind: kind,
        emoji: emoji,
      };
      const uri = buildActionUri(payload);
      e.preventDefault();
      e.stopPropagation();
      if (anchor) {
        anchor.href = uri;
      }
      postAction(payload);
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

  document.addEventListener('click', function (e) {
    if (
      e.target.closest('.md-comments-panel-composer') ||
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

  function syncDisplayNamesAndAvatars(container) {
    const root = container || document;
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) return;
    let names = {};
    try {
      names = JSON.parse(footer.getAttribute('data-md-display-names') || '{}');
    } catch (_err) {
      /* ignore */
    }
    const curAuthor = footer.getAttribute('data-md-current-author');
    const curAuthorName = footer.getAttribute('data-md-current-author-name');
    if (curAuthor && curAuthorName && curAuthorName !== curAuthor) {
      names[curAuthor] = curAuthorName;
    }

    root.querySelectorAll('.md-comments-author-link, .md-comments-author').forEach(function (el) {
      const login =
        el.getAttribute('data-md-author-login') ||
        (el.getAttribute('title') || '').replace(/^@/, '') ||
        el.textContent.trim().replace(/^@/, '');
      if (login && names[login]) {
        if (el.textContent !== names[login]) {
          el.textContent = names[login];
        }
        if (!el.getAttribute('title') && names[login] !== login) {
          el.setAttribute('title', '@' + login);
        }
      }
    });

    root.querySelectorAll('.md-comments-thread-row').forEach(function (row) {
      const authorEl = row.querySelector('.md-comments-author-link, .md-comments-author');
      if (!authorEl) return;
      const login =
        authorEl.getAttribute('data-md-author-login') ||
        (authorEl.getAttribute('title') || '').replace(/^@/, '') ||
        authorEl.textContent.trim().replace(/^@/, '');
      if (!login || !isGitHubLogin(login)) return;

      const avatarWrap = row.querySelector('.md-comments-avatar');
      if (avatarWrap && !avatarWrap.querySelector('.md-comments-avatar-img')) {
        const img = document.createElement('img');
        img.className = 'md-comments-avatar-img';
        img.src = 'https://avatars.githubusercontent.com/' + encodeURIComponent(login) + '?s=48';
        img.alt = '';
        img.decoding = 'async';
        avatarWrap.prepend(img);
        avatarWrap.classList.remove('md-comments-avatar-fallback-only');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncDisplayNamesAndAvatars();
    });
  } else {
    syncDisplayNamesAndAvatars();
  }
  window.mdCommentsBuildActionUri = buildActionUri;
  window.mdCommentsPostAction = postAction;
  window.mdCommentsInsertOptimisticReply = insertOptimisticReply;
  window.mdCommentsInsertOptimisticCard = insertOptimisticCard;

  const previewObserver = new MutationObserver(function () {
    syncDisplayNamesAndAvatars();
  });
  previewObserver.observe(document.body, { childList: true, subtree: true });
})();
