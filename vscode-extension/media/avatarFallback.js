(function () {
  function bindAvatar(img) {
    if (img.getAttribute('data-md-avatar-bound') === 'true') {
      return;
    }
    img.setAttribute('data-md-avatar-bound', 'true');
    const wrap = img.parentElement;
    if (!wrap || !wrap.classList.contains('md-comments-avatar')) {
      return;
    }
    function showLoaded() {
      wrap.classList.add('md-comments-avatar-loaded');
    }
    function showFallback() {
      img.remove();
      wrap.classList.add('md-comments-avatar-fallback-only');
      wrap.classList.remove('md-comments-avatar-loaded');
    }
    if (img.complete && img.naturalWidth > 0) {
      showLoaded();
      return;
    }
    img.addEventListener('load', showLoaded);
    img.addEventListener('error', showFallback);
  }

  function initAvatars() {
    document.querySelectorAll('.md-comments-avatar-img').forEach(bindAvatar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatars);
  } else {
    initAvatars();
  }

  const observer = new MutationObserver(initAvatars);
  observer.observe(document.body, { childList: true, subtree: true });
})();
