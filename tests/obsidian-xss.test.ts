import { describe, it, expect } from 'vitest';
import { CommentsSidebarView } from '../obsidian-plugin/src/sidebarView';

describe('Obsidian Sidebar Stored XSS Prevention (SEC-02)', () => {
  const mockPlugin: any = {
    settings: { authorName: 'test-user' },
    app: {
      workspace: { getActiveFile: () => null },
      vault: { adapter: {} },
    },
    getCommentsStorage: () => null,
  };

  const view = new CommentsSidebarView({} as any, mockPlugin);

  it('safely escapes HTML tags in resolved comment body excerpts', () => {
    const maliciousComment: any = {
      id: 'c1',
      author: 'alice',
      created_at: new Date().toISOString(),
      body: '<img src=x onerror=alert(1)> and some long text to exceed 45 chars threshold',
      resolved: true,
      replies: [],
    };

    const rendered = (view as any).renderResolvedCollapse(maliciousComment, 'inline', '');

    expect(rendered).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(rendered).not.toContain('<img src=x onerror=alert(1)>');
    expect(rendered).toContain('md-comments-resolved-summary-excerpt');
  });

  it('safely escapes HTML in anchor quotes', () => {
    const comment: any = {
      id: 'c2',
      author: 'bob',
      created_at: new Date().toISOString(),
      body: 'Normal comment body',
      resolved: false,
      replies: [],
    };

    const maliciousQuote = '<script>alert("pwned")</script>';
    const rendered = (view as any).renderThread(comment, 'inline', maliciousQuote);

    expect(rendered).toContain('&lt;script&gt;alert(&quot;pwned&quot;)&lt;&#x2F;script&gt;');
    expect(rendered).not.toContain('<script>');
  });
});
