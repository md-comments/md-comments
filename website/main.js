const initTheme = () => {
  // --- 1. Theme Switcher ---
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  if (!themeToggle) return;

  // Retrieve theme from localStorage or system settings safely
  const getPreferredTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const setTheme = (theme) => {
    htmlElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
  };

  // Set initial theme
  setTheme(getPreferredTheme());

  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });

  // --- 2. Integrations Tab Switcher ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update active button
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content
      tabContents.forEach((content) => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // --- 3. Dynamic Browser Detection & Selector (Chrome & Safari) ---
  const detectBrowser = () => {
    const ua = navigator.userAgent;
    const isSafari =
      (/^((?!chrome|android).)*safari/i.test(ua) || window.safari !== undefined) &&
      !/chrome|crios|crmo/i.test(ua);
    return isSafari ? 'safari' : 'chrome';
  };

  const selectBrowser = (browserName) => {
    const browserButtons = document.querySelectorAll('.browser-icon-btn[data-browser]');
    const panes = document.querySelectorAll('.browser-install-pane');

    browserButtons.forEach((btn) => {
      if (btn.getAttribute('data-browser') === browserName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    panes.forEach((pane) => {
      if (pane.id === `pane-${browserName}`) {
        pane.style.display = 'block';
      } else {
        pane.style.display = 'none';
      }
    });
  };

  const browserButtons = document.querySelectorAll('.browser-icon-btn[data-browser]');
  browserButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const browser = btn.getAttribute('data-browser');
      if (browser) {
        selectBrowser(browser);
      }
    });
  });

  // Pre-select detected browser on page load
  selectBrowser(detectBrowser());
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
