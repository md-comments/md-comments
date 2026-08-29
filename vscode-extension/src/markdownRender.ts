import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import { getAuthor } from './author';
import { collectAvatarLogins, warmGitHubAvatars } from './githubAvatars';
import { collectGitHubLogins, warmGitHubDisplayNames } from './githubDisplayNames';
import { extendMarkdownIt } from './markdownItPlugin';
import { readComments } from './commentStore';

let engine: InstanceType<typeof MarkdownIt> | null = null;

export function getMarkdownEngine(): InstanceType<typeof MarkdownIt> {
  if (!engine) {
    engine = new MarkdownIt({ html: true, linkify: true, typographer: true });
    extendMarkdownIt(engine);
  }
  return engine;
}

export async function renderMarkdownWithComments(
  markdown: string,
  documentUri: vscode.Uri,
  forceRefresh = false
): Promise<string> {
  try {
    const comments = await readComments(documentUri, forceRefresh);
    const logins = collectGitHubLogins(comments);
    await warmGitHubDisplayNames(logins);
    await warmGitHubAvatars(collectAvatarLogins(comments));
  } catch {
    /* comments file optional */
  }
  const currentAuthor = await getAuthor();
  const md = getMarkdownEngine();
  return md.render(markdown, {
    currentDocument: documentUri,
    currentAuthor,
    mdCommentsWebview: true,
  });
}
