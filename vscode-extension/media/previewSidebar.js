(function () {
  const STORAGE_PREFIX = 'md-comments-sidebar:';
  const DEFAULT_WIDTH = 340;
  const MIN_WIDTH = 260;
  const MAX_WIDTH = 600;
  const EVENTS_BOUND = 'data-md-comments-events-bound';

  function getMdKey() {
    const footer = document.querySelector('.md-comments-footer');
    return footer?.getAttribute('data-md-md-path') || 'default';
  }

  function loadState(layout) {
    const fallback = {
      open: layout.getAttribute('data-md-default-open') === 'true',
      width: DEFAULT_WIDTH,
    };
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + getMdKey());
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw);
      return {
        open: typeof parsed.open === 'boolean' ? parsed.open : fallback.open,
        width:
          typeof parsed.width === 'number'
            ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width))
            : DEFAULT_WIDTH,
      };
    } catch {
      return fallback;
    }
  }

  function saveState(state) {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + getMdKey(), JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }

  function getLayoutContext() {
    const layout = document.getElementById('md-comments-layout');
    if (!layout) {
      return null;
    }
    let state = layout._gcSidebarState;
    if (!state) {
      state = loadState(layout);
      layout._gcSidebarState = state;
    }
    return { layout: layout, state: state };
  }

  function updateFab(layout, open) {
    const fab = document.getElementById('md-comments-panel-fab');
    if (fab) {
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('title', open ? 'Hide comments' : 'Show comments');
      fab.setAttribute('aria-label', open ? 'Hide comments' : 'Show comments');
    }
    layout.classList.toggle('md-comments-sidebar-open', open);
  }

  function applyState(layout, state) {
    layout.style.setProperty('--gc-sidebar-width', state.width + 'px');
    updateFab(layout, state.open);
  }

  function setOpen(open) {
    const ctx = getLayoutContext();
    if (!ctx) {
      return;
    }
    ctx.state.open = open;
    applyState(ctx.layout, ctx.state);
    saveState(ctx.state);
  }

  function toggleOpen() {
    const ctx = getLayoutContext();
    if (!ctx) {
      return;
    }
    setOpen(!ctx.state.open);
  }

  function clearActive() {
    document.querySelectorAll('.md-comments-text-active').forEach(function (el) {
      el.classList.remove('md-comments-text-active');
    });
    document.querySelectorAll('.md-comments-card-active').forEach(function (el) {
      el.classList.remove('md-comments-card-active');
    });
  }

  function activatePair(commentId) {
    clearActive();
    document
      .querySelectorAll('.md-comments-text-anchor[data-md-comment-id="' + commentId + '"]')
      .forEach(function (el) {
        el.classList.add('md-comments-text-active');
      });
    document
      .querySelectorAll('.md-comments-card[data-md-comment-id="' + commentId + '"]')
      .forEach(function (el) {
        el.classList.add('md-comments-card-active');
      });
  }

  function scrollToAnchor(commentId) {
    const el = document.querySelector(
      '.md-comments-text-anchor[data-md-comment-id="' + commentId + '"]'
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function scrollSidebarToCard(commentId) {
    const card = document.querySelector(
      '#md-comments-sidebar .md-comments-card[data-md-comment-id="' + commentId + '"]'
    );
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function openSidebarForComment(commentId) {
    setOpen(true);
    if (commentId) {
      activatePair(commentId);
      scrollSidebarToCard(commentId);
    }
  }

  function bindGlobalEvents() {
    if (document.body.getAttribute(EVENTS_BOUND) === 'true') {
      return;
    }
    document.body.setAttribute(EVENTS_BOUND, 'true');

    document.addEventListener('md-comments:open-sidebar', function (e) {
      const commentId = e.detail && e.detail.commentId;
      openSidebarForComment(commentId);
    });

    document.addEventListener('md-comments:toggle-sidebar', function () {
      toggleOpen();
    });
  }

  function bindSidebarInteractions(layout, state) {
    layout._gcSidebarState = state;

    const fab = document.getElementById('md-comments-panel-fab');
    const closeBtn = document.getElementById('md-comments-sidebar-close');
    const resizer = document.getElementById('md-comments-sidebar-resizer');

    if (fab && fab.getAttribute('data-md-fab-bound') !== 'true') {
      fab.setAttribute('data-md-fab-bound', 'true');
      fab.addEventListener('click', function (e) {
        e.preventDefault();
        toggleOpen();
      });
    }

    if (closeBtn && closeBtn.getAttribute('data-md-close-bound') !== 'true') {
      closeBtn.setAttribute('data-md-close-bound', 'true');
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        setOpen(false);
      });
    }

    let dragging = false;
    if (resizer && resizer.getAttribute('data-md-resizer-bound') !== 'true') {
      resizer.setAttribute('data-md-resizer-bound', 'true');
      resizer.addEventListener('mousedown', function (e) {
        dragging = true;
        e.preventDefault();
        document.body.classList.add('md-comments-resizing');
      });
    }

    if (!document.body.getAttribute('data-md-resize-bound')) {
      document.body.setAttribute('data-md-resize-bound', 'true');
      document.addEventListener('mousemove', function (e) {
        if (!dragging) {
          return;
        }
        const ctx = getLayoutContext();
        if (!ctx) {
          return;
        }
        const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
        ctx.state.width = width;
        ctx.layout.style.setProperty('--gc-sidebar-width', width + 'px');
      });
      document.addEventListener('mouseup', function () {
        if (!dragging) {
          return;
        }
        dragging = false;
        document.body.classList.remove('md-comments-resizing');
        const ctx = getLayoutContext();
        if (ctx) {
          saveState(ctx.state);
        }
      });
    }

    document
      .querySelectorAll('.md-comments-sidebar-thread .md-comments-card')
      .forEach(function (card) {
        if (card.getAttribute('data-md-card-bound') === 'true') {
          return;
        }
        card.setAttribute('data-md-card-bound', 'true');
        const commentId = card.getAttribute('data-md-comment-id');
        if (!commentId) {
          return;
        }
        card.addEventListener('mouseenter', function () {
          activatePair(commentId);
        });
        card.addEventListener('mouseleave', function () {
          clearActive();
        });
        card.addEventListener('click', function () {
          scrollToAnchor(commentId);
        });
      });

    document.querySelectorAll('.md-comments-quote').forEach(function (quote) {
      if (quote.getAttribute('data-md-quote-bound') === 'true') {
        return;
      }
      quote.setAttribute('data-md-quote-bound', 'true');
      quote.addEventListener('click', function () {
        const card = quote.parentElement && quote.parentElement.querySelector('.md-comments-card');
        const commentId = card && card.getAttribute('data-md-comment-id');
        if (commentId) {
          openSidebarForComment(commentId);
          scrollToAnchor(commentId);
        }
      });
    });
  }

  function init() {
    bindGlobalEvents();
    const layout = document.getElementById('md-comments-layout');
    if (!layout) {
      return;
    }
    const state = layout._gcSidebarState || loadState(layout);
    applyState(layout, state);
    bindSidebarInteractions(layout, state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const observer = new MutationObserver(init);
  observer.observe(document.body, { childList: true, subtree: true });
})();
