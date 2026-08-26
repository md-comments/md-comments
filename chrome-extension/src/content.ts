import * as yaml from 'js-yaml';
import { parseMarkdownAnchors, fnv1aHash, normalizeAnchorText } from '../../shared/anchor';
import { placeInlineComments, isOrphanedPlacement, fuzzyMatch } from '../../shared/placement';
import type {
  CommentsFile,
  InlineComment,
  PageComment,
  Reply,
  AnchorBlock,
} from '../../shared/types';
import { GitHubOrphanRefBackend } from '../../shared/gitRefBackend';
import { getStoredToken, saveOAuthToken, clearOAuthToken } from './githubAuth';
import { GitHubApi, RepoMetadata } from './githubApi';
import { isGitHubLogin } from '../../shared/author';
import { escapeHtml } from '../../shared/html';

const gitRefBackend = new GitHubOrphanRefBackend(() => getStoredToken());
const displayNameCache = new Map<string, string>();
const pendingFetches = new Set<string>();

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18.5h2.5L17 9l-2.5-2.5L5 16v2.5zM15.5 5.5L18.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_DELETE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_RESOLVE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l3.5 3.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_REOPEN = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.5M20 12a8 8 0 0 1-13.5 5.5M16 6.5V10h-3.5M8 17.5V14H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Global references to injected elements for cleanup
let activeIndicators: HTMLElement[] = [];
let prInfoHeadBranch = '';
const loadedFileContexts = new Map<string, { anchors: AnchorBlock[]; comments: CommentsFile }>();
let loadedComments: CommentsFile = { page_comments: [], inline_comments: [] };
const localCreatedIds = new Set<string>();
let parsedAnchors: AnchorBlock[] = [];
let useConventionalCommits = false;
let commitPattern = '';

// Load settings at startup
chrome.storage.local.get({ useConventionalCommits: false, commitPattern: '' }, (items) => {
  useConventionalCommits = !!items.useConventionalCommits;
  commitPattern = items.commitPattern || '';
});
let currentMetadata: RepoMetadata | null = null;
let repoInfo: {
  id: string;
  viewerPermission: string;
  isProtected: boolean;
  headOid: string | null;
  defaultBranch: string;
  defaultBranchHeadOid: string | null;
} | null = null;
let currentToken: string | null = null;
let githubApi: GitHubApi | null = null;
let appInstallationStatus: {
  checked: boolean;
  installed: boolean;
  repoAccess: boolean;
  appSlug?: string;
  installationId?: number;
} = { checked: false, installed: true, repoAccess: true };
let isWritable = false;
let writeBranch = '';
let lastAuthError: string | null = null;
let activeSelectionButton: HTMLButtonElement | null = null;
let isTabContentRendered = false;
let cachedSelectedClasses: string[] = [];
let currentDisplayAuthor = '';

const draftsStore: Record<string, string> = {};

function getDraftKey(suffix: string): string {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta) return '';
  const pullNumber = meta.type === 'pull' ? meta.pullNumber : 0;
  return `draft:${meta.owner}/${meta.repo}/${pullNumber}:${suffix}`;
}

function saveDraft(key: string, value: string) {
  if (!key) return;
  if (value.trim()) {
    draftsStore[key] = value;
  } else {
    delete draftsStore[key];
  }
  chrome.storage.local.set({ drafts: draftsStore });
}

type ParsedUrl =
  | { type: 'pull'; owner: string; repo: string; pullNumber: number }
  | { type: 'blob'; owner: string; repo: string; branch: string; filePath: string };

function parseGitHubUrl(urlStr: string): ParsedUrl | null {
  try {
    const url = new URL(urlStr);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 3) return null;
    const owner = parts[0];
    const repo = parts[1];

    if (parts[2] === 'pull') {
      if (parts.length < 4) return null;
      const pullNumber = parseInt(parts[3], 10);
      if (isNaN(pullNumber)) return null;
      return { type: 'pull', owner, repo, pullNumber };
    }

    if (parts[2] === 'blob' || parts[2] === 'raw') {
      if (parts.length < 5) return null;
      const branch = parts[3];
      const filePath = parts.slice(4).join('/');
      if (!filePath.endsWith('.md') && !filePath.endsWith('.markdown')) return null;
      return { type: 'blob', owner, repo, branch, filePath };
    }

    return null;
  } catch {
    return null;
  }
}

function getBranchFromDom(): string | null {
  // 1. Check octolytics-dimension-ref if it exists and is not a commit SHA
  const branchMeta = document.querySelector('meta[name="octolytics-dimension-ref"]');
  if (branchMeta) {
    const content = branchMeta.getAttribute('content') || '';
    const cleanRef = content.replace('refs/heads/', '');
    if (cleanRef && !/^[0-9a-f]{40}$/i.test(cleanRef)) {
      return cleanRef;
    }
  }

  // 2. Check branch button/menu selector (usually data-hotkey="w" or #branch-select-menu)
  const branchButton =
    document.querySelector('[data-hotkey="w"]') ||
    document.querySelector('#branch-select-menu') ||
    document.querySelector('.branch-select-menu button');
  if (branchButton) {
    const text = branchButton.textContent?.trim();
    if (text && !/^[0-9a-f]{40}$/i.test(text) && text !== 'Tree:' && text !== 'Branch:') {
      const cleanText = text.replace(/^(Branch|Tree):\s*/i, '');
      if (cleanText) return cleanText;
    }
  }

  return null;
}

function getPRHeadBranchFromDom(): string | null {
  // 1. Check head-ref meta tag
  const headRefMeta = document.querySelector('meta[name="head-ref"]');
  if (headRefMeta) {
    const content = headRefMeta.getAttribute('content');
    if (content) return content.trim();
  }

  // 2. Check octolytics-dimension-head_ref meta tag
  const octoMeta = document.querySelector('meta[name="octolytics-dimension-head_ref"]');
  if (octoMeta) {
    const content = octoMeta.getAttribute('content');
    if (content) return content.trim();
  }

  // 3. Try fallback elements with data-clipboard-text or title attributes first
  const headRefEl = document.querySelector('.commit-ref.head-ref, .head-ref, [class*="head-ref"]');
  if (headRefEl) {
    const clipText = headRefEl.getAttribute('data-clipboard-text');
    if (clipText) return clipText.trim();

    const titleText = headRefEl.getAttribute('title');
    if (titleText) return titleText.trim();

    const innerLink = headRefEl.querySelector('a, span');
    if (innerLink) {
      const innerText = innerLink.textContent?.trim();
      if (innerText) {
        if (innerText.includes(':')) {
          return innerText.split(':')[1].trim();
        }
        return innerText;
      }
    }

    let branch = headRefEl.textContent?.trim();
    if (branch) {
      if (branch.includes(':')) {
        branch = branch.split(':')[1];
      }
      return branch.trim();
    }
  }
  return null;
}

async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get({ fallbackToken: '', oauthToken: '' }, (items) => {
      const token = items.oauthToken || items.fallbackToken || null;
      if (token) {
        console.log('[md-comments] Found GitHub token in local storage');
      } else {
        console.log('[md-comments] No GitHub token found in local storage');
      }
      resolve(token);
    });
  });
}

async function getDisplayAuthor(): Promise<string> {
  const userMeta = document.querySelector('meta[name="user-login"]')?.getAttribute('content');
  return userMeta || 'github-user';
}

