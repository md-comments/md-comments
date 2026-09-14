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

  it('safely escapes unescaped author display names in thread, reply, and resolved summary (SEC-03)', () => {
    const maliciousAuthor = '<img src=x onerror=alert("display_name_xss")>';
    const comment: any = {
      id: 'c3',
      author: maliciousAuthor,
      created_at: new Date().toISOString(),
      body: 'Testing author XSS',
      resolved: false,
      replies: [
        {
          id: 'r1',
          author: '<svg onload=alert(2)>',
          created_at: new Date().toISOString(),
          body: 'Testing reply author XSS',
        },
      ],
    };

    const threadHtml = (view as any).renderThread(comment, 'inline', '');
    expect(threadHtml).toContain('&lt;img src=x onerror=alert(&quot;display_name_xss&quot;)&gt;');
    expect(threadHtml).not.toContain('<img src=x onerror=alert("display_name_xss")>');
    expect(threadHtml).toContain('&lt;svg onload=alert(2)&gt;');
    expect(threadHtml).not.toContain('<svg onload=alert(2)>');

    const resolvedHtml = (view as any).renderResolvedCollapse(comment, 'inline', '');
    expect(resolvedHtml).toContain('&lt;img src=x onerror=alert(&quot;display_name_xss&quot;)&gt;');
    expect(resolvedHtml).not.toContain('<img src=x onerror=alert("display_name_xss")>');
  });
});
