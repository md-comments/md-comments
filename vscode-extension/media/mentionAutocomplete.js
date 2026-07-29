(function () {
  const BOUND = 'data-md-mention-bound';

  function loadMentionUsers() {
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) {
      return [];
    }
    const raw = footer.getAttribute('data-md-mention-users');
    if (!raw) {
      return [];
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function loadDisplayNames() {
    const footer = document.querySelector('.md-comments-footer');
    if (!footer) {
      return {};
    }
    const raw = footer.getAttribute('data-md-display-names');
    if (!raw) {
      return {};
    }
    try {
      const map = JSON.parse(raw);
      return map && typeof map === 'object' ? map : {};
    } catch {
      return {};
    }
  }

  function removeMentionMenu() {
    const el = document.getElementById('md-comments-mention-menu');
    if (el) {
      el.remove();
    }
  }

  function getMentionQuery(textarea) {
    const value = textarea.value;
    const pos = textarea.selectionStart;
    const before = value.slice(0, pos);
    const match = before.match(/@([a-zA-Z0-9-]*)$/);
    if (!match) {
      return null;
    }
    return { query: match[1].toLowerCase(), start: pos - match[0].length, end: pos };
  }

  function showMentionMenu(textarea, users, ctx) {
    removeMentionMenu();
    const displayNames = loadDisplayNames();
    const filtered = users.filter(function (u) {
      const login = u.toLowerCase();
      const name = displayNames[u];
      const q = ctx.query;
      return login.startsWith(q) || (name && name.toLowerCase().includes(q));
    });
    if (!filtered.length) {
      return;
    }
    const menu = document.createElement('div');
    menu.id = 'md-comments-mention-menu';
    menu.className = 'md-comments-mention-menu';
    filtered.slice(0, 8).forEach(function (login) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-comments-mention-item';
      const fullName = displayNames[login];
      if (fullName) {
        btn.innerHTML =
          '<span class="md-comments-mention-name">' +
          fullName +
          '</span><span class="md-comments-mention-login">@' +
          login +
          '</span>';
      } else {
        btn.textContent = '@' + login;
      }
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        const value = textarea.value;
        textarea.value = value.slice(0, ctx.start) + '@' + login + ' ' + value.slice(ctx.end);
        const caret = ctx.start + login.length + 2;
        textarea.setSelectionRange(caret, caret);
        textarea.focus();
        removeMentionMenu();
      });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    const rect = textarea.getBoundingClientRect();
    menu.style.top = rect.bottom + window.scrollY + 4 + 'px';
    menu.style.left = rect.left + window.scrollX + 'px';
  }

  function bindTextarea(textarea) {
    if (textarea.getAttribute(BOUND) === 'true') {
      return;
    }
    textarea.setAttribute(BOUND, 'true');
    const users = loadMentionUsers();

    textarea.addEventListener('input', function () {
      const ctx = getMentionQuery(textarea);
      if (!ctx) {
        removeMentionMenu();
        return;
      }
      showMentionMenu(textarea, users, ctx);
    });

    textarea.addEventListener('blur', function () {
      setTimeout(removeMentionMenu, 150);
    });

    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        removeMentionMenu();
      }
    });
  }

  function scan() {
    document.querySelectorAll('.md-comments-editor-input').forEach(bindTextarea);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
})();
