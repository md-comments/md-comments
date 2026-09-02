// Theme toggle and active navigation utility for Plain HTML Demo

(function () {
  'use strict';

  // Initialize theme from storage or system preference
  const savedTheme =
    localStorage.getItem('demo_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);

  document.addEventListener('DOMContentLoaded', () => {
    // Setup theme button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      updateThemeBtnText(savedTheme);
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('demo_theme', newTheme);
        updateThemeBtnText(newTheme);
      });
    }

    function updateThemeBtnText(theme) {
      if (!themeBtn) return;
      themeBtn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }

    // Set active link in sidebar
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (
        (currentPath.endsWith(href) && href !== 'index.html') ||
        (href === 'index.html' &&
          (currentPath.endsWith('/demo-html/') || currentPath.endsWith('index.html')))
      ) {
        link.classList.add('active');
      }
    });
  });
})();
