(function () {
  const WIRED = 'data-md-anchors-wired';

  function normalize(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function findContainer(paragraphIndex) {
    const sel = `[data-md-paragraph-index="${paragraphIndex}"]`;
    let el = document.querySelector('p' + sel);
    if (el) {
      return el;
    }
    el = document.querySelector('td' + sel + ', li' + sel);
    if (el) {
      return el;
    }
    const paragraphs = document.querySelectorAll('p[data-md-paragraph-index]');
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].getAttribute('data-md-paragraph-index') === String(paragraphIndex)) {
        return paragraphs[i];
      }
    }
    return null;
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
      .querySelectorAll('.md-comments-paragraph-marked[data-md-comment-id~="' + commentId + '"]')
      .forEach(function (el) {
        el.classList.add('md-comments-text-active');
      });
    document
      .querySelectorAll('.md-comments-card[data-md-comment-id="' + commentId + '"]')
      .forEach(function (el) {
        el.classList.add('md-comments-card-active');
      });
  }

  function bindHover(el, commentId) {
    el.addEventListener('mouseenter', function () {
      activatePair(commentId);
    });
    el.addEventListener('mouseleave', function () {
      clearActive();
    });
  }

  function bindClick(el, commentId) {
    if (el.getAttribute('data-md-anchor-click-bound') === 'true') {
      return;
    }
    el.setAttribute('data-md-anchor-click-bound', 'true');
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(
        new CustomEvent('md-comments:open-sidebar', { detail: { commentId: commentId } })
      );
    });
  }

  function activateParagraphComments(container) {
    clearActive();
    container.classList.add('md-comments-text-active');
    const ids = (container.getAttribute('data-md-comment-id') || '').split(/\s+/).filter(Boolean);
    ids.forEach(function (commentId) {
      document
        .querySelectorAll('.md-comments-card[data-md-comment-id="' + commentId + '"]')
        .forEach(function (el) {
          el.classList.add('md-comments-card-active');
        });
    });
  }

  function bindParagraphMarked(container) {
    if (container.getAttribute('data-md-paragraph-bound') === 'true') {
      return;
    }
    container.setAttribute('data-md-paragraph-bound', 'true');
    container.addEventListener('mouseenter', function () {
      activateParagraphComments(container);
    });
    container.addEventListener('mouseleave', function () {
      clearActive();
    });
    container.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const ids = (container.getAttribute('data-md-comment-id') || '').split(/\s+/).filter(Boolean);
      document.dispatchEvent(
        new CustomEvent('md-comments:open-sidebar', { detail: { commentId: ids[0] || null } })
      );
    });
  }

  function isFullParagraphComment(container, anchorText) {
    const blockText = container.getAttribute('data-md-anchor-text') || container.textContent || '';
    return normalize(anchorText) === normalize(blockText);
  }

  function markFullParagraph(container, commentId) {
    const ids = (container.getAttribute('data-md-comment-id') || '').split(/\s+/).filter(Boolean);
    if (ids.indexOf(commentId) >= 0) {
      return true;
    }
    ids.push(commentId);
    container.classList.add('md-comments-paragraph-marked');
    container.setAttribute('data-md-comment-id', ids.join(' '));
    container.setAttribute('title', 'Inline comment');
    bindParagraphMarked(container);
    return true;
  }

  function wireCommentHighlight(card) {
    bindCardHover(card);
    const commentId = card.getAttribute('data-md-comment-id');
    const paragraphIndex = card.getAttribute('data-md-paragraph-index');
    const anchorText = card.getAttribute('data-md-anchor-text');
    if (!commentId || paragraphIndex === null || !anchorText) {
      return;
    }
    const container = findContainer(paragraphIndex);
    if (!container) {
      return;
    }
    if (isFullParagraphComment(container, anchorText)) {
      markFullParagraph(container, commentId);
      return;
    }
    wrapAnchorText(container, anchorText, commentId);
  }

  function bindCardHover(card) {
    const commentId = card.getAttribute('data-md-comment-id');
    if (!commentId || card.getAttribute(WIRED) === 'card') {
      return;
    }
    card.setAttribute(WIRED, 'card');
    card.addEventListener('mouseenter', function () {
      activatePair(commentId);
    });
    card.addEventListener('mouseleave', function () {
      clearActive();
    });
  }

  function isExcludedTextNode(node) {
    const parent = node.parentElement;
    if (!parent) {
      return true;
    }
    if (parent.closest('.md-comments-card, .md-comments-composer, .md-comments-sidebar')) {
      return true;
    }
    if (parent.classList.contains('md-comments-text-anchor')) {
      return true;
    }
    return false;
  }

  /** Map a normalized-text index back to a raw index in container.textContent. */
  function mapNormIndexToRaw(raw, normIndex) {
    let normCount = 0;
    let rawIndex = 0;
    let lastWasSpace = false;
    while (rawIndex < raw.length && normCount < normIndex) {
      const ch = raw[rawIndex];
      if (/\s/.test(ch)) {
        if (!lastWasSpace) {
          normCount++;
          lastWasSpace = true;
        }
      } else {
        normCount++;
        lastWasSpace = false;
      }
      rawIndex++;
    }
    while (rawIndex < raw.length && /\s/.test(raw[rawIndex])) {
      rawIndex++;
    }
    return rawIndex;
  }

  function findNeedleRange(raw, needle) {
    if (!needle) {
      return null;
    }
    const n = normalize(needle);
    if (!n) {
      return null;
    }

    let idx = raw.indexOf(needle);
    if (idx >= 0) {
      return { start: idx, length: needle.length };
    }

    const flexible = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    // eslint-disable-next-line security/detect-non-literal-regexp
    const re = new RegExp(flexible);
    const m = raw.match(re);
    if (m && m.index !== undefined) {
      return { start: m.index, length: m[0].length };
    }

    const normRaw = normalize(raw);
    const normIdx = normRaw.indexOf(n);
    if (normIdx >= 0) {
      const start = mapNormIndexToRaw(raw, normIdx);
      const endNorm = normIdx + n.length;
      let normCount = 0;
      let rawEnd = 0;
      let lastWasSpace = false;
      while (rawEnd < raw.length && normCount < endNorm) {
        const ch = raw[rawEnd];
        if (/\s/.test(ch)) {
          if (!lastWasSpace) {
            normCount++;
            lastWasSpace = true;
          }
        } else {
          normCount++;
          lastWasSpace = false;
        }
        rawEnd++;
      }
      return { start: start, length: Math.max(1, rawEnd - start) };
    }

    return null;
  }

  function createDomRange(container, start, length) {
    const range = document.createRange();
    let offset = 0;
    let startNode = null;
    let startOff = 0;
    let endNode = null;
    let endOff = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return isExcludedTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const len = text.length;
      if (startNode === null && offset + len > start) {
        startNode = node;
        startOff = start - offset;
      }
      if (startNode !== null && offset + len >= start + length) {
        endNode = node;
        endOff = start + length - offset;
        break;
      }
      offset += len;
    }
    if (!startNode || !endNode) {
      return null;
    }
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    return range;
  }

  function wrapRange(range, commentId) {
    const span = document.createElement('span');
    span.className = 'md-comments-text-anchor';
    span.setAttribute('data-md-comment-id', commentId);
    span.setAttribute('title', 'Inline comment');
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    } catch {
      return false;
    }
    bindHover(span, commentId);
    bindClick(span, commentId);
    return true;
  }

  function wrapAnchorText(container, anchorText, commentId) {
    if (
      container.querySelector('.md-comments-text-anchor[data-md-comment-id="' + commentId + '"]')
    ) {
      return true;
    }
    const raw = container.textContent || '';
    const match = findNeedleRange(raw, anchorText);
    if (!match) {
      return false;
    }
    const range = createDomRange(container, match.start, match.length);
    if (!range) {
      return false;
    }
    return wrapRange(range, commentId);
  }

  function wireInlineCommentHighlights() {
    const cards = document.querySelectorAll(
      '.md-comments-tab-panel[data-panel="inline"] .md-comments-card[data-md-type="inline"]:not([data-md-resolved="true"])'
    );
    cards.forEach(wireCommentHighlight);
  }

  let wireTimer = null;
  function scheduleWire() {
    if (wireTimer) {
      clearTimeout(wireTimer);
    }
    wireTimer = setTimeout(function () {
      wireTimer = null;
      wireInlineCommentHighlights();
    }, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleWire);
  } else {
    scheduleWire();
  }

  const observer = new MutationObserver(scheduleWire);
  observer.observe(document.body, { childList: true, subtree: true });
})();
