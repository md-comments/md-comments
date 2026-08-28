import { CommentsOverlay } from './components/CommentsOverlay.js';

function mountMdComments(): void {
  if (typeof document === 'undefined') return;

  const container =
    document.querySelector('.sl-markdown-content') ||
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.body;

  // Prevent multiple initializations on the same page
  if (container && !document.querySelector('.md-comments-drawer')) {
    const options = (window as any).__MD_COMMENTS_OPTIONS__ || {};
    const overlay = new CommentsOverlay(container as HTMLElement, options);
    overlay.init().catch(console.error);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountMdComments);
  } else {
    mountMdComments();
  }

  // Support Astro View Transitions and Starlight SPA navigation
  document.addEventListener('astro:page-load', mountMdComments);
}