async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string | null
): Promise<string> {
  try {
    const rawUrl = `${window.location.origin}/${owner}/${repo}/blob/${branch}/${filePath}?raw=true`;
    console.log(`[md-comments] Fetching raw file from: ${rawUrl}`);
    const res = await fetch(rawUrl);
    if (res.ok) {
      return await res.text();
    }
    console.warn(`[md-comments] Raw fetch returned status: ${res.status}`);
  } catch (rawErr) {
    console.warn('[md-comments] Failed to fetch from raw endpoint, falling back to API:', rawErr);
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch file contents: ${res.status}`);
  }
  const data = await res.json();
  const base64 = data.content.replace(/\s/g, '');
  const utf8 = atob(base64);
  return decodeURIComponent(escape(utf8));
}

async function fetchCommentsFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string | null
): Promise<CommentsFile> {
  const commentsPath = filePath.replace(/\.md$/i, '.comments.yml');
  try {
    const yamlContent = await fetchFileContent(owner, repo, branch, commentsPath, token);
    const parsed = yaml.load(yamlContent) as Partial<CommentsFile>;
    return {
      page_comments: parsed?.page_comments || [],
      inline_comments: parsed?.inline_comments || [],
    };
  } catch (err) {
    // If 404, the comments file simply doesn't exist yet
    return { page_comments: [], inline_comments: [] };
  }
}

function cleanupInjections() {
  hideCommentTooltip();
  const customToggle = document.getElementById('md-comments-custom-toggle');
  if (customToggle) customToggle.remove();

  if (activeSidebarHost) {
    if (activeSidebarHost.id !== 'md-comments-sidebar-embedded') {
      activeSidebarHost.remove();
    }
    activeSidebarHost = null;
  }

  for (const indicator of activeIndicators) {
    indicator.remove();
  }
  activeIndicators = [];
  if (activeSelectionButton) {
    activeSelectionButton.remove();
    activeSelectionButton = null;
  }

  const customViews = document.querySelectorAll('.md-comments-inline-view');
  customViews.forEach((view) => {
    const fileEl = view.parentNode as HTMLElement;
    if (fileEl) {
      const nativeContent = fileEl.querySelector('.js-file-content');
      if (nativeContent) {
        (nativeContent as HTMLElement).style.display = '';
      }
    }
    view.remove();
  });

  document.querySelectorAll('.markdown-body.md-processed').forEach((el) => {
    el.classList.remove('md-processed');
    el.querySelectorAll('.md-comments-inline-thread').forEach((subEl) => subEl.remove());
    el.querySelectorAll('.md-comments-page-discussion').forEach((subEl) => subEl.remove());
    el.querySelectorAll('[data-original-html]').forEach((subEl) => {
      const originalHtml = subEl.getAttribute('data-original-html');
      if (originalHtml) subEl.innerHTML = originalHtml;
      subEl.removeAttribute('data-original-html');
    });
  });

  const customView = document.getElementById('md-comments-tab-content');
  if (customView) {
    customView.remove();
  }
  isTabContentRendered = false;

  const nativeContent = getNativeContentContainer();
  if (nativeContent) {
    nativeContent.style.display = '';
  }

  document.documentElement.classList.remove('md-comments-tab-active');
  document.body.style.width = '';
}

function renameReplyButtonsToOK() {
  const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  buttons.forEach((btn) => {
    if (btn instanceof HTMLInputElement) {
      if (btn.value?.trim().toLowerCase() === 'reply') {
        btn.value = 'OK';
      }
    } else {
      const text = btn.textContent?.trim();
      if (text && text.toLowerCase() === 'reply') {
        const walk = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walk.nextNode())) {
          const val = node.nodeValue?.trim();
          if (val && val.toLowerCase() === 'reply' && node.nodeValue) {
            node.nodeValue = node.nodeValue.replace(/reply/i, 'OK');
          }
        }
      }
    }
  });
}

function isSidebarOpen(): boolean {
  return !!(activeSidebarHost && activeSidebarHost.style.transform === 'translateX(0px)');
}

// Check navigation changes
let lastUrl = '';
let wasOpenBeforePageChange = false;
let lastDocPath = '';

async function checkPageChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    wasOpenBeforePageChange = isSidebarOpen();
    lastDocPath = currentMetadata?.filePath || '';
    cleanupInjections();
    await handlePageLoad().catch(console.error);
  } else {
    const meta = parseGitHubUrl(currentUrl);
    if (meta && meta.type === 'blob') {
      const totalCount =
        loadedComments.inline_comments.length + loadedComments.page_comments.length;
      injectFABButton(totalCount);
      injectToolbarButton(totalCount);
    }
  }
  renameReplyButtonsToOK();
}

// Start polling and listening
document.addEventListener('turbo:load', checkPageChange);
document.addEventListener('pjax:end', checkPageChange);
window.addEventListener('popstate', checkPageChange);
setInterval(checkPageChange, 1000);

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    toggleSidebar();
  }
});

async function handleDevicePageAutofill() {
  try {
    const result = await new Promise<{ pendingUserCode?: string }>((resolve) => {
      chrome.storage.local.get({ pendingUserCode: '' }, (items) => {
        resolve(items as any);
      });
    });
    const userCode = result?.pendingUserCode;
    if (!userCode) return;

    const cleanCode = userCode.replace(/-/g, '').toUpperCase();
    const inputIds = [
      'user-code-0',
      'user-code-1',
      'user-code-2',
      'user-code-3',
      'user-code-5',
      'user-code-6',
      'user-code-7',
      'user-code-8',
    ];

    let filled = false;
    for (let i = 0; i < cleanCode.length && i < inputIds.length; i++) {
      const input = document.getElementById(inputIds[i]) as HTMLInputElement | null;
      if (input) {
        input.value = cleanCode[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        filled = true;
      }
    }

    if (filled) {
      console.log('[md-comments] Autofilled device code:', userCode);
      chrome.storage.local.remove('pendingUserCode').catch(() => {});

      const commitBtn = document.querySelector('input[name="commit"]') as HTMLInputElement | null;
      if (commitBtn && !commitBtn.disabled) {
        commitBtn.focus();
        commitBtn.click();
      }
    }
  } catch (e) {
    console.error('[md-comments] Error during device page autofill:', e);
  }
}

async function handlePageLoad() {
  if (window.location.pathname === '/login/device') {
    await handleDevicePageAutofill();
    return;
  }

  const meta = parseGitHubUrl(window.location.href);
  if (!meta) return;

  injectGlobalStyles();
  lastAuthError = null;

  currentToken = await getAuthToken();
  currentDisplayAuthor = await getDisplayAuthor();

  // Validate token in background if present
  if (currentToken) {
    const api = new GitHubApi(currentToken);
    api
      .getViewer()
      .then((viewer) => {
        console.log('[md-comments] Stored GitHub token is valid. User:', viewer.login);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          errMsg.includes('401') ||
          errMsg.includes('Unauthorized') ||
          errMsg.includes('Bad credentials')
        ) {
          console.warn('[md-comments] Stored token is revoked or expired. Clearing token.');
          currentToken = null;
          githubApi = new GitHubApi(null);
          clearOAuthToken().catch(() => {});
          // Re-render components to show the login prompt
          injectSidebar();
          renderSidebarComments();
        }
      });
  }

  // Writing comments is enabled by default via browser session / PAT
  isWritable = true;

  if (meta.type === 'blob') {
    await loadDocumentComments(meta);
  }
}

async function loadDocumentComments(meta: ParsedUrl & { type: 'blob' }) {
  currentMetadata = {
    owner: meta.owner,
    repo: meta.repo,
    branch: meta.branch,
    filePath: meta.filePath,
  };

  const key = {
    owner: meta.owner,
    repo: meta.repo,
    branch: meta.branch,
    filePath: meta.filePath,
  };

  if (currentToken) {
    if (!githubApi) {
      githubApi = new GitHubApi(currentToken);
    }
    try {
      const status = await githubApi.checkAppInstallation(meta.owner, meta.repo);
      appInstallationStatus = {
        checked: true,
        installed: status.installed,
        repoAccess: status.repoAccess,
        appSlug: status.appSlug,
        installationId: status.installationId,
      };
    } catch (err) {
      console.warn('[md-comments] Failed to verify app installation:', err);
      appInstallationStatus = { checked: true, installed: true, repoAccess: true };
    }
  } else {
    appInstallationStatus = { checked: false, installed: true, repoAccess: true };
  }

  if (
    currentToken &&
    appInstallationStatus.checked &&
    (!appInstallationStatus.installed || !appInstallationStatus.repoAccess)
  ) {
    loadedComments = { page_comments: [], inline_comments: [] };
  } else {
    try {
      const fetched = await gitRefBackend.read(key);
      loadedComments = mergeLocalComments(loadedComments, fetched);
    } catch (err) {
      console.warn('[md-comments] Error reading comments from GitHubOrphanRefBackend:', err);
      loadedComments = mergeLocalComments(loadedComments, {
        page_comments: [],
        inline_comments: [],
      });
    }
  }

  try {
    const rawMarkdown = await fetchFileContent(
      meta.owner,
      meta.repo,
      meta.branch,
      meta.filePath,
      currentToken
    );
    if (rawMarkdown) {
      parsedAnchors = parseMarkdownAnchors(rawMarkdown);
    }
  } catch (err) {
    console.warn('[md-comments] Failed to fetch raw file anchors:', err);
  }

  const totalCount = loadedComments.inline_comments.length + loadedComments.page_comments.length;
  injectFABButton(totalCount);
  injectToolbarButton(totalCount);

  const markdownBody = document.querySelector('.markdown-body') as HTMLElement;
  if (markdownBody) {
    renderDOMIndicatorsForFile(markdownBody, meta.filePath, parsedAnchors, loadedComments);
  }
  renderSidebarComments();

  if (wasOpenBeforePageChange && lastDocPath === meta.filePath) {
    openSidebar('inline');
    wasOpenBeforePageChange = false;
  } else {
    chrome.storage.local.get({ sidebarOpenState: false }, (items) => {
      if (items.sidebarOpenState && totalCount > 0 && !isSidebarOpen()) {
        openSidebar('inline');
      }
    });
  }
}

function mergeLocalComments(local: CommentsFile, fetched: CommentsFile): CommentsFile {
  const mergedInline = [...fetched.inline_comments];
  const mergedPage = [...fetched.page_comments];

  for (const localC of local.inline_comments) {
    if (localCreatedIds.has(localC.id)) {
      const exists = fetched.inline_comments.some((c) => c.id === localC.id);
      if (!exists) {
        mergedInline.push(localC);
      }
    }
  }

  for (const localC of local.page_comments) {
    if (localCreatedIds.has(localC.id)) {
      const exists = fetched.page_comments.some((c) => c.id === localC.id);
      if (!exists) {
        mergedPage.push(localC);
      }
    }
  }

  for (const fetchedC of mergedInline) {
    const localC = local.inline_comments.find((c) => c.id === fetchedC.id);
    if (localC) {
      for (const localR of localC.replies) {
        if (localCreatedIds.has(localR.id)) {
          const exists = fetchedC.replies.some((r) => r.id === localR.id);
          if (!exists) {
            fetchedC.replies.push(localR);
          }
        }
      }
    }
  }

  for (const fetchedC of mergedPage) {
    const localC = local.page_comments.find((c) => c.id === fetchedC.id);
    if (localC) {
      for (const localR of localC.replies) {
        if (localCreatedIds.has(localR.id)) {
          const exists = fetchedC.replies.some((r) => r.id === localR.id);
          if (!exists) {
            fetchedC.replies.push(localR);
          }
        }
      }
    }
  }

  return {
    inline_comments: mergedInline,
    page_comments: mergedPage,
  };
}

function injectFABButton(count: number = 0) {
  let fab = document.getElementById('md-comments-fab-toggle');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'md-comments-fab-toggle';
    fab.title = 'Markdown Comments (Cmd/Ctrl+Shift+C)';
    fab.innerHTML = `
      <svg viewBox="0 0 512 512" width="30" height="30">
        <path fill="#24292f" stroke="#ffffff" stroke-width="20" stroke-linejoin="round" d="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z"/>
        <path fill="#ffffff" d="M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"/>
      </svg>
      <span class="badge-count" style="display: ${count > 0 ? 'inline-block' : 'none'}">${count}</span>
    `;
    fab.addEventListener('click', () => {
      toggleSidebar('inline');
    });
    document.body.appendChild(fab);
  } else {
    const badge = fab.querySelector('.badge-count');
    if (badge) {
      badge.textContent = String(count);
      (badge as HTMLElement).style.display = count > 0 ? 'inline-block' : 'none';
    }
  }
}

function injectToolbarButton(_count: number = 0) {
  const existing = document.querySelector('.md-comments-toolbar-btn');
  if (existing) existing.remove();
}

function toggleSidebar(tab: 'inline' | 'page' = 'inline') {
  if (activeSidebarHost && activeSidebarHost.style.transform === 'translateX(0px)') {
    closeSidebar();
  } else {
    openSidebar(tab);
  }
}

function getFilePathFromFileContainer(fileEl: HTMLElement): string | null {
  const pathAttr = fileEl.getAttribute('data-file-path');
  if (pathAttr) return pathAttr;

  const pathLink = fileEl.querySelector('.link-gray-dark, [data-file-path], .file-info a');
  if (pathLink) {
    const title = pathLink.getAttribute('title') || pathLink.textContent?.trim();
    if (title) return title;
  }

  return null;
}

function isGitHubDarkTheme(): boolean {
  const html = document.documentElement;
  const colorMode = html.getAttribute('data-color-mode');
  const darkTheme = html.getAttribute('data-dark-theme');

  if (colorMode === 'dark') return true;
  if (colorMode === 'light') return false;

  if (darkTheme && darkTheme.includes('dark')) return true;

  const bg = window.getComputedStyle(document.body).backgroundColor;
  if (bg) {
    const match = bg.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10);
      const g = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncTheme() {
  const isDark = isGitHubDarkTheme();
  const themeVal = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-md-theme', themeVal);
  document.querySelectorAll('.md-comments-scope').forEach((el) => {
    el.setAttribute('data-md-theme', themeVal);
  });
}

try {
  const themeObserver = new MutationObserver(() => {
    syncTheme();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode', 'data-dark-theme', 'data-light-theme', 'class'],
  });
} catch (e) {
  // Ignore observer error if document not ready
}

function injectGlobalStyles() {
  if (!document.getElementById('md-comments-global-styles')) {
    const link = document.createElement('link');
    link.id = 'md-comments-global-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('sidebar.css');
    document.head.appendChild(link);
  }
  syncTheme();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processPRMarkdownFiles() {
  injectGlobalStyles();
  const fileContainers = document.querySelectorAll('.js-file, .file');
  for (const fileEl of Array.from(fileContainers)) {
    const htmlEl = fileEl as HTMLElement;
    if (htmlEl.closest('#md-comments-tab-content')) continue;

    const filePath = getFilePathFromFileContainer(htmlEl);
    if (!filePath || !filePath.toLowerCase().endsWith('.md')) continue;

    // Check if the container is in Rich Diff Mode (has native .markdown-body)
    const nativeMarkdownBody = htmlEl.querySelector('.markdown-body');
    if (nativeMarkdownBody) {
      const nativeContent = htmlEl.querySelector('.js-file-content');
      if (nativeContent) {
        (nativeContent as HTMLElement).style.display = '';
      }
      const customView = htmlEl.querySelector('.md-comments-inline-view');
      if (customView) {
        customView.remove();
      }

      if (!nativeMarkdownBody.classList.contains('md-processed')) {
        nativeMarkdownBody.classList.add('md-processed');
        console.log(
          `[md-comments] Found native markdown body for ${filePath}. Injecting comments...`
        );
        try {
          await loadAndRenderCommentsForContainer(
            htmlEl,
            filePath,
            nativeMarkdownBody as HTMLElement
          );
        } catch (err) {
          console.error(
            `[md-comments] loadAndRenderCommentsForContainer failed for ${filePath}:`,
            err
          );
          nativeMarkdownBody.classList.remove('md-processed');
        }
      }
      continue;
    }

    // Check if it is in Source View (has .blob-wrapper and no diff lines / .diff-table)
    const blobWrapper = htmlEl.querySelector('.blob-wrapper');
    const diffTable = htmlEl.querySelector('.diff-table');
    const isSourceView = blobWrapper && !diffTable;

    if (isSourceView) {
      const nativeContent = htmlEl.querySelector('.js-file-content');
      if (nativeContent) {
        (nativeContent as HTMLElement).style.display = 'none';
      }

      let customView = htmlEl.querySelector('.md-comments-inline-view') as HTMLElement;
      if (!customView) {
        customView = document.createElement('div');
        customView.className = 'md-comments-inline-view md-comments-scope';
        customView.innerHTML = `<div class="inline-loading">Loading Markdown comments view...</div>`;
        htmlEl.appendChild(customView);

        console.log(`[md-comments] Injected custom source view for ${filePath}. Rendering...`);
        await renderCustomMarkdownSourceView(htmlEl, filePath, customView);
      }
    } else {
      const nativeContent = htmlEl.querySelector('.js-file-content');
      if (nativeContent) {
        (nativeContent as HTMLElement).style.display = '';
      }
      const customView = htmlEl.querySelector('.md-comments-inline-view');
      if (customView) {
        customView.remove();
      }
    }
  }
}

async function renderCustomMarkdownSourceView(
  fileEl: HTMLElement,
  filePath: string,
  customView: HTMLElement
) {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || !githubApi) return;

  let markdownText = '';
  try {
    markdownText = await fetchFileContent(
      meta.owner,
      meta.repo,
      prInfoHeadBranch,
      filePath,
      currentToken
    );
  } catch (err) {
    console.error('Failed to load markdown content:', err);
    customView.innerHTML = `<div class="inline-error">Failed to load file contents: ${err}</div>`;
    return;
  }

  let renderedHtml = '';
  try {
    renderedHtml = await githubApi.renderMarkdown(markdownText, meta.owner, meta.repo);
  } catch (err) {
    console.warn('Failed to render via API, falling back to text:', err);
    renderedHtml = `<pre style="white-space: pre-wrap; padding: 20px;">${escapeHtml(markdownText)}</pre>`;
  }

  customView.innerHTML = `
    <div class="markdown-body overlay-markdown-body" style="padding: 32px; max-width: 100%;">
      ${renderedHtml}
    </div>
  `;

  const markdownBody = customView.querySelector('.markdown-body') as HTMLElement;
  if (markdownBody) {
    markdownBody.classList.add('md-processed');
    await loadAndRenderCommentsForContainer(fileEl, filePath, markdownBody);
  }
}

async function loadAndRenderCommentsForContainer(
  fileEl: HTMLElement,
  filePath: string,
  markdownBody: HTMLElement
) {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || !githubApi) return;

  if (!prInfoHeadBranch) {
    const domBranch = getPRHeadBranchFromDom();
    if (domBranch) {
      prInfoHeadBranch = domBranch;
      console.log('[md-comments] Resolved head branch from DOM meta:', prInfoHeadBranch);
    } else {
      try {
        console.log('[md-comments] Fetching head branch via API...');
        const pullNum = meta.type === 'pull' ? meta.pullNumber : 0;
        const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, pullNum);
        prInfoHeadBranch = prInfo.headBranch;
        console.log('[md-comments] Resolved head branch via API:', prInfoHeadBranch);
      } catch (err) {
        console.error('[md-comments] Failed to resolve head branch name:', err);
        return;
      }
    }
  }

  await initRepoAndMetadata(meta.owner, meta.repo, prInfoHeadBranch);

  let markdownText = '';
  let fileAnchors: AnchorBlock[] = [];
  try {
    markdownText = await fetchFileContent(
      meta.owner,
      meta.repo,
      prInfoHeadBranch,
      filePath,
      currentToken
    );
    fileAnchors = parseMarkdownAnchors(markdownText);
  } catch (err) {
    console.error(`Failed to load markdown text for anchors in ${filePath}:`, err);
    return;
  }

  let commentsBranchToRead = prInfoHeadBranch;
  if (repoInfo?.isProtected) {
    const commentsBranchExists = await githubApi.checkBranchExists(
      meta.owner,
      meta.repo,
      `comments/${writeBranch.replace('comments/', '')}`
    );
    if (commentsBranchExists) {
      commentsBranchToRead = `comments/${writeBranch.replace('comments/', '')}`;
    }
  }

  let fileComments: CommentsFile = { page_comments: [], inline_comments: [] };
  try {
    fileComments = await fetchCommentsFile(
      meta.owner,
      meta.repo,
      commentsBranchToRead,
      filePath,
      currentToken
    );
  } catch (err) {
    console.error(`Failed to fetch comments file for ${filePath}:`, err);
  }

  loadedFileContexts.set(filePath, { anchors: fileAnchors, comments: fileComments });

  setActiveFile(filePath, fileAnchors, fileComments);
  renderDOMIndicatorsForFile(markdownBody, filePath, fileAnchors, fileComments);
}

async function initRepoAndMetadata(owner: string, repo: string, branch: string) {
  if (repoInfo) return;

  try {
    console.log('[md-comments] Fetching repo info for:', owner, repo, 'branch:', branch);
    repoInfo = await githubApi!.getRepoInfo(owner, repo, branch);
    console.log('[md-comments] Repo info fetched successfully:', repoInfo);

    const isCommitSha = /^[0-9a-f]{40}$/i.test(branch);
    let actualBranch = branch;
    let isProtected = repoInfo.isProtected;

    if (isCommitSha || !repoInfo.headOid) {
      const domBranch = getBranchFromDom();
      if (domBranch) {
        console.log(
          '[md-comments] URL branch is a commit SHA/invalid ref. Found branch name from DOM:',
          domBranch
        );
        try {
          const domBranchInfo = await githubApi!.getRepoInfo(owner, repo, domBranch);
          if (domBranchInfo.headOid) {
            actualBranch = domBranch;
            isProtected = domBranchInfo.isProtected;
            repoInfo = {
              ...repoInfo,
              headOid: domBranchInfo.headOid,
              isProtected: domBranchInfo.isProtected,
            };
          }
        } catch (err) {
          console.warn(
            '[md-comments] Failed to fetch info for DOM branch, falling back to default branch:',
            err
          );
          actualBranch = repoInfo.defaultBranch;
          isProtected = false;
        }
      } else {
        console.log(
          '[md-comments] URL branch is commit SHA and no DOM branch found. Falling back to default branch:',
          repoInfo.defaultBranch
        );
        actualBranch = repoInfo.defaultBranch;
      }

      if (actualBranch === repoInfo.defaultBranch) {
        try {
          const defaultBranchInfo = await githubApi!.getRepoInfo(owner, repo, actualBranch);
          if (defaultBranchInfo.headOid) {
            isProtected = defaultBranchInfo.isProtected;
            repoInfo = {
              ...repoInfo,
              headOid: defaultBranchInfo.headOid,
              isProtected: defaultBranchInfo.isProtected,
            };
          }
        } catch (err) {
          console.error('[md-comments] Failed to fetch info for default branch:', err);
        }
      }
    }

    const hasWriteAccess = ['WRITE', 'ADMIN', 'MAINTAIN'].includes(repoInfo.viewerPermission);
    console.log(
      '[md-comments] User write permission:',
      repoInfo.viewerPermission,
      'hasWriteAccess:',
      hasWriteAccess
    );

    if (hasWriteAccess) {
      if (isProtected) {
        writeBranch = `comments/${actualBranch}`;
        isWritable = true;
        console.log(
          '[md-comments] Branch is protected. comments will be written to:',
          writeBranch,
          'isWritable:',
          isWritable
        );
      } else {
        writeBranch = actualBranch;
        isWritable = true;
        console.log(
          '[md-comments] Branch is NOT protected. comments will be written directly to:',
          writeBranch,
          'isWritable:',
          isWritable
        );
      }
    } else {
      isWritable = false;
      console.log(
        '[md-comments] User does not have write access. Setting isWritable to false (read-only mode).'
      );
    }
  } catch (e) {
    console.warn('[md-comments] Error fetching repo permissions, falling back to read-only:', e);
    isWritable = false;
    lastAuthError = e instanceof Error ? e.message : String(e);
    if (lastAuthError.includes('401') || lastAuthError.includes('Unauthorized')) {
      console.log(
        '[md-comments] Token is unauthorized (401). Clearing active token to fallback to anonymous fetch.'
      );
      currentToken = null;
      githubApi = new GitHubApi(null);
      clearOAuthToken().catch(() => {});
    }
  }
}

function setActiveFile(filePath: string, fileAnchors: AnchorBlock[], fileComments: CommentsFile) {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta) return;

  currentMetadata = {
    owner: meta.owner,
    repo: meta.repo,
    branch: prInfoHeadBranch,
    filePath: filePath,
  };
  loadedComments = fileComments;
  parsedAnchors = fileAnchors;

  if (parsedAnchors && loadedComments && loadedComments.inline_comments) {
    const placements = placeInlineComments(parsedAnchors, loadedComments.inline_comments);
    loadedComments.inline_comments.forEach((c) => {
      const placement = placements.find((p) => p.comment.id === c.id);
      if (placement) {
        c.orphaned = isOrphanedPlacement(parsedAnchors, placement);
      }
    });
  }

  warmDisplayNames(loadedComments);
  updateTabCommentsCount();
}

function findDiffGutterCell(fileContainer: HTMLElement, line: number): HTMLElement | null {
  const tds = fileContainer.querySelectorAll(`td.blob-num[data-line-number="${line}"]`);
  if (tds.length === 0) return null;
  if (tds.length === 1) return tds[0] as HTMLElement;
  // If there are two cells, the second one is the right-side (new file) column
  return tds[1] as HTMLElement;
}

async function triggerAndMoveNativeComposer(
  filePath: string,
  line: number,
  targetContainer: HTMLElement,
  onSubmit: (body: string) => Promise<void>,
  onCancel: () => void,
  draftKey?: string
) {
  const fileContainers = document.querySelectorAll('.js-file, .file');
  let targetFileContainer: HTMLElement | null = null;
  for (const container of Array.from(fileContainers)) {
    const path = getFilePathFromFileContainer(container as HTMLElement);
    if (path === filePath) {
      targetFileContainer = container as HTMLElement;
      break;
    }
  }

  if (!targetFileContainer) {
    throw new Error(`File diff container not found for: ${filePath}`);
  }

  const cell = findDiffGutterCell(targetFileContainer, line);
  if (!cell) {
    throw new Error(`Diff cell not found for line ${line}`);
  }

  const row = cell.closest('tr');
  if (row) {
    row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  }
  cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  cell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

  const addBtn =
    cell.querySelector(
      '.js-add-line-comment, button[aria-label="Add line comment"], button[aria-label="Add review comment"]'
    ) ||
    row?.querySelector(
      '.js-add-line-comment, button[aria-label="Add line comment"], button[aria-label="Add review comment"]'
    );

  if (!addBtn) {
    throw new Error(`Native comment button not found on line ${line}`);
  }

  (addBtn as HTMLElement).click();

  let nativeForm: HTMLFormElement | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    let nextRow = row?.nextElementSibling;
    for (let i = 0; i < 3; i++) {
      if (nextRow) {
        const form = nextRow.querySelector('form');
        if (form) {
          nativeForm = form as HTMLFormElement;
          break;
        }
        nextRow = nextRow.nextElementSibling;
      }
    }
    if (nativeForm) break;
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!nativeForm) {
    throw new Error('Native comment form failed to instantiate');
  }

  targetContainer.innerHTML = '';
  targetContainer.appendChild(nativeForm);
  renameReplyButtonsToOK();

  const textarea = nativeForm.querySelector('textarea');
  if (textarea) {
    if (draftKey && draftsStore[draftKey]) {
      textarea.value = draftsStore[draftKey];
    }
    textarea.focus();

    if (draftKey) {
      textarea.addEventListener('input', () => {
        saveDraft(draftKey, textarea.value);
      });
    }

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        interceptSubmit(e);
      }
    });
  }

  const interceptSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const body = textarea?.value.trim() || '';
    if (!body) return;

    if (textarea) {
      textarea.value = '';
    }
    if (draftKey) {
      saveDraft(draftKey, '');
    }

    const submitBtn =
      (nativeForm?.querySelector(
        'button[type="submit"], button.btn-primary, button.js-addition-comment-submit, button.js-comment-submit-button, input[type="submit"]'
      ) as HTMLElement | null) ||
      ((e.target as HTMLElement | null)?.closest('button') as HTMLElement | null);
    try {
      submitBtn?.setAttribute('disabled', 'true');
      submitBtn?.classList.add('loading');
      if (textarea) textarea.disabled = true;

      await onSubmit(body);
      nativeForm?.remove();
      cleanupListeners();
    } catch (err) {
      alert('Failed to save comment: ' + err);
      if (textarea) {
        textarea.value = body;
        textarea.disabled = false;
      }
      if (draftKey) {
        saveDraft(draftKey, body);
      }
    } finally {
      submitBtn?.removeAttribute('disabled');
      submitBtn?.classList.remove('loading');
      if (textarea) textarea.disabled = false;
    }
  };

  const interceptCancel = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (draftKey) {
      saveDraft(draftKey, '');
    }
    if (textarea) {
      textarea.value = '';
    }
    nativeForm?.remove();
    cleanupListeners();
    onCancel();
  };

  const formSubmitHandler = (e: Event) => {
    interceptSubmit(e);
  };

  nativeForm.addEventListener('submit', formSubmitHandler);

  const submitButtons = nativeForm.querySelectorAll(
    'button[type="submit"], button.btn-primary, button.js-addition-comment-submit, button.js-comment-submit-button, input[type="submit"], button[data-confirm-text]'
  );
  submitButtons.forEach((btn) => {
    btn.addEventListener('click', formSubmitHandler);
  });

  const cancelBtn = nativeForm.querySelector(
    '.js-cancel-comment, button.js-cancel-comment-button, button[class*="cancel"]'
  );
  cancelBtn?.addEventListener('click', interceptCancel);

  function cleanupListeners() {
    nativeForm?.removeEventListener('submit', formSubmitHandler);
    submitButtons.forEach((btn) => {
      btn.removeEventListener('click', formSubmitHandler);
    });
    cancelBtn?.removeEventListener('click', interceptCancel);
  }
}

function showFallbackReplyComposer(
  replyWrapper: HTMLElement,
  onSubmit: (body: string) => Promise<void>,
  onCancel: () => void,
  draftKey?: string
) {
  replyWrapper.innerHTML = `
    <div class="fallback-reply-composer" style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
      <textarea class="fallback-reply-textarea" placeholder="Write a reply..." style="width: 100%; min-height: 80px; padding: 8px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: var(--composer-bg); color: var(--text-primary); font-size: 13px; resize: vertical; outline: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; box-sizing: border-box;"></textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="fallback-cancel-btn btn btn-sm" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;">Cancel</button>
        <button class="fallback-submit-btn btn btn-sm btn-primary" style="padding: 4px 14px; border-radius: 6px; border: none; background-color: var(--accent-color); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;">OK</button>
      </div>
    </div>
  `;

  const textarea = replyWrapper.querySelector('.fallback-reply-textarea') as HTMLTextAreaElement;
  const submitBtn = replyWrapper.querySelector('.fallback-submit-btn') as HTMLButtonElement;
  const cancelBtn = replyWrapper.querySelector('.fallback-cancel-btn') as HTMLButtonElement;

  if (draftKey && draftsStore[draftKey]) {
    textarea.value = draftsStore[draftKey];
  }

  textarea.focus();

  if (draftKey) {
    textarea.addEventListener('input', () => {
      saveDraft(draftKey, textarea.value);
    });
  }

  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  });

  const handleCancel = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (draftKey) {
      saveDraft(draftKey, '');
    }
    textarea.value = '';
    onCancel();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const body = textarea.value.trim();
    if (!body) return;

    textarea.value = '';
    if (draftKey) {
      saveDraft(draftKey, '');
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    textarea.disabled = true;
    try {
      await onSubmit(body);
    } catch (e) {
      alert('Failed to save reply: ' + e);
      textarea.value = body;
      if (draftKey) {
        saveDraft(draftKey, body);
      }
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      textarea.disabled = false;
    }
  };

  cancelBtn.addEventListener('click', handleCancel);
  submitBtn.addEventListener('click', handleSubmit);
}

function highlightTextInElement(
  el: HTMLElement,
  searchText: string,
  commentId: string,
  isPending = false
) {
  if (!searchText) return;
  const normalizedSearch = searchText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalizedSearch) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Text;
  while ((node = walker.nextNode() as Text)) {
    const parent = node.parentNode as HTMLElement;
    if (
      parent &&
      (parent.classList.contains('md-comments-highlight') ||
        parent.closest('.md-comments-add-btn') ||
        parent.closest('.md-comments-indicator-container') ||
        parent.closest('.md-comments-inline-thread') ||
        parent.closest('.md-comments-para-actions'))
    ) {
      continue;
    }
    textNodes.push(node);
  }

  let fullRawText = '';
  const textNodesWithOffsets = textNodes.map((n) => {
    const val = n.nodeValue || '';
    const start = fullRawText.length;
    fullRawText += val;
    const end = fullRawText.length;
    return { node: n, start, end };
  });

  const escaped = searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = escaped.replace(/\s+/g, '\\s+');
  let regex: RegExp;
  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    regex = new RegExp(pattern, 'gi');
  } catch (e) {
    return;
  }

  const matches: { start: number; end: number }[] = [];
  let match;
  while ((match = regex.exec(fullRawText)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  for (const nodeInfo of textNodesWithOffsets) {
    const { node: n, start: nodeStart, end: nodeEnd } = nodeInfo;
    const val = n.nodeValue || '';
    const overlaps = matches
      .filter((m) => Math.max(m.start, nodeStart) < Math.min(m.end, nodeEnd))
      .sort((a, b) => a.start - b.start);

    if (overlaps.length === 0) continue;

    const parent = n.parentNode;
    if (!parent) continue;

    const newNodes: Node[] = [];
    let lastIndex = 0;

    for (const overlap of overlaps) {
      const localStart = Math.max(0, overlap.start - nodeStart);
      const localEnd = Math.min(val.length, overlap.end - nodeStart);

      if (localStart > lastIndex) {
        newNodes.push(document.createTextNode(val.slice(lastIndex, localStart)));
      }

      const span = document.createElement('span');
      span.className = isPending
        ? 'md-comments-highlight pending'
        : 'md-comments-highlight';
      if (isPending) {
        span.setAttribute('data-pending', 'true');
      }
      span.dataset.commentId = commentId;
      span.textContent = val.slice(localStart, localEnd);
      newNodes.push(span);

      lastIndex = localEnd;
    }

    if (lastIndex < val.length) {
      newNodes.push(document.createTextNode(val.slice(lastIndex)));
    }

    for (const newNode of newNodes) {
      parent.insertBefore(newNode, n);
    }
    n.remove();
  }
}

let activePendingHighlightParams: {
  filePath?: string;
  paragraphIndex?: number;
  anchorHash?: string;
  anchorText?: string;
} | null = null;

function clearPendingHighlights() {
  document.querySelectorAll('.md-comments-highlight.pending, [data-pending="true"]').forEach((node) => {
    const parent = node.parentNode;
    if (parent) {
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      parent.normalize();
    }
  });
  activePendingHighlightParams = null;
}

function applyPendingHighlight(
  filePath: string,
  paragraphIndex: number,
  anchorHash: string,
  anchorText: string
) {
  clearPendingHighlights();
  if (!anchorText || !anchorText.trim()) return;

  activePendingHighlightParams = { filePath, paragraphIndex, anchorHash, anchorText };

  const markdownBodies = document.querySelectorAll('.markdown-body');
  markdownBodies.forEach((markdownBody) => {
    const domElements = findDomParagraphs(markdownBody as HTMLElement);
    let targetEl: HTMLElement | null = null;

    const ctx = loadedFileContexts.get(filePath);
    if (ctx && ctx.anchors) {
      const block = ctx.anchors.find(
        (b) => b.paragraph_index === paragraphIndex || b.anchor_hash === anchorHash
      );
      if (block) {
        for (const el of domElements) {
          const text = normalizeAnchorText(el.innerText);
          const hash = fnv1aHash(text);
          if (hash === block.anchor_hash || fuzzyMatch(text, block.anchor_text)) {
            targetEl = el;
            break;
          }
        }
      }
    }

    if (!targetEl && domElements[paragraphIndex]) {
      targetEl = domElements[paragraphIndex];
    }

    if (targetEl) {
      highlightTextInElement(targetEl, anchorText, 'pending-new-inline', true);
    }
  });
}

let activeSidebarHost: HTMLElement | null = null;

function injectSidebar() {
  syncTheme();
  const isEmbedded = activeSidebarHost && activeSidebarHost.id === 'md-comments-sidebar-embedded';

  if (!activeSidebarHost) {
    activeSidebarHost = document.createElement('div');
    activeSidebarHost.id = 'md-comments-sidebar';
    activeSidebarHost.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: 380px;
      z-index: 999999;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -8px 0 32px rgba(0,0,0,0.35);
    `;
    activeSidebarHost.className = 'sidebar-container md-comments-scope';
    document.body.appendChild(activeSidebarHost);
  }

  if (activeSidebarHost.querySelector('.tab-header')) return;

  activeSidebarHost.innerHTML = `
    <div class="sidebar-header">
      <div class="title-section">
        <h3>Markdown Comments</h3>
      </div>
      ${isEmbedded ? '' : '<button class="close-btn">&times;</button>'}
    </div>

    <div class="unauthorized-container" style="display: none; flex-direction: column; flex: 1; padding: 16px;"></div>

    <div class="tab-header">
      <button class="tab-btn active" data-tab="inline">Inline Comments</button>
      <button class="tab-btn" data-tab="page">Page Discussion</button>
    </div>

    <div class="tab-content" id="tab-inline" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="new-inline-composer-wrapper" style="display: none; padding: 16px; border-bottom: 1px solid var(--sidebar-border);">
        <div class="composer-header" style="font-size: 12px; margin-bottom: 8px; color: var(--text-secondary);">New Comment on: <em class="anchor-text-preview" style="font-style: italic;"></em></div>
        <div class="new-inline-composer-container" style="min-height: 100px;"></div>
      </div>
      <div class="threads-list" id="inline-threads" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1;"></div>
    </div>

    <div class="tab-content" id="tab-page" style="display: none; flex-direction: column; flex: 1; min-height: 0;">
      <div class="threads-list" id="page-threads" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1;"></div>
      <div class="page-composer" style="padding: 16px; border-top: 1px solid var(--sidebar-border); display: flex; flex-direction: column; gap: 8px;">
        <textarea placeholder="Write a page comment..." class="page-textarea" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: var(--composer-bg); color: var(--text-primary); font-size: 13px; min-height: 80px; font-family: inherit; resize: vertical; outline: none;"></textarea>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary submit-page-btn" style="padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: none; background-color: var(--accent-color); color: white; cursor: pointer;">Send</button>
        </div>
      </div>
    </div>
  `;

  // Register events
  if (!isEmbedded) {
    activeSidebarHost.querySelector('.close-btn')?.addEventListener('click', closeSidebar);
  }

  const tabButtons = activeSidebarHost.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));

      const tabInline = activeSidebarHost?.querySelector('#tab-inline') as HTMLElement;
      const tabPage = activeSidebarHost?.querySelector('#tab-page') as HTMLElement;
      if (tabInline) tabInline.style.display = 'none';
      if (tabPage) tabPage.style.display = 'none';

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      if (tabId === 'inline' && tabInline) {
        tabInline.style.display = 'flex';
      } else if (tabId === 'page' && tabPage) {
        tabPage.style.display = 'flex';
      }
    });
  });

  // Submit new page comment
  activeSidebarHost.querySelector('.submit-page-btn')?.addEventListener('click', async () => {
    const btn = activeSidebarHost?.querySelector('.submit-page-btn') as HTMLButtonElement;
    const textarea = activeSidebarHost?.querySelector('.page-textarea') as HTMLTextAreaElement;
    const body = textarea?.value.trim();
    if (!body) return;

    textarea.value = '';
    const pageDraftKey = getDraftKey('page');
    saveDraft(pageDraftKey, '');

    textarea.disabled = true;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('loading');
    }
    try {
      await saveNewPageComment(body);
    } catch (e) {
      alert('Failed to save comment: ' + e);
      if (textarea) textarea.value = body;
      saveDraft(pageDraftKey, body);
    } finally {
      if (textarea) textarea.disabled = false;
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    }
  });

  // Page comment draft handling
  const pageTextarea = activeSidebarHost.querySelector('.page-textarea') as HTMLTextAreaElement;
  if (pageTextarea) {
    const pageDraftKey = getDraftKey('page');
    if (pageDraftKey && draftsStore[pageDraftKey]) {
      pageTextarea.value = draftsStore[pageDraftKey];
    }
    pageTextarea.addEventListener('input', () => {
      saveDraft(pageDraftKey, pageTextarea.value);
    });
    pageTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        activeSidebarHost
          ?.querySelector('.submit-page-btn')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  }

  if (!isEmbedded) {
    document.body.appendChild(activeSidebarHost);
  }
}

