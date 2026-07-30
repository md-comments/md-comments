(function () {
  const DEFAULT_EMOJIS = ['👍', '👀', '❤️', '🎉', '❓'];

  function getReactionEmojis() {
    const footer = document.querySelector('.md-comments-footer');
    const raw = footer && footer.getAttribute('data-md-reaction-emojis');
    if (!raw) {
      return DEFAULT_EMOJIS;
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.length ? list : DEFAULT_EMOJIS;
    } catch {
      return DEFAULT_EMOJIS;
    }
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    }
  }

  function closeEmojiPopover() {
    removeEl('md-comments-emoji-popover');
    document.removeEventListener('click', onEmojiOutsideClick, true);
  }

  function onEmojiOutsideClick(e) {
    const pop = document.getElementById('md-comments-emoji-popover');
    if (!pop) {
      return;
    }
    if (pop.contains(e.target) || e.target.closest('[data-md-action="react-picker"]')) {
      return;
    }
    closeEmojiPopover();
  }

  function showEmojiPicker(rootId, type, kind, targetId, anchorRect, onPick) {
    closeEmojiPopover();
    const pop = document.createElement('div');
    pop.id = 'md-comments-emoji-popover';
    pop.className = 'md-comments-emoji-popover';
    pop.innerHTML = '<div class="md-comments-emoji-row"></div>';
    const row = pop.querySelector('.md-comments-emoji-row');
    getReactionEmojis().forEach(function (emoji) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-comments-emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        onPick({
          action: 'react',
          targetId: targetId || rootId,
          rootId: rootId,
          type: type,
          kind: kind || 'root',
          emoji: emoji,
        });
        closeEmojiPopover();
      });
      row.appendChild(btn);
    });
    document.body.appendChild(pop);
    if (anchorRect) {
      const top = anchorRect.bottom + window.scrollY + 6;
      let left = anchorRect.left + window.scrollX;
      const maxLeft = window.scrollX + window.innerWidth - pop.offsetWidth - 12;
      pop.style.top = top + 'px';
      pop.style.left = Math.min(left, maxLeft) + 'px';
    }
    requestAnimationFrame(function () {
      document.addEventListener('click', onEmojiOutsideClick, true);
    });
  }

  window.mdCommentsShowEmojiPicker = showEmojiPicker;
  window.mdCommentsCloseEmojiPopover = closeEmojiPopover;

  const REPLY_NAV_PREFIX = 'md-comments-reply-nav:';

  function replyNavKey() {
    const footer = document.querySelector('.md-comments-footer');
    return REPLY_NAV_PREFIX + (footer?.getAttribute('data-md-md-path') || 'default');
  }

  function tabForReplyButton(btn, type) {
    const panel = btn.closest('.md-comments-tab-panel');
    if (panel) {
      return panel.getAttribute('data-panel') || (type === 'page' ? 'page' : 'inline');
    }
    return type === 'page' ? 'page' : 'inline';
  }

  function peekReplyNav() {
    try {
      const raw = sessionStorage.getItem(replyNavKey());
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearReplyNav() {
    try {
      sessionStorage.removeItem(replyNavKey());
    } catch {
      /* ignore */
    }
  }

  window.mdCommentsPrepareReplyNav = function (rootId, tab) {
    try {
      sessionStorage.setItem(
        replyNavKey(),
        JSON.stringify({ rootId: rootId, tab: tab, afterReply: false })
      );
    } catch {
      /* ignore quota */
    }
  };

  window.mdCommentsClearReplyNav = function () {
    const pending = peekReplyNav();
    if (pending && !pending.afterReply) {
      clearReplyNav();
    }
  };

  window.mdCommentsMarkReplySubmitted = function () {
    try {
      const pending = peekReplyNav();
      if (!pending) {
        return;
      }
      pending.afterReply = true;
      sessionStorage.setItem(replyNavKey(), JSON.stringify(pending));
    } catch {
      /* ignore */
    }
  };

  const COLLAPSED_PREFIX = 'md-comments-replies-collapsed:';

  function collapsedKey() {
    const footer = document.querySelector('.md-comments-footer');
    return COLLAPSED_PREFIX + (footer?.getAttribute('data-md-md-path') || 'default');
  }

  function loadCollapsedSet() {
    try {
      const raw = sessionStorage.getItem(collapsedKey());
      if (!raw) {
        return new Set();
      }
      const list = JSON.parse(raw);
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  }

  function saveCollapsedSet(set) {
    try {
      sessionStorage.setItem(collapsedKey(), JSON.stringify([...set]));
    } catch {
      /* ignore */
    }
  }

  function setBlockCollapsed(block, collapsed) {
    block.classList.toggle('md-comments-replies-collapsed', collapsed);
    const btn = block.querySelector('[data-md-action="toggle-replies"]');
    if (btn) {
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
  }

  function applyCollapsedState() {
    const hidden = loadCollapsedSet();
    document.querySelectorAll('.md-comments-replies-block').forEach(function (block) {
      const rootId = block.getAttribute('data-md-root-id');
      if (rootId && hidden.has(rootId)) {
        setBlockCollapsed(block, true);
      }
    });
  }

  window.mdCommentsExpandReplies = function (rootId) {
    const block = document.querySelector(
      '.md-comments-replies-block[data-md-root-id="' + rootId + '"]'
    );
    if (!block) {
      return;
    }
    setBlockCollapsed(block, false);
    const hidden = loadCollapsedSet();
    hidden.delete(rootId);
    saveCollapsedSet(hidden);
  };

  window.mdCommentsToggleReplies = function (btn) {
    const block = btn.closest('.md-comments-replies-block');
    if (!block) {
      return;
    }
    const rootId = block.getAttribute('data-md-root-id');
    const collapsed = !block.classList.contains('md-comments-replies-collapsed');
    setBlockCollapsed(block, collapsed);
    if (!rootId) {
      return;
    }
    const hidden = loadCollapsedSet();
    if (collapsed) {
      hidden.add(rootId);
    } else {
      hidden.delete(rootId);
    }
    saveCollapsedSet(hidden);
  };

  function bindRepliesToggle() {
    if (document.body.getAttribute('data-md-replies-toggle-bound') === 'true') {
      return;
    }
    document.body.setAttribute('data-md-replies-toggle-bound', 'true');
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-md-action="toggle-replies"]');
      if (!btn) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.mdCommentsToggleReplies(btn);
    });
  }

  function scrollToNewReply(rootId, attempt) {
    attempt = attempt || 0;
    if (window.mdCommentsExpandReplies) {
      window.mdCommentsExpandReplies(rootId);
    }
    const card = document.querySelector(
      '#md-comments-sidebar .md-comments-card[data-md-comment-id="' + rootId + '"]'
    );
    if (!card) {
      if (attempt < 20) {
        requestAnimationFrame(function () {
          scrollToNewReply(rootId, attempt + 1);
        });
      }
      return;
    }
    const replies = card.querySelectorAll('.md-comments-reply');
    const target = replies.length ? replies[replies.length - 1] : card;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    target.classList.add('md-comments-reply-new');
    window.setTimeout(function () {
      target.classList.remove('md-comments-reply-new');
    }, 2200);
    card.classList.add('md-comments-card-active');
  }

  function consumeReplyNav() {
    const pending = peekReplyNav();
    if (!pending || !pending.afterReply || !pending.rootId) {
      return;
    }
    clearReplyNav();
    if (pending.tab) {
      activateTab(pending.tab);
    }
    document.dispatchEvent(
      new CustomEvent('md-comments:open-sidebar', { detail: { commentId: pending.rootId } })
    );
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollToNewReply(pending.rootId);
      });
    });
  }

  function extractEditBody(target) {
    const root = target.closest('.md-comments-reply, .md-comments-card');
    if (!root) {
      return '';
    }
    const bodyEl = root.querySelector('.md-comments-body');
    return bodyEl ? bodyEl.textContent.trim() : '';
  }

  window.mdCommentsExtractEditBody = extractEditBody;
  window.mdCommentsActivateTab = activateTab;
  window.mdCommentsTabForReply = tabForReplyButton;

  function activateTab(tabId) {
    document.querySelectorAll('.md-comments-tab').forEach(function (btn) {
      const active = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('md-comments-tab-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.md-comments-tab-panel').forEach(function (panel) {
      const active = panel.getAttribute('data-panel') === tabId;
      panel.classList.toggle('md-comments-tab-panel-active', active);
      panel.hidden = !active;
    });
    const footer = document.querySelector('.md-comments-sidebar-footer');
    if (footer) {
      footer.style.display = tabId === 'page' ? '' : 'none';
    }
  }

  function initTabs() {
    const tabs = document.querySelector('.md-comments-tabs');
    if (!tabs || tabs.getAttribute('data-md-tabs-bound') === 'true') {
      return;
    }
    tabs.setAttribute('data-md-tabs-bound', 'true');
    tabs.addEventListener('click', function (e) {
      const btn = e.target.closest('.md-comments-tab');
      if (!btn) {
        return;
      }
      e.preventDefault();
      activateTab(btn.getAttribute('data-tab') || 'inline');
    });
    const pending = peekReplyNav();
    if (pending && pending.afterReply && pending.tab) {
      activateTab(pending.tab);
      return;
    }
    const first =
      document.querySelector('.md-comments-tab.md-comments-tab-active') ||
      document.querySelector('.md-comments-tab');
    if (first) {
      activateTab(first.getAttribute('data-tab') || 'inline');
    }
  }

  function loadDisplayNames() {
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) {
      return {};
    }
    try {
      const raw = footer.getAttribute('data-md-display-names');
      const map = raw ? JSON.parse(raw) : {};
      return map && typeof map === 'object' ? map : {};
    } catch {
      return {};
    }
  }

  function authorsMatchClient(stored, current, displayNames) {
    if (!stored || !current) {
      return false;
    }
    const s = stored.trim().toLowerCase();
    const c = current.trim().toLowerCase();
    if (s === c) {
      return true;
    }
    if (s.replace(/\./g, '') === c.replace(/\./g, '')) {
      return true;
    }
    for (const login of Object.keys(displayNames)) {
      const name = displayNames[login];
      if (login.toLowerCase() === c && name && name.toLowerCase() === s) {
        return true;
      }
      if (login.toLowerCase() === s && login.toLowerCase() === c) {
        return true;
      }
    }
    return false;
  }

  function revealEditButtons() {
    const footer = document.querySelector('.md-comments-footer');
    const current = footer?.getAttribute('data-md-current-author')?.trim();
    if (!current) {
      return;
    }
    const displayNames = loadDisplayNames();
    document.querySelectorAll('.md-comments-edit-btn[hidden]').forEach(function (btn) {
      const root = btn.closest('.md-comments-card, .md-comments-reply');
      const stored = root?.getAttribute('data-md-stored-author')?.trim();
      if (stored && authorsMatchClient(stored, current, displayNames)) {
        btn.hidden = false;
      }
    });
  }

  function init() {
    initTabs();
    applyCollapsedState();
    bindRepliesToggle();
    consumeReplyNav();
    revealEditButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const observer = new MutationObserver(init);
  observer.observe(document.body, { childList: true, subtree: true });
})();
