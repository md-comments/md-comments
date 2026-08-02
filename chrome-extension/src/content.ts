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
import { GitHubApi, RepoMetadata } from './githubApi';
import { isGitHubLogin } from '../../shared/author';
import { escapeHtml } from '../../shared/html';

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
let parsedAnchors: AnchorBlock[] = [];
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
let isWritable = false;
let writeBranch = '';
let lastAuthError: string | null = null;
let activeSelectionButton: HTMLButtonElement | null = null;
let useConventionalCommits = true;
let commitPattern = 'docs(comments): {action}';
let squashCommits = true;
let useFixupCommits = true;
let batchCommentsMode = true;
let isTabContentRendered = false;
let cachedSelectedClasses: string[] = [];
let currentDisplayAuthor = '';

let draftsStore: Record<string, string> = {};

function getDraftKey(suffix: string): string {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta) return '';
  return `draft:${meta.owner}/${meta.repo}/${meta.pullNumber}:${suffix}`;
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

type ParsedUrl = { type: 'pull'; owner: string; repo: string; pullNumber: number };

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
    chrome.storage.local.get({ fallbackToken: '' }, (items) => {
      if (items.fallbackToken) {
        console.log('[md-comments] Found GitHub PAT in local storage');
      } else {
        console.log('[md-comments] No GitHub PAT found in local storage');
      }
      resolve(items.fallbackToken || null);
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

// Check navigation changes
let lastUrl = '';
function checkPageChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    cleanupInjections();
    handlePageLoad().catch(console.error);
  } else {
    const meta = parseGitHubUrl(currentUrl);
    if (meta && meta.type === 'pull') {
      injectPRTab();
      handleTabVisibility();
      processPRMarkdownFiles().catch(console.error);
    }
  }
  renameReplyButtonsToOK();
}

// Start polling and listening
document.addEventListener('turbo:load', checkPageChange);
document.addEventListener('pjax:end', checkPageChange);
window.addEventListener('popstate', checkPageChange);
setInterval(checkPageChange, 1000);

async function handlePageLoad() {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || meta.type !== 'pull') return;

  await new Promise<void>((resolve) => {
    chrome.storage.local.get(
      {
        useConventionalCommits: true,
        commitPattern: 'docs(comments): {action}',
        squashCommits: true,
        useFixupCommits: true,
        batchCommentsMode: true,
        drafts: {},
      },
      (items) => {
        useConventionalCommits = items.useConventionalCommits;
        commitPattern = items.commitPattern;
        squashCommits = items.squashCommits;
        useFixupCommits = items.useFixupCommits;
        batchCommentsMode = items.batchCommentsMode;
        draftsStore = items.drafts || {};
        resolve();
      }
    );
  });

  lastAuthError = null;

  // Extract auth token
  currentToken = await getAuthToken();
  currentDisplayAuthor = await getDisplayAuthor();
  githubApi = new GitHubApi(currentToken);
  console.log(
    '[md-comments] Auth token loaded:',
    currentToken ? `${currentToken.slice(0, 8)}...` : 'NONE'
  );

  prInfoHeadBranch = '';

  injectPRTab();
  handleTabVisibility();
  processPRMarkdownFiles().catch(console.error);
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