function openSidebar(tab: 'inline' | 'page' = 'inline', highlightCommentId?: string) {
  chrome.storage.local.set({ sidebarOpenState: true }).catch(() => {});
  injectSidebar();
  if (!activeSidebarHost) return;

  document.body.classList.add('md-comments-push-active');
  activeSidebarHost.style.transform = 'translateX(0px)';

  // Set tab
  const tabBtn = activeSidebarHost.querySelector(
    `.tab-btn[data-tab="${tab}"]`
  ) as HTMLButtonElement;
  tabBtn?.click();

  renderSidebarComments();

  if (highlightCommentId) {
    setTimeout(() => {
      const commentEl = activeSidebarHost?.querySelector(
        `#comment-${highlightCommentId}`
      ) as HTMLElement;
      if (commentEl) {
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentEl.style.backgroundColor = 'rgba(88, 166, 255, 0.15)';
        setTimeout(() => {
          commentEl.style.backgroundColor = '';
        }, 2000);
      }
    }, 100);
  }
}

function closeSidebar() {
  chrome.storage.local.set({ sidebarOpenState: false }).catch(() => {});
  if (!activeSidebarHost) return;
  activeSidebarHost.style.transform = 'translateX(100%)';
  document.body.classList.remove('md-comments-push-active');
}

