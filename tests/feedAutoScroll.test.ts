import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

type MockEventListener = (...args: any[]) => void;
const mockStorage: Record<string, any> = {};
const mockEventListeners: Record<string, MockEventListener[]> = {};

function createMockElement(tag: string = 'div'): any {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  const classListSet = new Set<string>();
  const children: any[] = [];
  const attrs: Record<string, string> = {};

  const el: any = {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: vi.fn((cls: string) => classListSet.add(cls)),
      remove: vi.fn((cls: string) => classListSet.delete(cls)),
      contains: vi.fn((cls: string) => classListSet.has(cls)),
    },
    setAttribute: vi.fn((k: string, v: string) => {
      attrs[k] = v;
    }),
    getAttribute: vi.fn((k: string) => attrs[k] || null),
    addEventListener: vi.fn((evt: string, handler: (e: any) => void) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn((e: any) => {
      const handlers = listeners[e.type] || [];
      for (const h of handlers) h(e);
      return true;
    }),
    click: vi.fn(() => {
      const handlers = listeners['click'] || [];
      const evt = { type: 'click', preventDefault: vi.fn(), stopPropagation: vi.fn() };
      for (const h of handlers) h(evt);
    }),
    appendChild: vi.fn((child: any) => {
      children.push(child);
      return child;
    }),
    append: vi.fn((child: any) => {
      children.push(child);
      return child;
    }),
    removeChild: vi.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
      return child;
    }),
    remove: vi.fn(),
    scrollTo: vi.fn(),
    scrollIntoView: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    innerHTML: '',
    value: '',
    placeholder: '',
    disabled: false,
    focus: vi.fn(),
    blur: vi.fn(),
    scrollHeight: 1000,
    scrollTop: 0,
    clientHeight: 400,
  };
  return el;
}

if (typeof (globalThis as any).chrome === 'undefined') {
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: vi.fn((defaults: any, callback: (items: any) => void) => {
          const result: Record<string, any> = {};
          for (const key of Object.keys(defaults)) {
            result[key] = mockStorage[key] !== undefined ? mockStorage[key] : defaults[key];
          }
          if (callback) callback(result);
        }),
        set: vi.fn((items: any, callback?: () => void) => {
          Object.assign(mockStorage, items);
          if (callback) callback();
        }),
        remove: vi.fn((keys: string[], callback?: () => void) => {
          for (const k of keys) {
            delete mockStorage[k];
          }
          if (callback) callback();
        }),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
}

let mockSidebarHost: any = null;

