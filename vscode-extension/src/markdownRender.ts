import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import { getAuthor, getAuthorDisplayName } from './author';
import { collectAvatarLogins, warmGitHubAvatars } from './githubAvatars';
import { collectGitHubLogins, warmGitHubDisplayNames } from './githubDisplayNames';
import { extendMarkdownIt } from './markdownItPlugin';
import { readComments } from './commentStore';
import { getOAuthToken } from './githubAuth';

import hljs from 'highlight.js';

let engine: InstanceType<typeof MarkdownIt> | null = null;

export function getMarkdownEngine(): InstanceType<typeof MarkdownIt> {
  if (!engine) {
    engine = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre><code class="hljs language-${engine?.utils.escapeHtml(lang) || lang}">${
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
            }</code></pre>`;
          } catch {
            /* fall through to default escaped block */
          }
        }
        const escaped = engine ? engine.utils.escapeHtml(str) : str;
        return `<pre><code class="hljs">${escaped}</code></pre>`;
      },
    });
    extendMarkdownIt(engine);
  }
  return engine;
}

export async function renderMarkdownWithComments(
  markdown: string,
  documentUri: vscode.Uri,
  forceRefresh = false
): Promise<string> {
  let commentsLoaded = false;
  try {
    const comments = await readComments(documentUri, forceRefresh);
    commentsLoaded = true;
    const logins = collectGitHubLogins(comments);
    await warmGitHubDisplayNames(logins);
    await warmGitHubAvatars(collectAvatarLogins(comments));
  } catch {
    /* comments file optional */
  }
  try {
    await getOAuthToken();
  } catch {
    /* auth optional */
  }
  const currentAuthor = await getAuthor();
  const currentAuthorName = await getAuthorDisplayName();
  const md = getMarkdownEngine();
  return md.render(markdown, {
    currentDocument: documentUri,
    currentAuthor,
    currentAuthorName,
    mdCommentsWebview: true,
    isLoading: !commentsLoaded,
  });
}

export function renderMarkdownInitialLoading(markdown: string, documentUri: vscode.Uri): string {
  const md = getMarkdownEngine();
  return md.render(markdown, {
    currentDocument: documentUri,
    mdCommentsWebview: true,
    isLoading: true,
  });
}