function renderInstallationPrompt(
  owner: string,
  repo: string,
  installed: boolean,
  appSlug?: string,
  installationId?: number
): string {
  const slug = appSlug || 'markdown-comments';
  const installUrl = `https://github.com/apps/${slug}/installations/new`;
  const configureUrl = installationId
    ? `https://github.com/settings/installations/${installationId}`
    : `https://github.com/apps/${slug}/installations/new`;

  const githubIcon = `<svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle;"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>`;
  const gearIcon = `<svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle;"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.402.09 10 .652 10 1.36v.057c0 .825.568 1.528 1.378 1.71a1.86 1.86 0 0 0 1.597-.478c.517-.463 1.332-.424 1.815.115l.009.01c.484.538.484 1.353-.004 1.89l-.01.011a1.86 1.86 0 0 0-.47 1.595c.18.808.88 1.376 1.706 1.376h.057c.71 0 1.272.597 1.33 1.298C16 9.176 16 9.587 16 10a8.2 8.2 0 0 1-.031.704c-.058.699-.62 1.261-1.33 1.261h-.057c-.825 0-1.528.568-1.71 1.378a1.86 1.86 0 0 0 .478 1.597c.463.517.424 1.332-.115 1.815l-.01.009c-.538.484-1.353.484-1.89-.004l-.011-.01a1.86 1.86 0 0 0-1.595-.47c-.808.18-1.376.88-1.376 1.706v.057c0 .71-.597 1.272-1.298 1.33C9.176 16 8.587 16 8 16a8.2 8.2 0 0 1-.704-.031c-.699-.058-1.261-.62-1.261-1.33v-.057c0-.825-.568-1.528-1.378-1.71a1.86 1.86 0 0 0-1.597.478c-.517.463-1.332.424-1.815-.115l-.009-.01c-.484-.538-.484-1.353.004-1.89l.01-.011a1.86 1.86 0 0 0 .47-1.595c-.18-.808-.88-1.376-1.706-1.376h-.057c-.71 0-1.272-.597-1.33-1.298C0 10.824 0 10.413 0 10a8.2 8.2 0 0 1 .031-.704c.058-.699.62-1.261 1.33-1.261h.057c.825 0 1.528-.568 1.71-1.378a1.86 1.86 0 0 0-.478-1.597c-.463-.517-.424-.115-1.815-.115h-.01c-.538-.484-1.353-.484-1.89.004l-.011.01a1.86 1.86 0 0 0 1.595.47c.808-.18 1.376-.88 1.376-1.706v-.057c0-.71.597-1.272 1.298-1.33C6.824 0 7.413 0 8 0Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>`;

  if (!installed) {
    return `
      <div class="oauth-prompt-banner" style="margin: 12px 16px; padding: 14px; border-radius: 8px; background: rgba(240, 180, 0, 0.1); border: 1px solid rgba(240, 180, 0, 0.3); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px;">
          ⚠️ GitHub App Not Installed
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
          The Markdown Comments GitHub App must be installed on the <strong>${escapeHtml(owner)}</strong> account to store and load comments.
        </div>
        <a href="${installUrl}" target="_blank" style="text-decoration: none;">
          <button class="btn btn-primary" style="background-color: #238636; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
            ${githubIcon}
            Install
          </button>
        </a>
        <button class="btn check-installation-btn" style="background: none; border: 1px solid var(--sidebar-border); color: var(--text-primary); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
          Check installation status again
        </button>
      </div>
    `;
  } else {
    return `
      <div class="oauth-prompt-banner" style="margin: 12px 16px; padding: 14px; border-radius: 8px; background: rgba(240, 180, 0, 0.1); border: 1px solid rgba(240, 180, 0, 0.3); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px;">
          ⚠️ Access Not Authorized
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
          The Markdown Comments GitHub App is installed on <strong>${escapeHtml(owner)}</strong>, but does not have access to <strong>${escapeHtml(repo)}</strong>.
        </div>
        <a href="${configureUrl}" target="_blank" style="text-decoration: none;">
          <button class="btn" style="background-color: var(--accent-color); color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
            ${gearIcon}
            Configure
          </button>
        </a>
        <button class="btn check-installation-btn" style="background: none; border: 1px solid var(--sidebar-border); color: var(--text-primary); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
          Check installation status again
        </button>
      </div>
    `;
  }
}

function attachInstallationPromptEvents(container: HTMLElement) {
  const checkBtn = container.querySelector('.check-installation-btn') as HTMLButtonElement | null;
  if (!checkBtn) return;

  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    const originalText = checkBtn.innerText;
    checkBtn.innerText = 'Checking...';

    if (currentMetadata && currentToken) {
      if (!githubApi) {
        githubApi = new GitHubApi(currentToken);
      }
      try {
        const status = await githubApi.checkAppInstallation(
          currentMetadata.owner,
          currentMetadata.repo
        );
        appInstallationStatus = {
          checked: true,
          installed: status.installed,
          repoAccess: status.repoAccess,
          appSlug: status.appSlug,
          installationId: status.installationId,
        };

        if (appInstallationStatus.installed && appInstallationStatus.repoAccess) {
          const meta = parseGitHubUrl(window.location.href);
          if (meta && meta.type === 'blob') {
            await loadDocumentComments(meta);
          } else {
            renderSidebarComments();
          }
        } else {
          renderSidebarComments();
        }
      } catch (err) {
        console.error('[md-comments] Error checking installation status:', err);
        checkBtn.disabled = false;
        checkBtn.innerText = originalText;
      }
    } else {
      checkBtn.disabled = false;
      checkBtn.innerText = originalText;
    }
  });
}

function renderOAuthPrompt(owner: string): string {
  if (currentToken) return '';
  const githubIcon = `<svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle;"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>`;

  return `
    <div class="oauth-prompt-banner" style="margin: 12px 16px; padding: 14px; border-radius: 8px; background: rgba(56, 139, 253, 0.1); border: 1px solid rgba(56, 139, 253, 0.3); display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px;">
        🔒 Permission Required
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
        Authorize to store and sync comments on your behalf.
      </div>
      <button class="btn oauth-login-btn" style="background-color: #238636; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
        Authorize
      </button>
      <div class="oauth-status-text" style="font-size: 11px; color: var(--text-secondary); display: none;"></div>
      
      <div style="border-top: 1px solid rgba(56, 139, 253, 0.2); margin-top: 10px; padding-top: 10px; opacity: 0.85;">
        <div style="font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          ⚙️ GitHub App
        </div>
        <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 10px;">
          The <a href="https://github.com/apps/markdown-comments" target="_blank" style="text-decoration: underline; color: inherit; font-weight: 500;">MD Comments</a> GitHub App must also be installed in the <strong>${escapeHtml(owner)}</strong> organization/repository to allow the extension to store and sync comments (via custom git refs) for collaboration.
        </div>
        <button class="btn" disabled style="background-color: var(--sidebar-border); color: var(--text-secondary); border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
          ${githubIcon}
          Install
        </button>
      </div>
    </div>
  `;
}

function attachOAuthEvents(container: HTMLElement) {
  const oauthBtn = container.querySelector('.oauth-login-btn') as HTMLButtonElement;
  const statusEl = container.querySelector('.oauth-status-text') as HTMLElement;

  if (oauthBtn) {
    oauthBtn.addEventListener('click', () => {
      oauthBtn.disabled = true;
      oauthBtn.classList.add('loading');
      if (statusEl) {
        statusEl.style.display = 'none';
      }

      const clientId = 'Iv23li9t461keXDcVS0T';

      chrome.runtime.sendMessage(
        {
          type: 'START_DEVICE_FLOW',
          clientId,
        },
        (response) => {
          oauthBtn.classList.remove('loading');
          if (
            response &&
            response.success &&
            response.userCode &&
            response.verificationUri &&
            response.deviceCode
          ) {
            if (oauthBtn) {
              oauthBtn.style.display = 'none';
            }
            const { userCode, verificationUri, deviceCode, interval } = response;
            // Copy to clipboard
            navigator.clipboard.writeText(userCode).catch(() => {});

            // Store code in local storage so it can be autofilled on the device page
            chrome.storage.local.set({ pendingUserCode: userCode }).catch(() => {});

            const prefilledUrl = `${verificationUri}?user_code=${userCode}`;
            if (statusEl) {
              statusEl.style.display = 'block';
              statusEl.innerHTML = `
                <div class="auth-status-flow" style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border: 1px solid var(--sidebar-border);">
                  <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">1. Verification Code</div>
                  <div style="display: flex; align-items: center; justify-content: space-between; background: var(--composer-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--sidebar-border);">
                    <code id="auth-user-code" style="font-family: monospace; font-size: 18px; font-weight: bold; color: var(--accent-color); letter-spacing: 1px;">${userCode}</code>
                    <button id="auth-copy-btn" class="btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; font-size: 11px; display: flex; align-items: center; gap: 6px;" title="Copy to clipboard">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
                      <span id="auth-copy-text">Copy</span>
                    </button>
                  </div>
                  <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 4px;">2. Complete Activation</div>
                  <a href="${prefilledUrl}" target="_blank" style="text-decoration: none;" id="auth-activation-link">
                    <button class="btn" style="background-color: var(--accent-color); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                      Open Activation Page
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5A1.75 1.75 0 0 1 3.75 2Z"/><path d="M9 1.75A.75.75 0 0 1 9.75 1h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V3.56L9.53 8.28a.75.75 0 0 1-1.06-1.06l4.72-4.72H9.75A.75.75 0 0 1 9 1.75Z"/></svg>
                    </button>
                  </a>
                  <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 4px;">3. Click <span style="color: var(--accent-color);">Continue</span> on GitHub</div>
                  <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 4px;">4. Click <span style="color: var(--accent-color);">Authorize</span> on GitHub</div>
                </div>
              `;

              const copyBtn = statusEl.querySelector('#auth-copy-btn');
              if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard
                    .writeText(userCode)
                    .then(() => {
                      const copyText = statusEl.querySelector('#auth-copy-text');
                      if (copyText) copyText.textContent = 'Copied!';
                      setTimeout(() => {
                        if (copyText) copyText.textContent = 'Copy';
                      }, 2000);
                    })
                    .catch(() => {});
                });
              }
            }
            window.open(prefilledUrl, '_blank');

            // Start polling directly in active content script context using recursive setTimeout
            let currentInterval = Math.max(interval || 5, 5) * 1000;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let _pollTimeoutId: any = null;

            const poll = () => {
              console.log('[md-comments] Sending CHECK_DEVICE_TOKEN message to background...');
              chrome.runtime.sendMessage(
                {
                  type: 'CHECK_DEVICE_TOKEN',
                  clientId,
                  deviceCode,
                },
                async (pollRes) => {
                  console.log('[md-comments] CHECK_DEVICE_TOKEN response:', pollRes);
                  if (pollRes && pollRes.success && pollRes.data) {
                    const data = pollRes.data;
                    if (data.access_token) {
                      console.log('[md-comments] Successfully obtained access token!');
                      await saveOAuthToken(data.access_token);
                      currentToken = data.access_token;
                      githubApi = new GitHubApi(data.access_token);
                      if (statusEl) statusEl.innerText = '✅ Authorized with GitHub!';
                      setTimeout(() => {
                        const meta = parseGitHubUrl(window.location.href);
                        if (meta && meta.type === 'blob') loadDocumentComments(meta);
                      }, 500);
                      return; // Stop polling
                    }

                    if (data.error) {
                      if (data.error === 'slow_down') {
                        // Increase interval as requested by GitHub
                        const newIntervalSec = data.interval || currentInterval / 1000 + 5;
                        currentInterval = newIntervalSec * 1000;
                        console.log(
                          `[md-comments] GitHub requested slow_down. Increasing polling interval to ${newIntervalSec} seconds.`
                        );
                      } else if (data.error !== 'authorization_pending') {
                        console.warn(
                          '[md-comments] Polling aborted due to error:',
                          data.error_description || data.error
                        );
                        if (statusEl) {
                          statusEl.innerHTML = `<span style="color: var(--warn-color); font-size: 11px;">Error: ${data.error_description || data.error}</span>`;
                        }
                        oauthBtn.disabled = false;
                        oauthBtn.style.display = 'block';
                        oauthBtn.classList.remove('loading');
                        return; // Stop polling
                      } else {
                        console.log('[md-comments] Authorization still pending...');
                      }
                    }
                  } else {
                    console.error(
                      '[md-comments] Background poll failed:',
                      pollRes?.error || 'Unknown error'
                    );
                  }

                  // Schedule next poll
                  _pollTimeoutId = setTimeout(poll, currentInterval);
                }
              );
            };

            // Schedule first poll
            _pollTimeoutId = setTimeout(poll, currentInterval);
          } else {
            const err = response?.error || 'Failed to start device flow authorization.';
            console.error('[md-comments] START_DEVICE_FLOW failed:', err);
            if (statusEl) {
              statusEl.innerHTML = `<span style="color: var(--warn-color); font-size: 11px;">Error: ${err}</span>`;
            }
            oauthBtn.disabled = false;
          }
        }
      );
    });
  }
}

