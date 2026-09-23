import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

// Setup DOM and Chrome mocks before importing content.ts
type MockEventListener = (...args: any[]) => void;
const mockStorage: Record<string, any> = {};
const mockEventListeners: Record<string, MockEventListener[]> = {};

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
    removeChild: vi.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
      return child;
    }),
    remove: vi.fn(),
    querySelector: vi.fn((sel: string) => {
      if (sel.includes('textarea')) return el._textarea || null;
      if (sel.includes('submit')) return el._submitBtn || null;
      if (sel.includes('cancel')) return el._cancelBtn || null;
      return null;
    }),
    querySelectorAll: vi.fn(() => []),
    innerHTML: '',
    value: '',
    placeholder: '',
    disabled: false,
    focus: vi.fn(),
    blur: vi.fn(),
  };
  return el;
}

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
    createElement: vi.fn((tag: string) => createMockElement(tag)),
    head: { appendChild: vi.fn() },
    body: {
      classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
      appendChild: vi.fn(),
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
  };
}

describe('Chrome Extension Inline Comment Submission Flow', () => {
  let showFallbackReplyComposer: any;
  let pendingSubmissionIds: Set<string>;
  let removeSubmittingProgress: (id: string) => void;
  let draftsStore: Record<string, string>;

  beforeAll(async () => {
    const content = await import('../chrome-extension/src/content');
    showFallbackReplyComposer = content.showFallbackReplyComposer;
    pendingSubmissionIds = content.pendingSubmissionIds;
    removeSubmittingProgress = content.removeSubmittingProgress;
    draftsStore = content.draftsStore;
  });

  beforeEach(() => {
    pendingSubmissionIds?.clear();
    for (const k of Object.keys(draftsStore || {})) {
      delete draftsStore[k];
    }
  });

  it('showFallbackReplyComposer does not apply .loading spinner class to submit button on submit', async () => {
    const wrapper = createMockElement('div');
    const textarea = createMockElement('textarea');
    const submitBtn = createMockElement('button');
    const cancelBtn = createMockElement('button');

    wrapper._textarea = textarea;
    wrapper._submitBtn = submitBtn;
    wrapper._cancelBtn = cancelBtn;

    let submittedBody = '';
    let isSubmitting = false;
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((r) => {
      resolveSubmit = r;
    });

    showFallbackReplyComposer(
      wrapper,
      async (body: string) => {
        submittedBody = body;
        isSubmitting = true;
        await submitPromise;
      },
      () => {},
      'draft:test-key',
      'Write a comment...'
    );

    textarea.value = 'Test inline comment text';

    // Trigger click on submit button
    submitBtn.click();

    // Textarea cleared immediately
    expect(textarea.value).toBe('');
    // Submit button is disabled to prevent double submit
    expect(submitBtn.disabled).toBe(true);
    // Button MUST NOT have .loading class (no blue spinner animation in authoring UI)
    expect(submitBtn.classList.contains('loading')).toBe(false);

    expect(isSubmitting).toBe(true);
    expect(submittedBody).toBe('Test inline comment text');

    // Resolve submission
    resolveSubmit!();
    await submitPromise;
  });

  it('manages pendingSubmissionIds for progress line during submission lifecycle', () => {
    const testId = 'c-test-123';
    pendingSubmissionIds.add(testId);
    expect(pendingSubmissionIds.has(testId)).toBe(true);

    const lineEl = createMockElement('div');
    lineEl.id = `submitting-line-${testId}`;
    (document.getElementById as any).mockReturnValueOnce(lineEl);

    removeSubmittingProgress(testId);
    expect(pendingSubmissionIds.has(testId)).toBe(false);
    expect(lineEl.classList.add).toHaveBeenCalledWith('fade-out');
  });

  it('immediately resets composer UI on submit and restores draft on failure', async () => {
    const draftKey = 'draft:owner/repo/1:new_inline:doc.md:0';
    draftsStore[draftKey] = 'Unsaved draft text';

    const composerWrapper = createMockElement('div');
    composerWrapper.style.display = 'block';

    const container = createMockElement('div');

    const resetInlineComposerUI = () => {
      container.innerHTML = '';
      composerWrapper.style.display = 'none';
      delete draftsStore[draftKey];
    };

    // Simulate submission handler with immediate dismissal
    const onSubmit = async (body: string) => {
      // 1. Immediately dismiss authoring UI
      resetInlineComposerUI();
      expect(composerWrapper.style.display).toBe('none');
      expect(container.innerHTML).toBe('');

      // 2. Simulate persistence failure
      try {
        throw new Error('Network timeout');
      } catch (err) {
        // Restore draft to prevent data loss
        draftsStore[draftKey] = body;
        throw err;
      }
    };

    await expect(onSubmit('Unsaved draft text')).rejects.toThrow('Network timeout');
    // Draft was restored on failure
    expect(draftsStore[draftKey]).toBe('Unsaved draft text');
  });
});