function injectGlobalStyles() {
  if (!document.getElementById('md-comments-global-styles')) {
    const link = document.createElement('link');
    link.id = 'md-comments-global-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('sidebar.css');
    document.head.appendChild(link);
  }
}

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
        const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, meta.pullNumber);
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

  // Check if we have cached pending comments for this file
  const cache = await getPendingCommentsCache();
  if (cache[filePath]) {
    cache[filePath].original = fileComments;
    await savePendingCommentsCache(cache);
    fileComments = cache[filePath].current;
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
  }

  const interceptSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const body = textarea?.value.trim() || '';
    if (!body) return;

    const submitBtn = nativeForm?.querySelector('button[type="submit"]');
    try {
      submitBtn?.setAttribute('disabled', 'true');
      if (textarea) textarea.disabled = true;

      await onSubmit(body);
      if (draftKey) {
        saveDraft(draftKey, '');
      }
      nativeForm?.remove();
      cleanupListeners();
    } catch (err) {
      alert('Failed to save comment: ' + err);
    } finally {
      submitBtn?.removeAttribute('disabled');
      if (textarea) textarea.disabled = false;
    }
  };

  const interceptCancel = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (draftKey) {
      saveDraft(draftKey, '');
    }
    nativeForm?.remove();
    cleanupListeners();
    onCancel();
  };

  const formSubmitHandler = (e: Event) => {
    interceptSubmit(e);
  };

  nativeForm.addEventListener('submit', formSubmitHandler);

  const submitButtons = nativeForm.querySelectorAll('button[type="submit"]');
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

  const handleCancel = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (draftKey) {
      saveDraft(draftKey, '');
    }
    onCancel();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const body = textarea.value.trim();
    if (!body) return;
    submitBtn.disabled = true;
    textarea.disabled = true;
    try {
      await onSubmit(body);
      if (draftKey) {
        saveDraft(draftKey, '');
      }
    } catch (e) {
      alert('Failed to save reply: ' + e);
      submitBtn.disabled = false;
      textarea.disabled = false;
    }
  };

  cancelBtn.addEventListener('click', handleCancel);
  submitBtn.addEventListener('click', handleSubmit);
}