function renderSidebarComments() {
  if (!activeSidebarHost) return;
  console.log(
    '[md-comments-debug] renderSidebarComments loadedComments:',
    JSON.stringify(loadedComments)
  );

  getDisplayAuthor().then((author) => {
    currentDisplayAuthor = author;

    const unauthContainer = activeSidebarHost!.querySelector(
      '.unauthorized-container'
    ) as HTMLElement | null;
    const tabHeader = activeSidebarHost!.querySelector('.tab-header') as HTMLElement | null;
    const tabInline = activeSidebarHost!.querySelector('#tab-inline') as HTMLElement | null;
    const tabPage = activeSidebarHost!.querySelector('#tab-page') as HTMLElement | null;

    const inlineList = activeSidebarHost!.querySelector('#inline-threads');
    const pageList = activeSidebarHost!.querySelector('#page-threads');

    const metaForOwner = parseGitHubUrl(window.location.href);
    const ownerName = metaForOwner?.owner || currentMetadata?.owner || 'organization';
    const oauthPromptHtml = renderOAuthPrompt(ownerName);

    if (currentToken) {
      if (
        appInstallationStatus.checked &&
        (!appInstallationStatus.installed || !appInstallationStatus.repoAccess)
      ) {
        if (unauthContainer) {
          unauthContainer.style.display = 'flex';
          unauthContainer.innerHTML = renderInstallationPrompt(
            currentMetadata?.owner || '',
            currentMetadata?.repo || '',
            appInstallationStatus.installed,
            appInstallationStatus.appSlug,
            appInstallationStatus.installationId
          );
          attachInstallationPromptEvents(unauthContainer);
        }
        if (tabHeader) tabHeader.style.display = 'none';
        if (tabInline) tabInline.style.display = 'none';
        if (tabPage) tabPage.style.display = 'none';

        const pageComposer = activeSidebarHost!.querySelector(
          '.page-composer'
        ) as HTMLElement | null;
        if (pageComposer) {
          pageComposer.style.display = 'none';
        }
      } else {
        if (unauthContainer) unauthContainer.style.display = 'none';
        if (tabHeader) tabHeader.style.display = 'flex';

        const activeTabBtn = activeSidebarHost!.querySelector(
          '.tab-btn.active'
        ) as HTMLElement | null;
        const activeTab = activeTabBtn?.getAttribute('data-tab') || 'inline';
        if (tabInline) tabInline.style.display = activeTab === 'inline' ? 'flex' : 'none';
        if (tabPage) tabPage.style.display = activeTab === 'page' ? 'flex' : 'none';

        const pageComposer = activeSidebarHost!.querySelector(
          '.page-composer'
        ) as HTMLElement | null;
        if (pageComposer) {
          pageComposer.style.display = 'flex';
        }

        if (inlineList) {
          if (loadedComments.inline_comments.length === 0) {
            inlineList.innerHTML =
              '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No inline comments yet. Hover over paragraphs to add feedback.</div>';
          } else {
            inlineList.innerHTML = loadedComments.inline_comments
              .map((c) => renderCommentCard(c, 'inline'))
              .join('');
            attachCommentCardEvents(inlineList as HTMLElement, 'inline');
          }
        }

        if (pageList) {
          if (loadedComments.page_comments.length === 0) {
            pageList.innerHTML =
              '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No page discussion comments yet. Use the composer below to start.</div>';
          } else {
            pageList.innerHTML = loadedComments.page_comments
              .map((c) => renderCommentCard(c, 'page'))
              .join('');
            attachCommentCardEvents(pageList as HTMLElement, 'page');
          }
        }
      }
    } else {
      if (unauthContainer) {
        unauthContainer.style.display = 'flex';
        unauthContainer.innerHTML = oauthPromptHtml;
        attachOAuthEvents(unauthContainer);
      }
      if (tabHeader) tabHeader.style.display = 'none';
      if (tabInline) tabInline.style.display = 'none';
      if (tabPage) tabPage.style.display = 'none';

      const pageComposer = activeSidebarHost!.querySelector('.page-composer') as HTMLElement | null;
      if (pageComposer) {
        pageComposer.style.display = 'none';
      }
    }
  });
}