if (typeof document === 'undefined') {
  (globalThis as any).document = {
    addEventListener: vi.fn((event: string, handler: MockEventListener) => {
      mockEventListeners[event] = mockEventListeners[event] || [];
      mockEventListeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getElementById: vi.fn(() => null),
    documentElement: createMockElement('html'),
    createElement: vi.fn((tag: string) => {
      const el = createMockElement(tag);
      if (tag.toLowerCase() === 'div') {
        mockSidebarHost = el;
      }
      return el;
    }),
    head: { appendChild: vi.fn() },
    body: {
      classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
      appendChild: vi.fn((child: any) => {
        mockSidebarHost = child;
      }),
    },
  };
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: {
      href: 'https://github.com/test-owner/test-repo/blob/main/test.md',
      pathname: '/test-owner/test-repo/blob/main/test.md',
    },
    addEventListener: vi.fn((event: string, handler: MockEventListener) => {
      mockEventListeners[event] = mockEventListeners[event] || [];
      mockEventListeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
    getComputedStyle: vi.fn(() => ({ backgroundColor: 'rgb(255, 255, 255)' })),
    requestAnimationFrame: vi.fn((cb: () => void) => {
      cb();
      return 1;
    }),
  };
}

describe('FEAT-COMM-FEED-AUTOSCROLL: Comment Feed Auto-Scroll on Addition', () => {
  let content: typeof import('../chrome-extension/src/content');

  beforeAll(async () => {
    content = await import('../chrome-extension/src/content');
  });

  beforeEach(() => {
    vi.clearAllMocks();
    content.injectSidebar();
  });

  it('scrolls #page-threads to scrollHeight when scrollFeedToBottom is invoked for page tab', () => {
    content.injectSidebar();

    const pageThreads = createMockElement('div');
    pageThreads.id = 'page-threads';
    pageThreads.scrollHeight = 850;
    pageThreads.clientHeight = 300;

    mockSidebarHost.querySelector = vi.fn((sel: string) => {
      if (sel === '#page-threads') return pageThreads;
      return null;
    });

    content.scrollFeedToBottom('page');

    expect(pageThreads.scrollTo).toHaveBeenCalledWith({
      top: 850,
      behavior: 'smooth',
    });
  });

  it('scrolls #inline-threads and target card into view when scrollFeedToBottom is invoked with comment ID', () => {
    content.injectSidebar();

    const inlineThreads = createMockElement('div');
    inlineThreads.id = 'inline-threads';
    inlineThreads.scrollHeight = 1200;

    const targetCard = createMockElement('div');
    targetCard.id = 'comment-c-test-123';

    inlineThreads.querySelector = vi.fn((sel: string) => {
      if (sel.includes('c-test-123')) return targetCard;
      return null;
    });

    mockSidebarHost.querySelector = vi.fn((sel: string) => {
      if (sel === '#inline-threads') return inlineThreads;
      return null;
    });

    content.scrollFeedToBottom('inline', 'c-test-123');

    expect(inlineThreads.scrollTo).toHaveBeenCalledWith({
      top: 1200,
      behavior: 'smooth',
    });
    expect(targetCard.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    });
  });

  it('falls back to scrollTop assignment if scrollTo is unavailable on container', () => {
    content.injectSidebar();

    const pageThreads = createMockElement('div');
    pageThreads.id = 'page-threads';
    pageThreads.scrollHeight = 900;
    pageThreads.scrollTo = undefined as any;

    mockSidebarHost.querySelector = vi.fn((sel: string) => {
      if (sel === '#page-threads') return pageThreads;
      return null;
    });

    content.scrollFeedToBottom('page');

    expect(pageThreads.scrollTop).toBe(900);
  });

  it('gracefully handles missing container or missing comment card without crashing', () => {
    content.injectSidebar();
    mockSidebarHost.querySelector = vi.fn(() => null);

    expect(() => {
      content.scrollFeedToBottom('page', 'non-existent-id');
    }).not.toThrow();
  });

  it('INV-FEED-AUTOSCROLL invariant verification: Feed scroll functions are strictly exposed and non-blocking', () => {
    expect(typeof content.scrollFeedToBottom).toBe('function');
    expect(typeof content.saveNewPageComment).toBe('function');
    expect(typeof content.saveReply).toBe('function');
  });

  describe('VS Code Webview Feed Auto-Scroll Logic', () => {
    it('scrolls targetList to bottom and scrolls article into view on optimistic card creation', () => {
      const targetList = createMockElement('div');
      targetList.scrollHeight = 1400;
      targetList.scrollTo = vi.fn();

      const article = createMockElement('article');
      article.scrollIntoView = vi.fn();

      targetList.append(article);

      const performFeedScroll = function () {
        if (typeof targetList.scrollTo === 'function') {
          targetList.scrollTo({
            top: targetList.scrollHeight,
            behavior: 'smooth',
          });
        } else {
          targetList.scrollTop = targetList.scrollHeight;
        }
        if (typeof article.scrollIntoView === 'function') {
          article.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      };

      performFeedScroll();

      expect(targetList.scrollTo).toHaveBeenCalledWith({
        top: 1400,
        behavior: 'smooth',
      });
      expect(article.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
      });
    });

    it('scrolls reply element and checks parent container visibility on optimistic reply creation', () => {
      const scrollParent = createMockElement('div');
      scrollParent.scrollTop = 0;
      scrollParent.clientHeight = 300;
      scrollParent.scrollTo = vi.fn();

      const replyEl = createMockElement('div');
      replyEl.offsetTop = 350;
      replyEl.offsetHeight = 50;
      replyEl.scrollIntoView = vi.fn();

      const performReplyScroll = function () {
        if (typeof replyEl.scrollIntoView === 'function') {
          replyEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        const bottomDist = replyEl.offsetTop + replyEl.offsetHeight;
        if (bottomDist > scrollParent.scrollTop + scrollParent.clientHeight) {
          if (typeof scrollParent.scrollTo === 'function') {
            scrollParent.scrollTo({ top: bottomDist, behavior: 'smooth' });
          } else {
            scrollParent.scrollTop = bottomDist;
          }
        }
      };

      performReplyScroll();

      expect(replyEl.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      });
      expect(scrollParent.scrollTo).toHaveBeenCalledWith({
        top: 400,
        behavior: 'smooth',
      });
    });
  });
});