function highlightTextInElement(el: HTMLElement, searchText: string, commentId: string) {
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
      span.className = 'md-comments-highlight';
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

let activeSidebarHost: HTMLElement | null = null;

function injectSidebar() {
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
        <span class="badge ${isWritable ? 'write' : 'readonly'}">${isWritable ? 'Write Access' : 'Read Only'}</span>
      </div>
      ${isEmbedded ? '' : '<button class="close-btn">&times;</button>'}
    </div>

    ${
      !isWritable
        ? `
      <div class="pat-auth-wrapper">
        <div class="pat-auth-message">Comments are read-only. Provide a Personal Access Token (PAT) with <code>repo</code> scope to enable writing.</div>
        ${
          lastAuthError
            ? `
          <div class="pat-auth-error">
            <strong>Authentication Error:</strong> ${lastAuthError}
          </div>
        `
            : ''
        }
        <div class="pat-auth-input-group">
          <input type="password" class="pat-auth-input" placeholder="ghp_..." />
          <button class="pat-auth-submit-btn">Save</button>
        </div>
      </div>
    `
        : ''
    }

    <div id="batch-comments-container"></div>
    
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
      ${
        isWritable
          ? `
        <div class="page-composer" style="padding: 16px; border-top: 1px solid var(--sidebar-border); display: flex; flex-direction: column; gap: 8px;">
          <textarea placeholder="Write a page comment..." class="page-textarea" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid var(--sidebar-border); background-color: var(--composer-bg); color: var(--text-primary); font-size: 13px; min-height: 80px; font-family: inherit; resize: vertical; outline: none;"></textarea>
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary submit-page-btn" style="padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: none; background-color: var(--accent-color); color: white; cursor: pointer;">Send</button>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Register events
  if (!isEmbedded) {
    activeSidebarHost.querySelector('.close-btn')?.addEventListener('click', closeSidebar);
  }

  // Submit PAT Token directly from Sidebar
  activeSidebarHost.querySelector('.pat-auth-submit-btn')?.addEventListener('click', () => {
    const input = activeSidebarHost?.querySelector('.pat-auth-input') as HTMLInputElement;
    const token = input?.value.trim();
    if (!token) return;

    input.disabled = true;
    const btn = activeSidebarHost?.querySelector('.pat-auth-submit-btn') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    chrome.storage.local.set({ fallbackToken: token }, () => {
      cleanupInjections();
      handlePageLoad().catch((err) => {
        console.error('[md-comments] Error reloading comments with new PAT:', err);
      });
    });
  });

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
    const textarea = activeSidebarHost?.querySelector('.page-textarea') as HTMLTextAreaElement;
    const body = textarea?.value.trim();
    if (!body) return;

    textarea.disabled = true;
    try {
      await saveNewPageComment(body);
      textarea.value = '';
      const pageDraftKey = getDraftKey('page');
      saveDraft(pageDraftKey, '');
    } catch (e) {
      alert('Failed to save comment: ' + e);
    } finally {
      textarea.disabled = false;
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
  }

  // Load batch comments panel state and setup event listeners
  updateBatchPanel();

  if (!isEmbedded) {
    document.body.appendChild(activeSidebarHost);
  }
}

function openSidebar(tab: 'inline' | 'page', highlightCommentId?: string) {
  injectSidebar();
  if (!activeSidebarHost) return;

  if (activeSidebarHost.id !== 'md-comments-sidebar-embedded') {
    document.body.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    document.body.style.width = 'calc(100% - 380px)';
    activeSidebarHost.style.transform = 'translateX(0px)';
  } else {
    activeSidebarHost.style.transform = 'none';
  }

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
  if (!activeSidebarHost || activeSidebarHost.id === 'md-comments-sidebar-embedded') return;
  activeSidebarHost.style.transform = 'translateX(100%)';
  document.body.style.width = '';
}

function renderSidebarComments() {
  if (!activeSidebarHost) return;

  getDisplayAuthor().then((author) => {
    currentDisplayAuthor = author;

    const inlineList = activeSidebarHost!.querySelector('#inline-threads');
    const pageList = activeSidebarHost!.querySelector('#page-threads');

    if (inlineList) {
      if (loadedComments.inline_comments.length === 0) {
        inlineList.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No inline comments yet. Hover over paragraphs to add feedback.</div>`;
      } else {
        inlineList.innerHTML = loadedComments.inline_comments
          .map((c) => renderCommentCard(c, 'inline'))
          .join('');
        attachCommentCardEvents(inlineList as HTMLElement, 'inline');
      }
    }

    if (pageList) {
      if (loadedComments.page_comments.length === 0) {
        pageList.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No page discussion comments yet. Use the composer below to start.</div>`;
      } else {
        pageList.innerHTML = loadedComments.page_comments
          .map((c) => renderCommentCard(c, 'page'))
          .join('');
        attachCommentCardEvents(pageList as HTMLElement, 'page');
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

function attachCommentCardEvents(container: HTMLElement, type: 'inline' | 'page') {
  container.querySelectorAll('.comment-card').forEach((card) => {
    const commentId = card.getAttribute('data-id') || '';

    // Reply click handler
    const replyInput = card.querySelector('.reply-input') as HTMLInputElement;
    const replyWrapper = card.querySelector('.reply-composer-wrapper') as HTMLElement;
    if (replyInput && replyWrapper) {
      const replyDraftKey = getDraftKey('reply:' + commentId);
      const hasReplyDraft = replyDraftKey && draftsStore[replyDraftKey];

      const handleReplyClick = async () => {
        replyInput.style.display = 'none';
        replyWrapper.style.display = 'block';

        if (type === 'page') {
          showFallbackReplyComposer(
            replyWrapper,
            async (body) => {
              await saveReply(commentId, type, body);
              replyWrapper.style.display = 'none';
              replyInput.style.display = 'block';
            },
            () => {
              replyWrapper.style.display = 'none';
              replyInput.style.display = 'block';
            },
            replyDraftKey
          );
        } else {
          // Find the matching block line
          const inlineComment = loadedComments.inline_comments.find((c) => c.id === commentId);
          const pIndex = inlineComment ? inlineComment.paragraph_index : 0;
          const block = parsedAnchors.find((a) => a.paragraph_index === pIndex);
          const line = block && block.line_number !== undefined ? block.line_number + 1 : 1;

          try {
            await triggerAndMoveNativeComposer(
              currentMetadata!.filePath,
              line,
              replyWrapper,
              async (body) => {
                await saveReply(commentId, type, body);
                replyWrapper.style.display = 'none';
                replyInput.style.display = 'block';
              },
              () => {
                replyWrapper.style.display = 'none';
                replyInput.style.display = 'block';
              },
              replyDraftKey
            );
          } catch (err) {
            console.warn(
              '[md-comments] Trigger native composer for reply failed, falling back:',
              err
            );
            showFallbackReplyComposer(
              replyWrapper,
              async (body) => {
                await saveReply(commentId, type, body);
                replyWrapper.style.display = 'none';
                replyInput.style.display = 'block';
              },
              () => {
                replyWrapper.style.display = 'none';
                replyInput.style.display = 'block';
              },
              replyDraftKey
            );
          }
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

          saveBtn.disabled = true;
          textarea.disabled = true;
          try {
            await editComment(commentId, type, newBody);
            if (editDraftKey) {
              saveDraft(editDraftKey, '');
            }
          } catch (err) {
            alert('Failed to edit comment: ' + err);
            saveBtn.disabled = false;
            textarea.disabled = false;
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
          try {
            await deleteComment(commentId, type);
          } catch (err) {
            alert('Failed to delete comment: ' + err);
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

            saveBtn.disabled = true;
            textarea.disabled = true;
            try {
              await editReply(commentId, replyId, type, newBody);
              if (editReplyDraftKey) {
                saveDraft(editReplyDraftKey, '');
              }
            } catch (err) {
              alert('Failed to edit reply: ' + err);
              saveBtn.disabled = false;
              textarea.disabled = false;
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
            try {
              await deleteReply(commentId, replyId, type);
            } catch (err) {
              alert('Failed to delete reply: ' + err);
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
      composer.style.display = 'none';
      saveDraft(draftKey, '');
    },
    () => {
      composer.style.display = 'none';
      saveDraft(draftKey, '');
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
        composer.style.display = 'none';
        saveDraft(draftKey, '');
      },
      () => {
        composer.style.display = 'none';
        saveDraft(draftKey, '');
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
        const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, meta.pullNumber);
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
    const prInfo = await githubApi.getPullRequestInfo(meta.owner, meta.repo, meta.pullNumber);
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
      hl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const commentId = hl.dataset.commentId;
        if (commentId) {
          openSidebar('inline', commentId);
        }
      });
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
}

function findDomParagraphs(markdownBody: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];
  for (const child of Array.from(markdownBody.children)) {
    const htmlChild = child as HTMLElement;
    const tagName = htmlChild.tagName.toLowerCase();

    if (htmlChild.classList.contains('highlight') || tagName === 'pre') {
      continue;
    }

    if (['p', 'blockquote', 'ul', 'ol'].includes(tagName)) {
      if (tagName === 'ul' || tagName === 'ol') {
        for (const li of Array.from(htmlChild.querySelectorAll('li'))) {
          elements.push(li as HTMLElement);
        }
      } else {
        elements.push(htmlChild);
      }
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

// Data Saving Flow
async function commitCommentFileChanges(updatedComments: CommentsFile, action: string) {
  if (!githubApi || !currentMetadata || !repoInfo) {
    throw new Error('GitHub API client is not initialized or repo metadata is missing');
  }

  const { owner, repo, filePath } = currentMetadata;
  const commentsPath = filePath.replace(/\.md$/i, '.comments.yml');

  const fileCtx = loadedFileContexts.get(filePath);
  const anchors = fileCtx ? fileCtx.anchors : parsedAnchors;
  if (anchors && updatedComments.inline_comments) {
    const placements = placeInlineComments(anchors, updatedComments.inline_comments);
    updatedComments.inline_comments.forEach((c) => {
      const placement = placements.find((p) => p.comment.id === c.id);
      if (placement) {
        c.orphaned = isOrphanedPlacement(anchors, placement);
      }
    });
  }

  if (batchCommentsMode) {
    const cache = await getPendingCommentsCache();
    if (!cache[filePath]) {
      cache[filePath] = {
        original: JSON.parse(JSON.stringify(loadedComments)),
        current: updatedComments,
      };
    } else {
      cache[filePath].current = updatedComments;
    }
    await savePendingCommentsCache(cache);

    loadedComments = updatedComments;
    if (fileCtx) {
      fileCtx.comments = loadedComments;
    }

    renderSidebarComments();
    updateTabCommentsCount();
    updateBatchPanel();

    if (currentMetadata) {
      const fileContainers = document.querySelectorAll('.js-file, .file');
      for (const fileEl of Array.from(fileContainers)) {
        const htmlEl = fileEl as HTMLElement;
        const path = getFilePathFromFileContainer(htmlEl);
        if (path === currentMetadata.filePath) {
          const markdownBody = htmlEl.querySelector('.markdown-body') as HTMLElement;
          if (markdownBody) {
            renderDOMIndicatorsForFile(
              markdownBody,
              path,
              anchors || parsedAnchors,
              loadedComments
            );
          }
          break;
        }
      }
    }
    return;
  }

  const yamlContent = yaml.dump(updatedComments, { lineWidth: -1, noRefs: true });

  // 1. Get head commit OID of write branch
  const targetBranchInfo = await githubApi.checkBranchExists(owner, repo, writeBranch);
  let targetBranchHeadOid = targetBranchInfo ? targetBranchInfo.oid : null;
  let lastCommitMessage = targetBranchInfo ? targetBranchInfo.message : null;

  const isCommentsBranch = writeBranch.startsWith('comments/');
  if (squashCommits && isCommentsBranch && targetBranchHeadOid) {
    console.log(`Squashing comments commits. Deleting and recreating branch ${writeBranch}...`);
    try {
      await githubApi.deleteBranch(owner, repo, writeBranch);
      targetBranchHeadOid = null;
      lastCommitMessage = null;
    } catch (err) {
      console.warn(`Failed to delete branch ${writeBranch} for squashing:`, err);
    }
  }

  if (!targetBranchHeadOid) {
    if (repoInfo.isProtected && writeBranch.startsWith('comments/')) {
      console.log(`Creating branch ${writeBranch}...`);
      if (!repoInfo.headOid) {
        throw new Error('Original branch head OID is unknown');
      }
      targetBranchHeadOid = await githubApi.createBranch(
        repoInfo.id,
        writeBranch,
        repoInfo.headOid
      );
    } else {
      throw new Error(`Target branch ${writeBranch} does not exist`);
    }
  }

  let commitMessage = '';
  if (useFixupCommits && lastCommitMessage && isCommentCommit(lastCommitMessage)) {
    commitMessage = lastCommitMessage.startsWith('fixup! ')
      ? lastCommitMessage
      : `fixup! ${lastCommitMessage}`;
  } else {
    commitMessage = formatCommitMessage(action);
  }

  // 2. Commit the comments file to write branch
  console.log(`Committing updates to branch ${writeBranch}...`);
  await githubApi.commitFile(
    owner,
    repo,
    writeBranch,
    commentsPath,
    yamlContent,
    commitMessage,
    targetBranchHeadOid
  );

  // Update local comments cache and re-render
  loadedComments = updatedComments;

  // Re-render sidebar comments
  renderSidebarComments();
  updateTabCommentsCount();

  // Re-render indicators in case comments were resolved, added, etc.
  if (currentMetadata) {
    const fileContainers = document.querySelectorAll('.js-file, .file');
    for (const fileEl of Array.from(fileContainers)) {
      const htmlEl = fileEl as HTMLElement;
      const path = getFilePathFromFileContainer(htmlEl);
      if (path === currentMetadata.filePath) {
        const markdownBody = htmlEl.querySelector('.markdown-body') as HTMLElement;
        if (markdownBody) {
          const fileCtx = loadedFileContexts.get(path);
          if (fileCtx) {
            fileCtx.comments = loadedComments;
          }
          renderDOMIndicatorsForFile(markdownBody, path, parsedAnchors, loadedComments);
        }
        break;
      }
    }
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

  await commitCommentFileChanges(updated, 'reply to comment');
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

async function deleteComment(commentId: string, type: 'inline' | 'page') {
  const updated = { ...loadedComments };
  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.filter((c) => c.id !== commentId);
  } else {
    updated.page_comments = updated.page_comments.filter((c) => c.id !== commentId);
  }
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

async function deleteReply(commentId: string, replyId: string, type: 'inline' | 'page') {
  const updated = { ...loadedComments };
  if (type === 'inline') {
    updated.inline_comments = updated.inline_comments.map((c) => {
      if (c.id === commentId) {
        const updatedReplies = c.replies.filter((r) => r.id !== replyId);
        return { ...c, replies: updatedReplies };
      }
      return c;
    });
  } else {
    updated.page_comments = updated.page_comments.map((c) => {
      if (c.id === commentId) {
        const updatedReplies = c.replies.filter((r) => r.id !== replyId);
        return { ...c, replies: updatedReplies };
      }
      return c;
    });
  }
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

interface CacheEntry {
  original: CommentsFile;
  current: CommentsFile;
}

interface PendingCommentsCache {
  [filePath: string]: CacheEntry;
}

function getCacheKey(): string {
  const meta = parseGitHubUrl(window.location.href);
  if (!meta || meta.type !== 'pull') return '';
  return `pending_comments_${meta.owner}_${meta.repo}_${meta.pullNumber}`;
}

async function getPendingCommentsCache(): Promise<PendingCommentsCache> {
  const key = getCacheKey();
  if (!key) return {};
  return new Promise((resolve) => {
    chrome.storage.local.get({ [key]: {} }, (items) => {
      resolve(items[key] || {});
    });
  });
}

async function savePendingCommentsCache(cache: PendingCommentsCache): Promise<void> {
  const key = getCacheKey();
  if (!key) return;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: cache }, () => {
      resolve();
    });
  });
}

async function clearPendingCommentsCache(): Promise<void> {
  const key = getCacheKey();
  if (!key) return;
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve();
    });
  });
}

function countPendingChangesForFile(original: CommentsFile, current: CommentsFile): number {
  let count = 0;

  // Inline comments
  const originalInlineMap = new Map((original.inline_comments || []).map((c) => [c.id, c]));
  for (const c of current.inline_comments || []) {
    const orig = originalInlineMap.get(c.id);
    if (!orig) {
      count++; // New comment
    } else {
      if (orig.body !== c.body || orig.resolved !== c.resolved) {
        count++; // Edited or resolved state changed
      }

      // Count reply changes
      const origReplyMap = new Map((orig.replies || []).map((r) => [r.id, r]));
      for (const r of c.replies || []) {
        const origR = origReplyMap.get(r.id);
        if (!origR) {
          count++; // New reply
        } else if (origR.body !== r.body) {
          count++; // Edited reply
        }
      }
      for (const r of orig.replies || []) {
        if (!(c.replies || []).some((currR) => currR.id === r.id)) {
          count++; // Deleted reply
        }
      }
    }
  }

  for (const c of original.inline_comments || []) {
    if (!(current.inline_comments || []).some((currC) => currC.id === c.id)) {
      count++; // Deleted inline comment
    }
  }

  // Page comments
  const originalPageMap = new Map((original.page_comments || []).map((c) => [c.id, c]));
  for (const c of current.page_comments || []) {
    const orig = originalPageMap.get(c.id);
    if (!orig) {
      count++;
    } else {
      if (orig.body !== c.body || orig.resolved !== c.resolved) {
        count++;
      }

      const origReplyMap = new Map((orig.replies || []).map((r) => [r.id, r]));
      for (const r of c.replies || []) {
        const origR = origReplyMap.get(r.id);
        if (!origR) {
          count++;
        } else if (origR.body !== r.body) {
          count++;
        }
      }
      for (const r of orig.replies || []) {
        if (!(c.replies || []).some((currR) => currR.id === r.id)) {
          count++;
        }
      }
    }
  }

  for (const c of original.page_comments || []) {
    if (!(current.page_comments || []).some((currC) => currC.id === c.id)) {
      count++;
    }
  }

  return count;
}

async function submitBatchComments() {
  if (!githubApi || !currentMetadata || !repoInfo) {
    throw new Error('GitHub API client is not initialized or repo metadata is missing');
  }

  const { owner, repo } = currentMetadata;
  const cache = await getPendingCommentsCache();

  const additions: { filePath: string; content: string }[] = [];
  for (const filePath of Object.keys(cache)) {
    const entry = cache[filePath];
    const commentsPath = filePath.replace(/\.md$/i, '.comments.yml');

    const fileCtx = loadedFileContexts.get(filePath);
    const anchors = fileCtx ? fileCtx.anchors : parsedAnchors;
    if (anchors && entry.current.inline_comments) {
      const placements = placeInlineComments(anchors, entry.current.inline_comments);
      entry.current.inline_comments.forEach((c) => {
        const placement = placements.find((p) => p.comment.id === c.id);
        if (placement) {
          c.orphaned = isOrphanedPlacement(anchors, placement);
        }
      });
    }

    const yamlContent = yaml.dump(entry.current, { lineWidth: -1, noRefs: true });
    additions.push({
      filePath: commentsPath,
      content: yamlContent,
    });
  }

  if (additions.length === 0) {
    console.log('[md-comments] No pending comments to submit');
    return;
  }

  const submitBtn = activeSidebarHost?.querySelector('.submit-batch-btn') as HTMLButtonElement;
  const discardBtn = activeSidebarHost?.querySelector('.discard-batch-btn') as HTMLButtonElement;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }
  if (discardBtn) {
    discardBtn.disabled = true;
  }

  try {
    const targetBranchInfo = await githubApi.checkBranchExists(owner, repo, writeBranch);
    let targetBranchHeadOid = targetBranchInfo ? targetBranchInfo.oid : null;
    let lastCommitMessage = targetBranchInfo ? targetBranchInfo.message : null;

    const isCommentsBranch = writeBranch.startsWith('comments/');
    if (squashCommits && isCommentsBranch && targetBranchHeadOid) {
      console.log(`Squashing comments commits. Deleting and recreating branch ${writeBranch}...`);
      try {
        await githubApi.deleteBranch(owner, repo, writeBranch);
        targetBranchHeadOid = null;
        lastCommitMessage = null;
      } catch (err) {
        console.warn(`Failed to delete branch ${writeBranch} for squashing:`, err);
      }
    }

    if (!targetBranchHeadOid) {
      if (repoInfo.isProtected && writeBranch.startsWith('comments/')) {
        console.log(`Creating branch ${writeBranch}...`);
        if (!repoInfo.headOid) {
          throw new Error('Original branch head OID is unknown');
        }
        targetBranchHeadOid = await githubApi.createBranch(
          repoInfo.id,
          writeBranch,
          repoInfo.headOid
        );
      } else {
        throw new Error(`Target branch ${writeBranch} does not exist`);
      }
    }

    let commitMessage = '';
    const action = 'submit batch of comments';
    if (useFixupCommits && lastCommitMessage && isCommentCommit(lastCommitMessage)) {
      commitMessage = lastCommitMessage.startsWith('fixup! ')
        ? lastCommitMessage
        : `fixup! ${lastCommitMessage}`;
    } else {
      commitMessage = formatCommitMessage(action);
    }

    console.log(`Committing updates for ${additions.length} files to branch ${writeBranch}...`);
    await githubApi.commitFiles(
      owner,
      repo,
      writeBranch,
      additions,
      commitMessage,
      targetBranchHeadOid
    );

    await clearPendingCommentsCache();

    if (currentMetadata) {
      const activeFilePath = currentMetadata.filePath;
      if (cache[activeFilePath]) {
        loadedComments = cache[activeFilePath].current;
      }

      for (const filePath of Object.keys(cache)) {
        const fileCtx = loadedFileContexts.get(filePath);
        if (fileCtx) {
          fileCtx.comments = cache[filePath].current;
        }
      }
    }

    renderSidebarComments();
    updateTabCommentsCount();
    updateBatchPanel();
  } catch (err) {
    console.error('[md-comments] Failed to submit comments batch:', err);
    alert('Failed to submit comments batch: ' + (err instanceof Error ? err.message : String(err)));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = `Submit All`;
    }
    if (discardBtn) {
      discardBtn.disabled = false;
    }
  }
}

async function discardBatchComments() {
  if (
    !confirm(
      'Are you sure you want to discard all pending comments in this batch? This cannot be undone.'
    )
  ) {
    return;
  }

  const cache = await getPendingCommentsCache();
  await clearPendingCommentsCache();

  if (currentMetadata) {
    const activeFilePath = currentMetadata.filePath;
    if (cache[activeFilePath]) {
      loadedComments = cache[activeFilePath].original;
    }

    for (const filePath of Object.keys(cache)) {
      const fileCtx = loadedFileContexts.get(filePath);
      if (fileCtx) {
        fileCtx.comments = cache[filePath].original;
      }
    }
  }

  renderSidebarComments();
  updateTabCommentsCount();
  updateBatchPanel();

  if (currentMetadata) {
    const fileContainers = document.querySelectorAll('.js-file, .file');
    for (const fileEl of Array.from(fileContainers)) {
      const htmlEl = fileEl as HTMLElement;
      const path = getFilePathFromFileContainer(htmlEl);
      if (path === currentMetadata.filePath) {
        const markdownBody = htmlEl.querySelector('.markdown-body') as HTMLElement;
        if (markdownBody) {
          const fileCtx = loadedFileContexts.get(path);
          renderDOMIndicatorsForFile(
            markdownBody,
            path,
            fileCtx ? fileCtx.anchors : parsedAnchors,
            loadedComments
          );
        }
        break;
      }
    }
  }
}

async function updateBatchPanel() {
  const container = activeSidebarHost?.querySelector('#batch-comments-container') as HTMLElement;
  if (!container || !isWritable) return;

  const cache = await getPendingCommentsCache();
  let totalPending = 0;
  for (const filePath of Object.keys(cache)) {
    totalPending += countPendingChangesForFile(cache[filePath].original, cache[filePath].current);
  }

  const hasPending = totalPending > 0;

  container.innerHTML = `
    <div class="batch-comments-panel" style="padding: 12px 16px; border-bottom: 1px solid var(--sidebar-border); background-color: var(--card-bg); display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; cursor: pointer; margin: 0; color: var(--text-primary);">
          <input type="checkbox" id="batch-mode-toggle" style="margin: 0; cursor: pointer;" ${batchCommentsMode ? 'checked' : ''} />
          Batch Commenting
        </label>
        <span class="batch-status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; background-color: ${hasPending ? 'rgba(210, 153, 34, 0.15)' : 'rgba(139, 148, 158, 0.1)'}; color: ${hasPending ? 'var(--warn-color)' : 'var(--text-secondary)'};">
          ${totalPending} pending
        </span>
      </div>
      ${
        hasPending
          ? `
        <div class="batch-actions" style="display: flex; gap: 8px; margin-top: 4px;">
          <button class="btn btn-primary submit-batch-btn" style="flex: 1; padding: 6px 12px; font-size: 12px; font-weight: 600; border: none; border-radius: 6px; background-color: var(--success-color); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            Submit All (${totalPending})
          </button>
          <button class="btn btn-secondary discard-batch-btn" style="padding: 6px 12px; font-size: 12px; border: 1px solid var(--sidebar-border); border-radius: 6px; background-color: transparent; color: #ff7b72; cursor: pointer;">
            Discard
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;

  container.querySelector('#batch-mode-toggle')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    if (!checked && hasPending) {
      if (
        confirm(
          'You have pending comments in your batch. Turning off Batch Commenting will keep them in draft state. Submit them now?'
        )
      ) {
        await submitBatchComments();
        return;
      }
    }
    batchCommentsMode = checked;
    chrome.storage.local.set({ batchCommentsMode: checked }, () => {
      updateBatchPanel();
    });
  });

  container.querySelector('.submit-batch-btn')?.addEventListener('click', async () => {
    await submitBatchComments();
  });

  container.querySelector('.discard-batch-btn')?.addEventListener('click', async () => {
    await discardBatchComments();
  });
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
    const anchorText = selection ? selection.toString().trim() : paragraphEl.innerText;
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

    if (!fileEl || fileEl.nodeType !== Node.ELEMENT_NODE) {
      hideSelectionButton();
      return;
    }

    const filePath = getFilePathFromFileContainer(fileEl);
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

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);
window.addEventListener('scroll', hideSelectionButton);