function renderCommentCard(comment: InlineComment | PageComment, type: 'inline' | 'page'): string {
  const isInline = type === 'inline';
  const inlineComment = comment as InlineComment;
  const isAuthor =
    comment.author &&
    currentDisplayAuthor &&
    comment.author.trim().toLowerCase() === currentDisplayAuthor.trim().toLowerCase();

  let headerContextHtml = '';
  if (isInline) {
    headerContextHtml = `
      <div class="comment-context" style="margin-bottom: 8px; font-size: 11px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span class="context-heading" style="color: var(--accent-color); font-weight: 600;">${inlineComment.heading_context || 'Top level'}</span>
        ${inlineComment.orphaned ? `<span class="context-badge orphan" style="background-color: rgba(210, 153, 34, 0.15); color: var(--warn-color); border: 1px solid rgba(210, 153, 34, 0.3); font-size: 9px; padding: 1px 4px; border-radius: 10px;">Orphaned</span>` : ''}
        ${inlineComment.resolved ? `<span class="context-badge resolved" style="background-color: rgba(63, 185, 80, 0.15); color: var(--success-color); border: 1px solid rgba(63, 185, 80, 0.3); font-size: 9px; padding: 1px 4px; border-radius: 10px;">Resolved</span>` : ''}
      </div>
      ${
        inlineComment.anchor_text
          ? `
        <div class="comment-anchor-quote" style="border-left: 2px solid var(--sidebar-border); padding-left: 8px; color: var(--text-secondary); font-size: 12px; font-style: italic; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${escapeHtml(inlineComment.anchor_text)}"</div>
      `
          : ''
      }
    `;
  } else {
    const pageComment = comment as PageComment;
    headerContextHtml = `
      <div class="comment-context" style="margin-bottom: 8px;">
        ${pageComment.resolved ? `<span class="context-badge resolved" style="background-color: rgba(63, 185, 80, 0.15); color: var(--success-color); border: 1px solid rgba(63, 185, 80, 0.3); font-size: 9px; padding: 1px 4px; border-radius: 10px;">Resolved</span>` : ''}
      </div>
    `;
  }

  const repliesHtml = comment.replies
    .map((r) => {
      const isReplyAuthor =
        r.author &&
        currentDisplayAuthor &&
        r.author.trim().toLowerCase() === currentDisplayAuthor.trim().toLowerCase();
      return `
      <div class="reply-item" id="reply-${r.id}" data-reply-id="${r.id}">
        <img class="avatar" src="https://github.com/${encodeURIComponent(r.author)}.png?size=32" alt="${escapeHtml(r.author)}">
        <div class="reply-content">
          <div class="reply-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div>
              ${renderAuthor(r.author)}
              <span class="time">${formatRelativeTime(r.created_at)}</span>
            </div>
            ${
              isWritable && isReplyAuthor
                ? `
              <div class="reply-actions" style="display: flex; gap: 4px;">
                <button class="icon-action-btn edit-reply-btn" title="Edit Reply">${ICON_EDIT}</button>
                <button class="icon-action-btn delete-reply-btn" title="Delete Reply">${ICON_DELETE}</button>
              </div>
            `
                : ''
            }
          </div>
          <div class="reply-body" style="font-size: 12px; color: var(--text-primary); word-break: break-word; line-height: 1.4; margin-top: 2px;">${escapeHtml(r.body)}</div>
        </div>
      </div>
    `;
    })
    .join('');

  return `
    <div class="comment-card" id="comment-${comment.id}" data-id="${comment.id}" style="border: 1px solid var(--sidebar-border); border-radius: 6px; background-color: var(--card-bg); padding: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; margin-bottom: 12px;">
      ${headerContextHtml}
      <div class="comment-header" style="display: flex; gap: 8px; align-items: flex-start; justify-content: space-between;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <img class="avatar" src="https://github.com/${encodeURIComponent(comment.author)}.png?size=40" alt="${escapeHtml(comment.author)}" style="width: 28px; height: 28px; border-radius: 4px;">
          <div class="comment-meta" style="display: flex; flex-direction: column;">
            ${renderAuthor(comment.author)}
            <span class="time" style="font-size: 11px; color: var(--text-secondary);">${formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>
        ${
          isWritable
            ? `
          <div class="comment-actions" style="display: flex; gap: 6px; align-items: center;">
            ${
              isAuthor
                ? `
              <button class="icon-action-btn edit-comment-btn" title="Edit Comment">${ICON_EDIT}</button>
              <button class="icon-action-btn delete-comment-btn" title="Delete Comment">${ICON_DELETE}</button>
            `
                : ''
            }
            ${
              !comment.resolved
                ? `
              <button class="icon-action-btn resolve-btn" title="Resolve Thread">${ICON_RESOLVE}</button>
            `
                : `
              <button class="icon-action-btn unresolve-btn" title="Reopen Thread">${ICON_REOPEN}</button>
            `
            }
          </div>
        `
            : ''
        }
      </div>
      <div class="comment-body" style="font-size: 13px; color: var(--text-primary); white-space: pre-wrap; line-height: 1.4; margin-top: 4px;">${escapeHtml(comment.body)}</div>
      
      ${comment.replies.length > 0 ? `<div class="replies-section">${repliesHtml}</div>` : ''}

      ${
        isWritable && !comment.resolved
          ? `
        <div class="reply-composer">
          <input type="text" placeholder="Reply..." class="reply-input">
          <div class="reply-composer-wrapper" style="display: none; min-height: 100px;"></div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

let activeTooltipEl: HTMLElement | null = null;

function hideCommentTooltip() {
  if (activeTooltipEl) {
    activeTooltipEl.remove();
    activeTooltipEl = null;
  }
}

function showCommentTooltip(targetEl: HTMLElement, commentId: string) {
  hideCommentTooltip();
  const comment = loadedComments.inline_comments.find((c) => c.id === commentId);
  if (!comment) return;

  const tooltip = document.createElement('div');
  tooltip.className = 'md-comments-tooltip md-comments-scope arrow-bottom';
  const bodyText = comment.body.length > 150 ? comment.body.slice(0, 150) + '…' : comment.body;
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <img class="tooltip-avatar" src="https://github.com/${encodeURIComponent(comment.author)}.png?size=32" alt="${escapeHtml(comment.author)}">
      <span class="tooltip-author">${escapeHtml(comment.author)}</span>
      <span class="tooltip-time">${formatRelativeTime(comment.created_at)}</span>
    </div>
    <div class="tooltip-body">${escapeHtml(bodyText)}</div>
  `;

  document.body.appendChild(tooltip);
  activeTooltipEl = tooltip;

  const rect = targetEl.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = rect.top + window.scrollY - tooltipRect.height - 8;
  let left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;

  if (top < window.scrollY + 8) {
    top = rect.bottom + window.scrollY + 8;
    tooltip.classList.remove('arrow-bottom');
    tooltip.classList.add('arrow-top');
  }

  if (left < 8) left = 8;
  if (left + tooltipRect.width > window.innerWidth - 8) {
    left = window.innerWidth - tooltipRect.width - 8;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;

  requestAnimationFrame(() => {
    tooltip.classList.add('visible');
  });
}

function scrollToCommentText(commentId: string) {
  if (!commentId) return;

  // 1. Check for specific highlighted span node with data-comment-id
  let targetEl = document.querySelector(
    `.md-comments-highlight[data-comment-id="${commentId}"]`
  ) as HTMLElement | null;

  // 2. Fallback to paragraph element by index
  if (!targetEl) {
    const inlineComment = loadedComments.inline_comments.find((c) => c.id === commentId);
    if (inlineComment) {
      const pIndex = inlineComment.paragraph_index;
      const markdownBody = document.querySelector('.markdown-body') as HTMLElement;
      if (markdownBody) {
        const paragraphs = findDomParagraphs(markdownBody);
        if (paragraphs[pIndex]) {
          targetEl = paragraphs[pIndex];
        }
      }
      if (!targetEl) {
        const lineEl = document.querySelector(`[data-line="${pIndex + 1}"]`) as HTMLElement;
        if (lineEl) targetEl = lineEl;
      }
    }
  }

  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetEl.classList.add('md-comments-highlight-flash');
    setTimeout(() => {
      targetEl?.classList.remove('md-comments-highlight-flash');
    }, 2000);
  }
}

function attachCommentCardEvents(container: HTMLElement, type: 'inline' | 'page') {
  container.querySelectorAll('.comment-card').forEach((card) => {
    const commentId = card.getAttribute('data-id') || '';

    // Scroll to text when clicking an inline comment card
    if (type === 'inline') {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('a') ||
          target.closest('.comment-edit-form') ||
          target.closest('.reply-composer') ||
          target.closest('.reply-item')
        ) {
          return;
        }
        scrollToCommentText(commentId);
      });
    }

    // Reply click handler
    const replyInput = card.querySelector('.reply-input') as HTMLInputElement;
    const replyWrapper = card.querySelector('.reply-composer-wrapper') as HTMLElement;
    if (replyInput && replyWrapper) {
      const replyDraftKey = getDraftKey('reply:' + commentId);
      const hasReplyDraft = replyDraftKey && draftsStore[replyDraftKey];

      const resetReplyUI = () => {
        replyInput.value = '';
        if (replyDraftKey) {
          saveDraft(replyDraftKey, '');
        }
        const ta = replyWrapper.querySelector('textarea') as HTMLTextAreaElement | null;
        if (ta) ta.value = '';
        replyWrapper.innerHTML = '';
        replyWrapper.style.display = 'none';
        replyInput.style.display = 'block';
      };

      const handleReplyClick = async () => {
        replyInput.style.display = 'none';
        replyWrapper.style.display = 'block';

        if (type === 'page') {
          showFallbackReplyComposer(
            replyWrapper,
            async (body) => {
              await saveReply(commentId, type, body);
              resetReplyUI();
            },
            () => {
              resetReplyUI();
            },
            replyDraftKey
          );
        } else {
          // Find the matching block line
          const inlineComment = loadedComments.inline_comments.find((c) => c.id === commentId);
          const pIndex = inlineComment ? inlineComment.paragraph_index : 0;
          const block = parsedAnchors.find((a) => a.paragraph_index === pIndex);
          const line = block && block.line_number !== undefined ? block.line_number + 1 : 1;

          const meta = parseGitHubUrl(window.location.href);
          if (meta && meta.type === 'pull') {
            try {
              await triggerAndMoveNativeComposer(
                currentMetadata!.filePath,
                line,
                replyWrapper,
                async (body) => {
                  await saveReply(commentId, type, body);
                  resetReplyUI();
                },
                () => {
                  resetReplyUI();
                },
                replyDraftKey
              );
              return;
            } catch (err) {
              console.warn(
                '[md-comments] Trigger native composer for reply failed, falling back:',
                err
              );
            }
          }

          showFallbackReplyComposer(
            replyWrapper,
            async (body) => {
              await saveReply(commentId, type, body);
              resetReplyUI();
            },
            () => {
              resetReplyUI();
            },
            replyDraftKey
          );
        }
      };

      replyInput.addEventListener('click', handleReplyClick);

      if (hasReplyDraft) {
        handleReplyClick();
      }
    }

    // Resolve button
    card.querySelector('.resolve-btn')?.addEventListener('click', async () => {
      try {
        await toggleResolve(commentId, type, true);
      } catch (e) {
        alert('Failed to resolve: ' + e);
      }
    });

    // Unresolve button
    card.querySelector('.unresolve-btn')?.addEventListener('click', async () => {
      try {
        await toggleResolve(commentId, type, false);
      } catch (e) {
        alert('Failed to reopen thread: ' + e);
      }
    });

    // Edit comment button
    const editBtn = card.querySelector('.edit-comment-btn') as HTMLButtonElement;
    if (editBtn) {
      const editDraftKey = getDraftKey('edit:' + commentId);
      const hasEditDraft = editDraftKey && draftsStore[editDraftKey];

      const handleEditClick = (initialValue?: string) => {
        const bodyEl = card.querySelector('.comment-body') as HTMLElement;
        if (!bodyEl) return;

        if (card.querySelector('.comment-edit-textarea')) return;

        const originalBody = bodyEl.innerText;
        const originalContent = bodyEl.innerHTML;

        const draftValue = initialValue !== undefined ? initialValue : originalBody;

        bodyEl.innerHTML = `
          <div class="comment-edit-form" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            <textarea class="comment-edit-textarea form-control" style="width: 100%; min-height: 80px; padding: 8px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: var(--composer-bg); color: var(--text-primary); font-size: 13px; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box;">${escapeHtml(draftValue)}</textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="edit-cancel-btn btn btn-sm" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;">Cancel</button>
              <button class="edit-save-btn btn btn-sm btn-primary" style="padding: 4px 14px; border-radius: 6px; border: none; background-color: var(--accent-color); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;">Save</button>
            </div>
          </div>
        `;

        const textarea = bodyEl.querySelector('.comment-edit-textarea') as HTMLTextAreaElement;
        const saveBtn = bodyEl.querySelector('.edit-save-btn') as HTMLButtonElement;
        const cancelBtn = bodyEl.querySelector('.edit-cancel-btn') as HTMLButtonElement;

        textarea.focus();

        if (editDraftKey) {
          textarea.addEventListener('input', () => {
            saveDraft(editDraftKey, textarea.value);
          });
        }

        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          bodyEl.innerHTML = originalContent;
          if (editDraftKey) {
            saveDraft(editDraftKey, '');
          }
        });

        saveBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newBody = textarea.value.trim();
          if (!newBody) return;

          textarea.value = '';
          if (editDraftKey) {
            saveDraft(editDraftKey, '');
          }
          bodyEl.innerHTML = escapeHtml(newBody);

          try {
            await editComment(commentId, type, newBody);
          } catch (err) {
            alert('Failed to edit comment: ' + err);
          }
        });
      };

      editBtn.addEventListener('click', () => handleEditClick());

      if (hasEditDraft) {
        handleEditClick(draftsStore[editDraftKey]);
      }
    }

    // Delete comment button
    const deleteBtn = card.querySelector('.delete-comment-btn') as HTMLButtonElement;
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this comment thread?')) {
          deleteBtn.disabled = true;
          (card as HTMLElement).style.display = 'none';
          try {
            await deleteComment(commentId, type);
          } catch (err) {
            alert('Failed to delete comment: ' + err);
            (card as HTMLElement).style.display = 'flex';
            deleteBtn.disabled = false;
          }
        }
      });
    }

    // Edit/delete reply event listeners
    card.querySelectorAll('.reply-item').forEach((replyItem) => {
      const replyId = replyItem.getAttribute('data-reply-id') || '';

      const editReplyBtn = replyItem.querySelector('.edit-reply-btn') as HTMLButtonElement;
      if (editReplyBtn) {
        const editReplyDraftKey = getDraftKey('edit_reply:' + commentId + ':' + replyId);
        const hasEditReplyDraft = editReplyDraftKey && draftsStore[editReplyDraftKey];

        const handleEditReplyClick = (initialValue?: string) => {
          const bodyEl = replyItem.querySelector('.reply-body') as HTMLElement;
          if (!bodyEl) return;
          if (replyItem.querySelector('.reply-edit-textarea')) return;

          const originalBody = bodyEl.innerText;
          const originalContent = bodyEl.innerHTML;

          const draftValue = initialValue !== undefined ? initialValue : originalBody;

          bodyEl.innerHTML = `
            <div class="reply-edit-form" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              <textarea class="reply-edit-textarea form-control" style="width: 100%; min-height: 60px; padding: 6px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: var(--composer-bg); color: var(--text-primary); font-size: 12px; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box;">${escapeHtml(draftValue)}</textarea>
              <div style="display: flex; gap: 6px; justify-content: flex-end;">
                <button class="reply-edit-cancel-btn btn btn-sm" style="padding: 2px 8px; border-radius: 4px; border: 1px solid var(--sidebar-border); background-color: transparent; color: var(--text-secondary); font-size: 11px; cursor: pointer;">Cancel</button>
                <button class="reply-edit-save-btn btn btn-sm btn-primary" style="padding: 2px 10px; border-radius: 4px; border: none; background-color: var(--accent-color); color: #fff; font-size: 11px; font-weight: 500; cursor: pointer;">Save</button>
              </div>
            </div>
          `;

          const textarea = bodyEl.querySelector('.reply-edit-textarea') as HTMLTextAreaElement;
          const saveBtn = bodyEl.querySelector('.reply-edit-save-btn') as HTMLButtonElement;
          const cancelBtn = bodyEl.querySelector('.reply-edit-cancel-btn') as HTMLButtonElement;

          textarea.focus();

          if (editReplyDraftKey) {
            textarea.addEventListener('input', () => {
              saveDraft(editReplyDraftKey, textarea.value);
            });
          }

          cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            bodyEl.innerHTML = originalContent;
            if (editReplyDraftKey) {
              saveDraft(editReplyDraftKey, '');
            }
          });

          saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newBody = textarea.value.trim();
            if (!newBody) return;

            textarea.value = '';
            if (editReplyDraftKey) {
              saveDraft(editReplyDraftKey, '');
            }
            bodyEl.innerHTML = escapeHtml(newBody);

            try {
              await editReply(commentId, replyId, type, newBody);
            } catch (err) {
              alert('Failed to edit reply: ' + err);
            }
          });
        };

        editReplyBtn.addEventListener('click', () => handleEditReplyClick());

        if (hasEditReplyDraft) {
          handleEditReplyClick(draftsStore[editReplyDraftKey]);
        }
      }

      const deleteReplyBtn = replyItem.querySelector('.delete-reply-btn') as HTMLButtonElement;
      if (deleteReplyBtn) {
        deleteReplyBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this reply?')) {
            deleteReplyBtn.disabled = true;
            (replyItem as HTMLElement).style.display = 'none';
            try {
              await deleteReply(commentId, replyId, type);
            } catch (err) {
              alert('Failed to delete reply: ' + err);
              (replyItem as HTMLElement).style.display = 'flex';
              deleteReplyBtn.disabled = false;
            }
          }
        });
      }
    });
  });
}

function openSidebarForNewInline(fields: {
  paragraph_index: number;
  anchor_hash: string;
  anchor_text: string;
  heading_context: string;
}) {
  injectSidebar();
  openSidebar('inline');

  if (currentMetadata?.filePath) {
    applyPendingHighlight(
      currentMetadata.filePath,
      fields.paragraph_index,
      fields.anchor_hash,
      fields.anchor_text
    );
  }

  if (!activeSidebarHost) return;

  const composer = activeSidebarHost.querySelector('.new-inline-composer-wrapper') as HTMLElement;
  const container = activeSidebarHost.querySelector(
    '.new-inline-composer-container'
  ) as HTMLElement;
  if (!composer || !container) return;

  composer.style.display = 'block';

  const preview = composer.querySelector('.anchor-text-preview') as HTMLElement;
  if (preview) {
    preview.innerText =
      fields.anchor_text.length > 60 ? fields.anchor_text.slice(0, 60) + '...' : fields.anchor_text;
  }

  // Scroll composer into view
  composer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const block = parsedAnchors.find((a) => a.paragraph_index === fields.paragraph_index);
  const line = block && block.line_number !== undefined ? block.line_number + 1 : 1;

  const draftKey = getDraftKey(`new_inline:${currentMetadata?.filePath}:${fields.paragraph_index}`);

  const resetInlineComposerUI = () => {
    clearPendingHighlights();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement | null;
    if (ta) ta.value = '';
    container.innerHTML = '';
    composer.style.display = 'none';
    if (draftKey) {
      saveDraft(draftKey, '');
    }
  };

  triggerAndMoveNativeComposer(
    currentMetadata!.filePath,
    line,
    container,
    async (body) => {
      await saveNewInlineComment(
        body,
        fields.paragraph_index,
        fields.anchor_hash,
        fields.anchor_text,
        fields.heading_context
      );
      resetInlineComposerUI();
    },
    () => {
      resetInlineComposerUI();
    },
    draftKey
  ).catch((err) => {
    console.warn('[md-comments] Trigger native composer for new inline failed, falling back:', err);
    showFallbackReplyComposer(
      container,
      async (body) => {
        await saveNewInlineComment(
          body,
          fields.paragraph_index,
          fields.anchor_hash,
          fields.anchor_text,
          fields.heading_context
        );
        resetInlineComposerUI();
      },
      () => {
        resetInlineComposerUI();
      },
      draftKey
    );
  });
}

function renameOriginalConversationTab() {
  const tabList =
    document.querySelector('nav[aria-label*="Pull request navigation"] div[role="tablist"]') ||
    document.querySelector('nav[aria-label*="Pull request navigation"]') ||
    document.querySelector('div[role="tablist"]');
  if (!tabList) return;

  const tabs = tabList.querySelectorAll('a[role="tab"], a[class*="TabNavLink"], a');
  for (const tab of Array.from(tabs)) {
    const text = tab.textContent?.toLowerCase() || '';
    if (text.includes('conversation') || text.includes('code review')) {
      const walk = document.createTreeWalker(tab, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walk.nextNode())) {
        const val = node.nodeValue;
        if (val && /conversation/i.test(val)) {
          node.nodeValue = val.replace(/conversation/i, 'Code Review');
        }
      }
      const ariaLabel = tab.getAttribute('aria-label');
      if (ariaLabel && /conversation/i.test(ariaLabel)) {
        tab.setAttribute('aria-label', ariaLabel.replace(/conversation/i, 'Code Review'));
      }
      break;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function injectPRTab() {
  renameOriginalConversationTab();

  if (document.getElementById('md-comments-tab')) return;

  const tabList =
    document.querySelector('nav[aria-label*="Pull request navigation"] div[role="tablist"]') ||
    document.querySelector('nav[aria-label*="Pull request navigation"]') ||
    document.querySelector('div[role="tablist"]');
  if (!tabList) return;

  let conversationTab = tabList.querySelector('a[role="tab"]') || tabList.querySelector('a');
  if (conversationTab) {
    const text = conversationTab.textContent?.toLowerCase() || '';
    if (!text.includes('conversation') && !text.includes('code review')) {
      const tabs = tabList.querySelectorAll('a[role="tab"], a[class*="TabNavLink"], a');
      for (const tab of Array.from(tabs)) {
        const tabText = tab.textContent?.toLowerCase() || '';
        if (tabText.includes('conversation') || tabText.includes('code review')) {
          conversationTab = tab as HTMLElement;
          break;
        }
      }
    }
  }

  if (!conversationTab) return;

  const customTab = document.createElement('a');
  customTab.id = 'md-comments-tab';

  customTab.className = conversationTab.className;
  customTab.classList.remove('selected');
  for (const c of Array.from(customTab.classList)) {
    if (c.toLowerCase().includes('selected')) {
      customTab.classList.remove(c);
    }
  }

  customTab.setAttribute('role', 'tab');
  customTab.setAttribute('tabindex', '-1');
  customTab.setAttribute('aria-selected', 'false');
  customTab.href = '#md-comments';

  const svgHtml = `
    <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" style="margin-right: 4px; vertical-align: text-bottom;" class="octicon mr-2 d-none d-sm-inline-block">
      <path fill-rule="evenodd" d="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"/>
    </svg>
  `;

  // Find an unselected counter template if possible so our inactive tab count matches other inactive tabs
  const allTabsOnLoad = tabList.querySelectorAll('a[role="tab"], a[class*="TabNavLink"], a');
  let unselectedCounterTemplate: Element | null = null;
  let selectedCounterTemplate: Element | null = null;

  for (const tab of Array.from(allTabsOnLoad)) {
    if (tab.id !== 'md-comments-tab') {
      const hasSelectedClass = Array.from(tab.classList).some(
        (c) => c.toLowerCase().includes('selected') || c === 'selected'
      );
      const isSelected =
        hasSelectedClass ||
        tab.getAttribute('aria-selected') === 'true' ||
        tab.getAttribute('aria-current') === 'page';

      const counter =
        tab.querySelector('[data-component="CounterLabel"]') || tab.querySelector('.Counter');

      if (counter) {
        if (isSelected) {
          selectedCounterTemplate = counter;
        } else {
          unselectedCounterTemplate = counter;
        }
      }
    }
  }

  const templateToUse = unselectedCounterTemplate || selectedCounterTemplate;
  let counterHtml = '';
  if (templateToUse) {
    const attrs = Array.from(templateToUse.attributes)
      .filter((attr) => attr.name !== 'class')
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(' ');
    counterHtml = `<span ${attrs} class="${templateToUse.className} md-comments-tab-count">0</span>`;
  } else {
    counterHtml = `<span class="ml-2 md-comments-tab-count" style="font-weight: normal; font-size: 11px;">0</span>`;
  }

  customTab.innerHTML = `${svgHtml}Comments${counterHtml}`;

  customTab.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#md-comments';
    handleTabVisibility();
  });

  conversationTab.after(customTab);
  updateTabCommentsCount();
}

function updateTabCommentsCount() {
  const badge = document.querySelector('#md-comments-tab .md-comments-tab-count');
  if (badge) {
    const totalCount = loadedComments.inline_comments.length + loadedComments.page_comments.length;
    badge.textContent = String(totalCount);
  }
}

function isCustomTabActive(): boolean {
  return window.location.hash === '#md-comments';
}

function getNativeContentContainer(): HTMLElement | null {
  const selectors = [
    'div.prc-PageLayout-PageLayoutContent-BneH9',
    'div[class*="PageLayoutContent"]',
    '#repo-content-pjax-container > div',
    '.new-discussion-timeline',
    '.Layout-main',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el as HTMLElement;
  }

  const navTabs = document.querySelector('nav[aria-label*="Pull request navigation"]');
  if (navTabs) {
    const header = navTabs.closest('header') || navTabs.parentElement;
    if (header && header.nextElementSibling) {
      return header.nextElementSibling as HTMLElement;
    }
  }

  return null;
}

function syncCounterStyle(customCounter: Element, templateCounter: Element) {
  const style = customCounter.getAttribute('style');
  while (customCounter.attributes.length > 0) {
    customCounter.removeAttribute(customCounter.attributes[0].name);
  }
  customCounter.className = `${templateCounter.className} md-comments-tab-count`;
  if (style) {
    customCounter.setAttribute('style', style);
  }
  for (const attr of Array.from(templateCounter.attributes)) {
    if (attr.name !== 'class') {
      customCounter.setAttribute(attr.name, attr.value);
    }
  }
}

function handleTabVisibility() {
  const active = isCustomTabActive();
  const tabEl = document.getElementById('md-comments-tab');

  if (!tabEl) return;

  const customCounter = tabEl.querySelector('.md-comments-tab-count');

  if (active) {
    document.documentElement.classList.add('md-comments-tab-active');

    // Dynamically infer the selected classes from whichever native tab is currently selected
    const allTabs = document.querySelectorAll(
      'nav[aria-label*="Pull request navigation"] a[role="tab"], nav[aria-label*="Pull request navigation"] a[class*="TabNavLink"], nav[aria-label*="Pull request navigation"] a'
    );
    let foundSelectedClasses: string[] = [];
    let selectedCounterTemplate: Element | null = null;

    for (const tab of Array.from(allTabs)) {
      if (tab.id !== 'md-comments-tab') {
        const hasSelectedClass = Array.from(tab.classList).some(
          (c) => c.toLowerCase().includes('selected') || c === 'selected'
        );
        if (
          hasSelectedClass ||
          tab.getAttribute('aria-selected') === 'true' ||
          tab.getAttribute('aria-current') === 'page'
        ) {
          const classes = Array.from(tab.classList).filter(
            (c) => c.toLowerCase().includes('selected') || c === 'selected'
          );
          if (classes.length > 0) {
            foundSelectedClasses = classes;
          }
          const counter =
            tab.querySelector('[data-component="CounterLabel"]') || tab.querySelector('.Counter');
          if (counter) {
            selectedCounterTemplate = counter;
          }
          if (selectedCounterTemplate && foundSelectedClasses.length > 0) {
            break;
          }
        }
      }
    }

    if (foundSelectedClasses.length > 0) {
      cachedSelectedClasses = foundSelectedClasses;
    }

    const classesToApply = cachedSelectedClasses.length > 0 ? cachedSelectedClasses : ['selected'];
    classesToApply.forEach((c) => tabEl.classList.add(c));
    tabEl.setAttribute('aria-selected', 'true');
    tabEl.setAttribute('aria-current', 'page');
    tabEl.setAttribute('tabindex', '0');

    if (customCounter && selectedCounterTemplate) {
      syncCounterStyle(customCounter, selectedCounterTemplate);
    }

    const otherTabs = document.querySelectorAll(
      'nav[aria-label*="Pull request navigation"] a[role="tab"], nav[aria-label*="Pull request navigation"] a[class*="TabNavLink"], nav[aria-label*="Pull request navigation"] a'
    );
    otherTabs.forEach((t) => {
      if (t.id !== 'md-comments-tab') {
        t.classList.remove('selected');
        for (const c of Array.from(t.classList)) {
          if (c.toLowerCase().includes('selected')) {
            t.classList.remove(c);
          }
        }
        t.setAttribute('aria-selected', 'false');
        t.removeAttribute('aria-current');
        t.setAttribute('tabindex', '-1');
      }
    });

    const nativeContent = getNativeContentContainer();
    if (nativeContent) {
      nativeContent.style.display = 'none';
    }

    let customView = document.getElementById('md-comments-tab-content');
    if (!customView) {
      customView = document.createElement('div');
      customView.id = 'md-comments-tab-content';

      if (nativeContent && nativeContent.parentNode) {
        nativeContent.parentNode.insertBefore(customView, nativeContent);
      } else {
        document.body.appendChild(customView);
      }
    }
    customView.style.display = 'flex';

    if (!isTabContentRendered) {
      renderTabContent().catch(console.error);
    }
  } else {
    document.documentElement.classList.remove('md-comments-tab-active');
    tabEl.classList.remove('selected');
    for (const c of Array.from(tabEl.classList)) {
      if (c.toLowerCase().includes('selected')) {
        tabEl.classList.remove(c);
      }
    }
    cachedSelectedClasses.forEach((c) => tabEl.classList.remove(c));
    tabEl.setAttribute('aria-selected', 'false');
    tabEl.removeAttribute('aria-current');
    tabEl.setAttribute('tabindex', '-1');

    // Find an unselected counter template to match other inactive tabs
    const allTabs = document.querySelectorAll(
      'nav[aria-label*="Pull request navigation"] a[role="tab"], nav[aria-label*="Pull request navigation"] a[class*="TabNavLink"], nav[aria-label*="Pull request navigation"] a'
    );
    let unselectedCounterTemplate: Element | null = null;
    for (const tab of Array.from(allTabs)) {
      if (tab.id !== 'md-comments-tab') {
        const hasSelectedClass = Array.from(tab.classList).some(
          (c) => c.toLowerCase().includes('selected') || c === 'selected'
        );
        const isSelected =
          hasSelectedClass ||
          tab.getAttribute('aria-selected') === 'true' ||
          tab.getAttribute('aria-current') === 'page';

        if (!isSelected) {
          const counter =
            tab.querySelector('[data-component="CounterLabel"]') || tab.querySelector('.Counter');
          if (counter) {
            unselectedCounterTemplate = counter;
            break;
          }
        }
      }
    }

    if (customCounter && unselectedCounterTemplate) {
      syncCounterStyle(customCounter, unselectedCounterTemplate);
    }

    const nativeContent = getNativeContentContainer();
    if (nativeContent) {
      nativeContent.style.display = '';
    }

    const customView = document.getElementById('md-comments-tab-content');
    if (customView) {
      customView.remove();
    }
    isTabContentRendered = false;

    if (activeSidebarHost && activeSidebarHost.id === 'md-comments-sidebar-embedded') {
      activeSidebarHost = null;
    }
  }
}

async function renderTabContent() {
  isTabContentRendered = true;
  const customView = document.getElementById('md-comments-tab-content');
  if (!customView) return;

  customView.className = 'md-comments-tab-layout md-comments-scope';
  customView.innerHTML = `
    <div class="md-files-browser-pane">
      <div class="files-browser-header">
        <span class="browser-title">Files</span>
        <input type="text" class="file-browser-filter" placeholder="Filter files..." aria-label="Filter files" />
      </div>
      <div class="files-browser-list">
        <div class="tab-loading-state-browser" style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 12px; font-family: var(--font-family);">Loading...</div>
      </div>
    </div>
    <div class="md-files-pane">
      <div class="tab-loading-state">Loading modified Markdown files...</div>
    </div>
    <div class="md-sidebar-pane">
      <div id="md-comments-sidebar-embedded" class="sidebar-container embedded md-comments-scope"></div>
    </div>
  `;

  const filesPane = customView.querySelector('.md-files-pane') as HTMLElement;
  const browserList = customView.querySelector('.files-browser-list') as HTMLElement;
  const filterInput = customView.querySelector('.file-browser-filter') as HTMLInputElement;
  const sidebarEmbedded = customView.querySelector('#md-comments-sidebar-embedded') as HTMLElement;

  const meta = parseGitHubUrl(window.location.href);
  if (!meta || !githubApi) {
    filesPane.innerHTML = `<div class="tab-error-state">GitHub API or Pull Request info could not be loaded. Please ensure you are logged in.</div>`;
    return;
  }

  if (!prInfoHeadBranch) {
    const domBranch = getPRHeadBranchFromDom();
    if (domBranch) {
      prInfoHeadBranch = domBranch;
    } else {
      try {
        filesPane.innerHTML = `<div class="tab-loading-state">Resolving Pull Request info...</div>`;
        const pullNum = meta.type === 'pull' ? meta.pullNumber : 0;
        const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, pullNum);
        prInfoHeadBranch = prInfo.headBranch;
      } catch (err) {
        filesPane.innerHTML = `<div class="tab-error-state">Failed to load PR branch info: ${err}</div>`;
        return;
      }
    }
  }

  await initRepoAndMetadata(meta.owner, meta.repo, prInfoHeadBranch);

  let changedFiles: string[] = [];
  try {
    const pullNum = meta.type === 'pull' ? meta.pullNumber : 0;
    const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, pullNum);
    changedFiles = prInfo.changedFiles;
  } catch (err) {
    filesPane.innerHTML = `<div class="tab-error-state">Failed to fetch Pull Request files: ${err}</div>`;
    return;
  }

  const mdFiles = changedFiles.filter((f) => f.toLowerCase().endsWith('.md'));
  if (mdFiles.length === 0) {
    if (browserList)
      browserList.innerHTML = `<div style="padding: 16px; color: var(--text-secondary); font-size: 12px;">No MD files</div>`;
    filesPane.innerHTML = `<div class="tab-empty-state">No Markdown (.md) files were modified in this Pull Request.</div>`;
    return;
  }

  renderFilesBrowser(mdFiles);

  filesPane.innerHTML = '';

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0,
  };

  const activeObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter((e) => e.isIntersecting);
    if (visibleEntries.length > 0) {
      visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const activeEntry = visibleEntries[0];
      const filePath = activeEntry.target.getAttribute('data-file-path');
      if (filePath) {
        updateActiveFileInBrowser(filePath);
        const fileCtx = loadedFileContexts.get(filePath);
        if (fileCtx && currentMetadata?.filePath !== filePath) {
          setActiveFile(filePath, fileCtx.anchors, fileCtx.comments);
          renderSidebarComments();
        }
      }
    }
  }, observerOptions);

  for (const filePath of mdFiles) {
    const fileContainer = document.createElement('div');
    fileContainer.className = 'js-file file md-file-wrapper';
    fileContainer.setAttribute('data-file-path', filePath);
    fileContainer.style.cssText = `
      border: 1px solid var(--sidebar-border);
      border-radius: 8px;
      margin-bottom: 24px;
      background-color: var(--composer-bg);
      overflow: hidden;
    `;
    const markdownBody = document.createElement('div');
    markdownBody.className = 'markdown-body md-processed';
    markdownBody.style.cssText = `
      padding: 32px;
      max-width: 100%;
      background-color: var(--composer-bg);
    `;
    markdownBody.innerHTML = `<div class="inline-loading" style="color: var(--text-secondary); font-family: var(--font-family);">Loading contents...</div>`;
    fileContainer.appendChild(markdownBody);
    filesPane.appendChild(fileContainer);

    activeObserver.observe(fileContainer);

    loadAndRenderFileInTab(fileContainer, filePath, markdownBody).catch(console.error);
  }

  activeSidebarHost = sidebarEmbedded;
  openSidebar('inline');

  function renderFilesBrowser(files: string[]) {
    if (!browserList) return;

    browserList.innerHTML = files
      .map((file) => {
        const parts = file.split('/');
        const fileName = parts.pop() || '';
        const dirPath = parts.join('/');
        return `
        <div class="browser-item" data-path="${escapeHtml(file)}" title="${escapeHtml(file)}" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-radius: 6px; margin-bottom: 4px; font-family: var(--font-family); font-size: 13px; color: var(--text-primary); transition: background-color 0.2s;">
          <svg class="octicon octicon-file mr-2" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color: var(--text-secondary); flex-shrink: 0; margin-right: 8px;">
            <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16H3.75A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM8 3.25a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0V7h-1.5a.75.75 0 0 1 0-1.5h1.5V4A.75.75 0 0 1 8 3.25Z"/>
          </svg>
          <div class="browser-item-label" style="display: flex; flex-direction: column; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1;">
            <span class="browser-item-name" style="font-weight: 500; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(fileName)}</span>
            ${dirPath ? `<span class="browser-item-path" style="font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis;">${escapeHtml(dirPath)}</span>` : ''}
          </div>
        </div>
      `;
      })
      .join('');

    browserList.querySelectorAll('.browser-item').forEach((item) => {
      item.addEventListener('click', () => {
        const filePath = item.getAttribute('data-path');
        if (!filePath) return;

        const fileEl = filesPane.querySelector(`.md-file-wrapper[data-file-path="${filePath}"]`);
        if (fileEl) {
          fileEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

          const fileCtx = loadedFileContexts.get(filePath);
          if (fileCtx) {
            setActiveFile(filePath, fileCtx.anchors, fileCtx.comments);
            renderSidebarComments();
          }

          updateActiveFileInBrowser(filePath);
        }
      });
    });

    if (files.length > 0) {
      updateActiveFileInBrowser(files[0]);
    }
  }

  function updateActiveFileInBrowser(activePath: string) {
    if (!browserList) return;
    browserList.querySelectorAll('.browser-item').forEach((item) => {
      const path = item.getAttribute('data-path');
      if (path === activePath) {
        item.classList.add('active');
        (item as HTMLElement).style.backgroundColor = 'rgba(88, 166, 255, 0.15)';
        (item as HTMLElement).style.color = 'var(--accent-color)';
        const label = item.querySelector('.browser-item-name') as HTMLElement;
        if (label) label.style.color = 'var(--accent-color)';
      } else {
        item.classList.remove('active');
        (item as HTMLElement).style.backgroundColor = '';
        (item as HTMLElement).style.color = '';
        const label = item.querySelector('.browser-item-name') as HTMLElement;
        if (label) label.style.color = '';
      }
    });
  }

  if (filterInput) {
    filterInput.addEventListener('input', () => {
      const query = filterInput.value.toLowerCase().trim();
      browserList.querySelectorAll('.browser-item').forEach((item) => {
        const path = (item.getAttribute('data-path') || '').toLowerCase();
        if (path.includes(query)) {
          (item as HTMLElement).style.display = 'flex';
        } else {
          (item as HTMLElement).style.display = 'none';
        }
      });
    });
  }
}

async function loadAndRenderFileInTab(
  fileContainer: HTMLElement,
  filePath: string,
  markdownBody: HTMLElement
) {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || !githubApi) return;

  let markdownText = '';
  try {
    markdownText = await fetchFileContent(
      meta.owner,
      meta.repo,
      prInfoHeadBranch,
      filePath,
      currentToken
    );
  } catch (err) {
    markdownBody.innerHTML = `<div class="inline-error" style="color: var(--warn-color); font-family: var(--font-family);">Failed to load file contents: ${err}</div>`;
    return;
  }

  let renderedHtml = '';
  try {
    renderedHtml = await githubApi.renderMarkdown(markdownText, meta.owner, meta.repo);
  } catch (err) {
    renderedHtml = `<pre style="white-space: pre-wrap; padding: 20px;">${escapeHtml(markdownText)}</pre>`;
  }

  markdownBody.innerHTML = renderedHtml;

  let fileAnchors: AnchorBlock[] = [];
  try {
    fileAnchors = parseMarkdownAnchors(markdownText);
  } catch (err) {
    console.error(`Failed to parse anchors for ${filePath}:`, err);
  }

  let commentsBranchToRead = prInfoHeadBranch;
  if (repoInfo?.isProtected) {
    const commentsBranchExists = await githubApi.checkBranchExists(
      meta.owner,
      meta.repo,
      `comments/${writeBranch.replace('comments/', '')}`
    );
    if (commentsBranchExists) {
      commentsBranchToRead = `comments/${writeBranch.replace('comments/', '')}`;
    }
  }

  let fileComments: CommentsFile = { page_comments: [], inline_comments: [] };
  try {
    fileComments = await fetchCommentsFile(
      meta.owner,
      meta.repo,
      commentsBranchToRead,
      filePath,
      currentToken
    );
  } catch (err) {
    console.error(`Failed to fetch comments for ${filePath}:`, err);
  }

  loadedFileContexts.set(filePath, { anchors: fileAnchors, comments: fileComments });

  if (
    !currentMetadata ||
    currentMetadata.filePath === filePath ||
    currentMetadata.filePath === ''
  ) {
    setActiveFile(filePath, fileAnchors, fileComments);
    renderSidebarComments();
  }

  renderDOMIndicatorsForFile(markdownBody, filePath, fileAnchors, fileComments);

  const activateFileContext = () => {
    if (currentMetadata?.filePath !== filePath) {
      setActiveFile(filePath, fileAnchors, fileComments);
      renderSidebarComments();
    }
  };

  markdownBody.addEventListener('mouseenter', activateFileContext, { passive: true });
  markdownBody.addEventListener('mousedown', activateFileContext, { passive: true });
}

function renderDOMIndicatorsForFile(
  markdownBody: HTMLElement,
  filePath: string,
  fileAnchors: AnchorBlock[],
  fileComments: CommentsFile
) {
  loadedFileContexts.set(filePath, { anchors: fileAnchors, comments: fileComments });
  const domElements = findDomParagraphs(markdownBody);

  markdownBody.querySelectorAll('.md-comments-indicator-container').forEach((el) => el.remove());

  const placements = placeInlineComments(fileAnchors, fileComments.inline_comments);

  domElements.forEach((el) => {
    const text = normalizeAnchorText(el.innerText);
    const hash = fnv1aHash(text);

    let originalHtml = el.getAttribute('data-original-html');
    if (!originalHtml) {
      originalHtml = el.innerHTML;
      el.setAttribute('data-original-html', originalHtml);
    } else {
      el.innerHTML = originalHtml;
    }

    // Match this DOM element to a parsed AnchorBlock
    const block = fileAnchors.find(
      (b) => b.anchor_hash === hash || fuzzyMatch(text, b.anchor_text)
    );
    if (!block) return;

    const matchedPlacements = placements.filter((p) => {
      if (!p.placed) return false;
      return p.paragraphIndex === block.paragraph_index;
    });

    for (const placement of matchedPlacements) {
      const comment = placement.comment;
      if (comment.anchor_text && comment.anchor_text !== text && !comment.resolved) {
        highlightTextInElement(el, comment.anchor_text, comment.id);
      }
    }

    el.querySelectorAll('.md-comments-highlight').forEach((hlNode) => {
      const hl = hlNode as HTMLElement;
      const commentId = hl.dataset.commentId;
      if (commentId) {
        hl.addEventListener('mouseenter', () => showCommentTooltip(hl, commentId));
        hl.addEventListener('mouseleave', () => hideCommentTooltip());
        hl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          hideCommentTooltip();
          openSidebar('inline', commentId);
        });
      }
    });

    el.style.position = 'relative';
    el.style.paddingRight = '48px';

    const container = document.createElement('div');
    container.className = 'md-comments-indicator-container';
    container.style.position = 'absolute';
    container.style.right = '8px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.display = 'flex';
    container.style.gap = '4px';
    container.style.alignItems = 'center';
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '10';

    if (isWritable) {
      const addBtn = document.createElement('button');
      addBtn.className = 'md-comments-add-btn';
      addBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 5v2H5v2h2v2h2V9h2V7H9V5H7z"/>
        </svg>
      `;
      addBtn.title = 'Add comment';
      addBtn.style.cssText = `
        background: transparent;
        color: #8b949e;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
      `;

      el.addEventListener('mouseenter', () => {
        addBtn.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => {
        addBtn.style.opacity = '0';
      });
      container.addEventListener('mouseenter', () => {
        addBtn.style.opacity = '1';
      });
      container.addEventListener('mouseleave', () => {
        addBtn.style.opacity = '0';
      });

      addBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        let anchorText = text;
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && el.contains(selection.anchorNode)) {
          anchorText = selection.toString().trim();
        }

        setActiveFile(filePath, fileAnchors, fileComments);
        openSidebarForNewInline({
          paragraph_index: block.paragraph_index,
          anchor_hash: block.anchor_hash,
          anchor_text: anchorText,
          heading_context: findHeadingContext(el),
        });
      });

      container.appendChild(addBtn);
    }

    el.appendChild(container);
    activeIndicators.push(container);
  });

  if (
    activePendingHighlightParams &&
    activePendingHighlightParams.filePath === filePath &&
    activePendingHighlightParams.anchorText
  ) {
    applyPendingHighlight(
      filePath,
      activePendingHighlightParams.paragraphIndex ?? 0,
      activePendingHighlightParams.anchorHash ?? '',
      activePendingHighlightParams.anchorText
    );
  }
}

function findDomParagraphs(markdownBody: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];
  for (const child of Array.from(markdownBody.children)) {
    const htmlChild = child as HTMLElement;
    const tagName = htmlChild.tagName.toLowerCase();

    if (htmlChild.classList.contains('highlight') || tagName === 'pre') {
      continue;
    }

    if (/^h[1-6]$/.test(tagName) || tagName === 'p') {
      elements.push(htmlChild);
    } else if (tagName === 'ul' || tagName === 'ol') {
      for (const li of Array.from(htmlChild.querySelectorAll('li'))) {
        elements.push(li as HTMLElement);
      }
    } else if (tagName === 'table') {
      for (const tr of Array.from(htmlChild.querySelectorAll('tr'))) {
        elements.push(tr as HTMLElement);
      }
    } else if (tagName === 'blockquote') {
      const children = Array.from(htmlChild.querySelectorAll('p, li'));
      if (children.length > 0) {
        children.forEach((c) => elements.push(c as HTMLElement));
      } else {
        elements.push(htmlChild);
      }
    } else if (tagName === 'details') {
      const children = Array.from(htmlChild.querySelectorAll('p, li, summary'));
      if (children.length > 0) {
        children.forEach((c) => elements.push(c as HTMLElement));
      } else {
        elements.push(htmlChild);
      }
    } else {
      elements.push(htmlChild);
    }
  }
  return elements;
}

function findHeadingContext(el: HTMLElement): string {
  let prev = el.previousElementSibling;
  while (prev) {
    if (/^h[1-6]$/i.test(prev.tagName)) {
      return prev.textContent?.trim() || '';
    }
    prev = prev.previousElementSibling;
  }
  return '';
}

async function commitCommentFileChanges(updatedComments: CommentsFile, _action: string) {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || meta.type !== 'blob') {
    loadedComments = updatedComments;
    renderSidebarComments();
    return;
  }

  const key = {
    owner: meta.owner,
    repo: meta.repo,
    branch: meta.branch,
    filePath: meta.filePath,
  };

  // Optimistically update local comments state and render UI immediately
  loadedComments = updatedComments;
  const markdownBody = document.querySelector('.markdown-body') as HTMLElement;
  if (markdownBody && meta && meta.type === 'blob') {
    renderDOMIndicatorsForFile(markdownBody, meta.filePath, parsedAnchors, loadedComments);
  }
  renderSidebarComments();

  try {
    await gitRefBackend.write(key, updatedComments);
  } catch (err: any) {
    console.error('[md-comments] Error writing comment to GitHub orphan ref:', err);
    const errMsg = String(err?.message || err);
    if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
      lastAuthError =
        'GitHub authorization failed (401). Please enter a valid Personal Access Token (PAT) with repo scope below.';
      isWritable = false;
      currentToken = null;
      githubApi = new GitHubApi(null);
      clearOAuthToken().catch(() => {});
      injectSidebar();
      renderSidebarComments();
      alert(
        'Authentication error (401). Please enter your GitHub Personal Access Token (PAT) in the sidebar to post comments.'
      );
    } else {
      alert('Failed to save comment to GitHub: ' + errMsg);
    }
    throw err;
  }
}

async function saveNewInlineComment(
  body: string,
  paragraphIndex: number,
  hash: string,
  anchorText: string,
  heading: string
) {
  const author = await getDisplayAuthor();
  const newComment: InlineComment = {
    id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    anchor_text: anchorText,
    anchor_hash: hash,
    paragraph_index: paragraphIndex,
    heading_context: heading,
    body,
    created_at: new Date().toISOString(),
    orphaned: false,
    resolved: false,
    reactions: [],
    replies: [],
  };

  localCreatedIds.add(newComment.id);

  const updated = {
    ...loadedComments,
    inline_comments: [...loadedComments.inline_comments, newComment],
  };

  await commitCommentFileChanges(updated, 'add inline comment');
}

async function saveNewPageComment(body: string) {
  const author = await getDisplayAuthor();
  const newComment: PageComment = {
    id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    body,
    created_at: new Date().toISOString(),
    resolved: false,
    reactions: [],
    replies: [],
  };

  localCreatedIds.add(newComment.id);

  const updated = {
    ...loadedComments,
    page_comments: [...loadedComments.page_comments, newComment],
  };

  await commitCommentFileChanges(updated, 'add page comment');
}

async function saveReply(commentId: string, type: 'inline' | 'page', body: string) {
  const author = await getDisplayAuthor();
  const reply: Reply = {
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    body,
    created_at: new Date().toISOString(),
    reactions: [],
  };

  localCreatedIds.add(reply.id);

  const updated = { ...loadedComments };
  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    });
  } else {
    updated.page_comments = updated.page_comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    });
  }

  await commitCommentFileChanges(updated, 'add reply:' + commentId);
}

async function editComment(commentId: string, type: 'inline' | 'page', body: string) {
  const updated = { ...loadedComments };
  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, body, updated_at: new Date().toISOString() };
      }
      return c;
    });
  } else {
    updated.page_comments = updated.page_comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, body, updated_at: new Date().toISOString() };
      }
      return c;
    });
  }
  await commitCommentFileChanges(updated, 'edit comment');
}

async function deleteComment(commentId: string, _type: 'inline' | 'page') {
  localCreatedIds.delete(commentId);
  const targetId = commentId.trim();
  const updated = {
    inline_comments: loadedComments.inline_comments.filter((c) => c.id.trim() !== targetId),
    page_comments: loadedComments.page_comments.filter((c) => c.id.trim() !== targetId),
  };
  await commitCommentFileChanges(updated, 'delete comment');
}

async function editReply(
  commentId: string,
  replyId: string,
  type: 'inline' | 'page',
  body: string
) {
  const updated = { ...loadedComments };
  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.map((c) => {
      if (c.id === commentId) {
        const updatedReplies = c.replies.map((r) => {
          if (r.id === replyId) {
            return { ...r, body, updated_at: new Date().toISOString() };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });
  } else {
    updated.page_comments = updated.page_comments.map((c) => {
      if (c.id === commentId) {
        const updatedReplies = c.replies.map((r) => {
          if (r.id === replyId) {
            return { ...r, body, updated_at: new Date().toISOString() };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });
  }
  await commitCommentFileChanges(updated, 'edit reply');
}

async function deleteReply(commentId: string, replyId: string, _type: 'inline' | 'page') {
  localCreatedIds.delete(replyId);
  const targetCommentId = commentId.trim();
  const targetReplyId = replyId.trim();

  const filterReplies = (comments: Array<any>) =>
    comments.map((c) => {
      if (c.id.trim() === targetCommentId) {
        const updatedReplies = c.replies.filter((r: any) => r.id.trim() !== targetReplyId);
        return { ...c, replies: updatedReplies };
      }
      return c;
    });

  const updated = {
    inline_comments: filterReplies(loadedComments.inline_comments),
    page_comments: filterReplies(loadedComments.page_comments),
  };
  await commitCommentFileChanges(updated, 'delete reply');
}

async function toggleResolve(commentId: string, type: 'inline' | 'page', resolved: boolean) {
  const updated = { ...loadedComments };
  const now = new Date().toISOString();

  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          resolved,
          resolved_at: resolved ? now : undefined,
        };
      }
      return c;
    });
  } else {
    updated.page_comments = updated.page_comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          resolved,
          resolved_at: resolved ? now : undefined,
        };
      }
      return c;
    });
  }

  const action = resolved ? 'resolve' : 'reopen';
  await commitCommentFileChanges(updated, `${action} comment thread`);
}

// --- Helpers ---
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'just now';
}

function resolveDisplayName(author: string): string {
  const login = author.trim();
  if (isGitHubLogin(login)) {
    const key = login.toLowerCase();
    if (displayNameCache.has(key)) {
      return displayNameCache.get(key) || author;
    }
    if (!pendingFetches.has(key)) {
      fetchDisplayName(login).catch((err) => {
        console.error('[md-comments] Error fetching display name:', err);
      });
    }
  }
  return author;
}

async function fetchDisplayName(login: string): Promise<void> {
  const key = login.toLowerCase();
  pendingFetches.add(key);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.name === 'string') {
        const trimmed = data.name.trim();
        if (trimmed) {
          displayNameCache.set(key, trimmed);
          renderSidebarComments();
        }
      }
    }
  } catch (e) {
    console.error('[md-comments] Failed to fetch display name:', e);
  } finally {
    pendingFetches.delete(key);
  }
}

function renderAuthor(author: string): string {
  const login = author.trim();
  const displayName = resolveDisplayName(login);
  if (isGitHubLogin(login)) {
    const title = displayName !== login ? ` title="@${escapeHtml(login)}"` : '';
    return `<a href="https://github.com/${encodeURIComponent(login)}" class="username" target="_blank" rel="noopener noreferrer"${title}>${escapeHtml(displayName)}</a>`;
  }
  return `<span class="username">${escapeHtml(displayName)}</span>`;
}

function collectCommentAuthors(comments: CommentsFile): string[] {
  const authors = new Set<string>();
  const addAuthor = (author: string) => {
    const clean = author.trim();
    if (clean && !clean.includes(' ')) {
      authors.add(clean);
    }
  };
  for (const c of comments.page_comments) {
    addAuthor(c.author);
    for (const r of c.replies) {
      addAuthor(r.author);
    }
  }
  for (const c of comments.inline_comments) {
    addAuthor(c.author);
    for (const r of c.replies) {
      addAuthor(r.author);
    }
  }
  return [...authors];
}

function warmDisplayNames(comments: CommentsFile) {
  const authors = collectCommentAuthors(comments);
  for (const author of authors) {
    resolveDisplayName(author);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatCommitMessage(action: string): string {
  if (useConventionalCommits) {
    return `docs(comments): ${action}`;
  }
  const pattern = commitPattern.trim();
  if (pattern) {
    return pattern.replace(/{action}/g, action);
  }
  return `${action.charAt(0).toUpperCase() + action.slice(1)} via Markdown Comments Extension`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isCommentCommit(message: string): boolean {
  const cleanMsg = message.startsWith('fixup! ') ? message.slice(7) : message;
  if (cleanMsg.startsWith('docs(comments):')) {
    return true;
  }
  if (cleanMsg.endsWith('via Markdown Comments Extension')) {
    return true;
  }
  const pattern = commitPattern.trim();
  if (pattern) {
    const prefix = pattern.split('{action}')[0].trim();
    if (prefix && cleanMsg.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

// --- Text Selection Comments Feature ---
function findParagraphForNode(
  node: Node | null,
  domElements: HTMLElement[]
): { el: HTMLElement; index: number } | null {
  let curr: Node | null = node;
  while (curr && curr !== document.body) {
    const idx = domElements.indexOf(curr as HTMLElement);
    if (idx !== -1) {
      return { el: curr as HTMLElement, index: idx };
    }
    curr = curr.parentNode;
  }
  return null;
}

function showSelectionButton(
  range: Range,
  paragraphEl: HTMLElement,
  paragraphIndex: number,
  filePath: string,
  fileAnchors: AnchorBlock[],
  fileComments: CommentsFile
) {
  if (!activeSelectionButton) {
    activeSelectionButton = document.createElement('button');
    activeSelectionButton.id = 'md-comments-selection-button';
    activeSelectionButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 5v2H5v2h2v2h2V9h2V7H9V5H7z"/>
      </svg>
      Comment
    `;
    activeSelectionButton.style.cssText = `
      position: fixed;
      background-color: #21262d;
      color: #c9d1d9;
      border: 1px solid #30363d;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999999;
      transition: background-color 0.2s, transform 0.1s;
    `;

    activeSelectionButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.documentElement.appendChild(activeSelectionButton);
  }

  const selectedText = range.toString().trim();
  const rect = range.getBoundingClientRect();
  activeSelectionButton.style.display = 'flex';
  activeSelectionButton.style.left = `${rect.left + rect.width / 2}px`;

  const topPos = rect.top - 35;
  if (topPos < 10) {
    activeSelectionButton.style.top = `${rect.bottom + 10}px`;
  } else {
    activeSelectionButton.style.top = `${topPos}px`;
  }
  activeSelectionButton.style.transform = 'translateX(-50%)';

  const newButton = activeSelectionButton.cloneNode(true) as HTMLButtonElement;
  activeSelectionButton.parentNode?.replaceChild(newButton, activeSelectionButton);
  activeSelectionButton = newButton;

  activeSelectionButton.addEventListener('mouseenter', () => {
    if (activeSelectionButton) activeSelectionButton.style.backgroundColor = '#30363d';
  });
  activeSelectionButton.addEventListener('mouseleave', () => {
    if (activeSelectionButton) activeSelectionButton.style.backgroundColor = '#21262d';
  });
  activeSelectionButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  activeSelectionButton.addEventListener('mouseup', (e) => {
    e.stopPropagation();
  });

  activeSelectionButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    const currentSel = selection ? selection.toString().trim() : '';
    const anchorText = currentSel || selectedText || paragraphEl.innerText;
    const text = normalizeAnchorText(paragraphEl.innerText);
    const matchHash = fnv1aHash(text);
    const block = fileAnchors.find(
      (b) => b.anchor_hash === matchHash || fuzzyMatch(text, b.anchor_text)
    );
    const hash = block ? block.anchor_hash : matchHash;

    setActiveFile(filePath, fileAnchors, fileComments);
    openSidebarForNewInline({
      paragraph_index: paragraphIndex,
      anchor_hash: hash,
      anchor_text: anchorText,
      heading_context: findHeadingContext(paragraphEl),
    });

    hideSelectionButton();
  });
}

function hideSelectionButton() {
  if (activeSelectionButton) {
    activeSelectionButton.style.display = 'none';
  }
}

function handleTextSelection() {
  if (!isWritable) {
    hideSelectionButton();
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    hideSelectionButton();
    return;
  }

  try {
    const range = selection.getRangeAt(0);
    let container: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
    while (container && container !== document.body) {
      if (
        container.nodeType === Node.ELEMENT_NODE &&
        container.classList.contains('markdown-body')
      ) {
        break;
      }
      container = container.parentNode as HTMLElement;
    }

    if (
      !container ||
      container.nodeType !== Node.ELEMENT_NODE ||
      !container.classList.contains('markdown-body')
    ) {
      hideSelectionButton();
      return;
    }

    let fileEl: HTMLElement | null = container;
    while (fileEl && fileEl !== document.body) {
      if (
        fileEl.nodeType === Node.ELEMENT_NODE &&
        (fileEl.classList.contains('js-file') || fileEl.classList.contains('file'))
      ) {
        break;
      }
      fileEl = fileEl.parentNode as HTMLElement;
    }

    let filePath: string | null = null;
    if (fileEl && fileEl.nodeType === Node.ELEMENT_NODE && fileEl !== document.body) {
      filePath = getFilePathFromFileContainer(fileEl);
    }
    if (!filePath && currentMetadata?.filePath) {
      filePath = currentMetadata.filePath;
    }

    if (!filePath) {
      hideSelectionButton();
      return;
    }

    const fileCtx = loadedFileContexts.get(filePath);
    if (!fileCtx) {
      hideSelectionButton();
      return;
    }

    const paragraphs = findDomParagraphs(container);
    const match = findParagraphForNode(range.commonAncestorContainer, paragraphs);
    if (!match) {
      hideSelectionButton();
      return;
    }

    const matchText = normalizeAnchorText(match.el.innerText);
    const matchHash = fnv1aHash(matchText);
    const block = fileCtx.anchors.find(
      (b) => b.anchor_hash === matchHash || fuzzyMatch(matchText, b.anchor_text)
    );

    const paragraphIndex = block ? block.paragraph_index : match.index;

    showSelectionButton(
      range,
      match.el,
      paragraphIndex,
      filePath,
      fileCtx.anchors,
      fileCtx.comments
    );
  } catch (err) {
    hideSelectionButton();
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.oauthToken || changes.fallbackToken) {
      const newToken = changes.oauthToken?.newValue || changes.fallbackToken?.newValue || null;
      currentToken = newToken;
      githubApi = new GitHubApi(newToken);
      const meta = parseGitHubUrl(window.location.href);
      if (meta && meta.type === 'blob') {
        loadDocumentComments(meta);
      }
    }
    if (changes.useConventionalCommits) {
      useConventionalCommits = !!changes.useConventionalCommits.newValue;
    }
    if (changes.commitPattern) {
      commitPattern = changes.commitPattern.newValue || '';
    }
  }
});

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);
window.addEventListener('scroll', hideSelectionButton);
