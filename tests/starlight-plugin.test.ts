import { describe, it, expect, vi, beforeEach } from 'vitest';
import { starlightMdComments } from '../starlight-plugin/src/starlight';
import { astroMdComments } from '../starlight-plugin/src/astro';
import { scanArticleAnchors } from '../starlight-plugin/src/client/domAnchors';
import { resolveElementForAnchor } from '../starlight-plugin/src/client/placement';
import { requestDeviceCode, getViewer } from '../starlight-plugin/src/client/githubAuth';

// Lightweight DOM mock for testing without jsdom dependency
function createMockElement(
  tag: string,
  text: string = '',
  attributes: Record<string, string> = {}
) {
  const attrs = new Map<string, string>(Object.entries(attributes));
  const children: any[] = [];

  const mockEl: any = {
    tagName: tag.toUpperCase(),
    innerText: text,
    textContent: text,
    getAttribute: (name: string) => attrs.get(name) || null,
    setAttribute: (name: string, val: string) => attrs.set(name, val),
    removeAttribute: (name: string) => attrs.delete(name),
    closest: (selector: string) => {
      if (
        selector.includes('md-comments-overlay') &&
        attrs.get('class')?.includes('md-comments-overlay')
      ) {
        return mockEl;
      }
      return null;
    },
    querySelectorAll: (selector: string) => {
      const matched: any[] = [];
      const tags = selector.split(',').map((s) => s.trim().toUpperCase());
      function traverse(node: any) {
        for (const child of node.children || []) {
          if (tags.includes(child.tagName)) {
            matched.push(child);
          }
          traverse(child);
        }
      }
      traverse(mockEl);
      return matched;
    },
    appendChild: (child: any) => {
      children.push(child);
      return child;
    },
    children,
  };
  return mockEl;
}

describe('starlightMdComments plugin', () => {
  it('registers Starlight config:setup hook with head injection, styles, and client runtime', () => {
    const plugin = starlightMdComments({ repo: 'owner/repo', branch: 'main' });
    expect(plugin.name).toBe('@md-comments/starlight');

    let updatedConfig: any = null;
    let addedIntegration: any = null;

    plugin.hooks['config:setup']({
      config: {},
      updateConfig: (cfg) => {
        updatedConfig = cfg;
      },
      addIntegration: (integration) => {
        addedIntegration = integration;
      },
    });

    expect(updatedConfig).toBeDefined();
    expect(updatedConfig.head).toHaveLength(1);
    expect(updatedConfig.head[0].tag).toBe('script');
    expect(updatedConfig.head[0].content).toContain('"repo":"owner/repo"');
    expect(updatedConfig.customCss).toContain('@md-comments/starlight/styles.css');

    expect(addedIntegration).toBeDefined();
    expect(addedIntegration.name).toBe('@md-comments/starlight-client-runtime');

    let injectedType = '';
    let injectedScript = '';
    addedIntegration.hooks['astro:config:setup']({
      injectScript: (type: string, script: string) => {
        injectedType = type;
        injectedScript = script;
      },
    });

    expect(injectedType).toBe('page');
    expect(injectedScript).toContain('@md-comments/starlight/client/bootstrap');
  });
});

describe('astroMdComments integration', () => {
  it('registers astro:config:setup hook with injected script', () => {
    const integration = astroMdComments({ repo: 'org/docs' });
    expect(integration.name).toBe('@md-comments/astro');

    let injectedType = '';
    const injectedScripts: string[] = [];
    integration.hooks?.['astro:config:setup']?.({
      injectScript: (type: string, script: string) => {
        injectedType = type;
        injectedScripts.push(script);
      },
    });

    expect(injectedType).toBe('page');
    expect(injectedScripts.some((s) => s.includes('"repo":"org/docs"'))).toBe(true);
  });
});

describe('DOM Anchors & Placement', () => {
  it('scans DOM container and assigns deterministic anchor IDs', () => {
    const container = createMockElement('div');
    const h1 = createMockElement('h1', 'Getting Started');
    const p1 = createMockElement('p', 'This is the first guide paragraph.');
    const p2 = createMockElement('p', 'This is the second paragraph.');
    container.appendChild(h1);
    container.appendChild(p1);
    container.appendChild(p2);

    const scanned = scanArticleAnchors(container as unknown as HTMLElement);
    expect(scanned).toHaveLength(3);
    expect(scanned[0].tag).toBe('h1');
    expect(scanned[0].textPrefix).toBe('Getting Started');
    expect(scanned[1].tag).toBe('p');
    expect(scanned[1].textPrefix).toBe('This is the first guide paragraph.');
    expect(scanned[2].lineIndex).toBe(2);

    // Verify DOM attribute assignment
    expect(h1.getAttribute('data-md-anchor-id')).toBe(scanned[0].anchorId);
  });

  it('resolves element for exact and fuzzy anchors', () => {
    const container = createMockElement('div');
    const p1 = createMockElement('p', 'Original unmodified text here.');
    const p2 = createMockElement('p', 'Target section content.');
    container.appendChild(p1);
    container.appendChild(p2);

    const scanned = scanArticleAnchors(container as unknown as HTMLElement);

    // Exact match
    const exact = resolveElementForAnchor(
      scanned,
      scanned[1].anchorId,
      'Target section content.',
      1
    );
    expect(exact?.anchorId).toBe(scanned[1].anchorId);

    // Fuzzy match when anchorId differs but text prefix matches closely
    const fuzzy = resolveElementForAnchor(
      scanned,
      'diff-anchor-id',
      'Target section content with minor edits.',
      1
    );
    expect(fuzzy?.anchorId).toBe(scanned[1].anchorId);
  });
});

describe('GitHub Device Flow Authentication', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests device code from GitHub endpoint', async () => {
    const mockResponse = {
      device_code: 'dev_12345',
      user_code: 'ABCD-1234',
      verification_uri: 'https://github.com/login/device',
      expires_in: 900,
      interval: 5,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const { data } = await requestDeviceCode('test_client_id');
    expect(data.user_code).toBe('ABCD-1234');
    expect(data.verification_uri).toBe('https://github.com/login/device');
  });

  it('fetches authenticated viewer info', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      }),
    } as any);

    const viewer = await getViewer('gho_test_token');
    expect(viewer?.login).toBe('octocat');
    expect(viewer?.name).toBe('The Octocat');
    expect(viewer?.avatar_url).toContain('octocat_happy.gif');
  });
});

describe('CommentsOverlay FAB and Drawer', () => {
  it('creates FAB button and drawer elements in DOM', async () => {
    const elements: any[] = [];
    const classListMap = new Map<any, Set<string>>();

    function makeElement(tag: string) {
      const el: any = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        title: '',
        style: {},
        innerHTML: '',
        textContent: '',
        classList: {
          add: (cls: string) => {
            const set = classListMap.get(el) || new Set();
            set.add(cls);
            classListMap.set(el, set);
            el.className = Array.from(set).join(' ');
          },
          remove: (cls: string) => {
            const set = classListMap.get(el) || new Set();
            set.delete(cls);
            classListMap.set(el, set);
            el.className = Array.from(set).join(' ');
          },
          contains: (cls: string) => {
            const set = classListMap.get(el) || new Set();
            return set.has(cls);
          },
          toggle: (cls: string, force?: boolean) => {
            const set = classListMap.get(el) || new Set();
            const shouldAdd = force !== undefined ? force : !set.has(cls);
            if (shouldAdd) set.add(cls);
            else set.delete(cls);
            classListMap.set(el, set);
            el.className = Array.from(set).join(' ');
            return shouldAdd;
          },
        },
        setAttribute: (k: string, v: string) => {
          if (k === 'id') el.id = v;
          if (k === 'class') el.className = v;
        },
        getAttribute: (k: string) => (k === 'id' ? el.id : null),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        querySelector: (sel: string) => {
          if (sel === '.badge-count') return makeElement('span');
          if (sel === '.md-comments-drawer-close') return makeElement('button');
          if (sel === '.md-comments-drawer-content') return makeElement('div');
          if (sel === '.md-comments-auth-user') return makeElement('div');
          return null;
        },
        querySelectorAll: () => [],
        contains: () => true,
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 20 }),
      };
      return el;
    }

    const docEl = makeElement('html');
    const bodyEl = makeElement('body');
    bodyEl.appendChild = (child: any) => {
      elements.push(child);
      return child;
    };

    (global as any).document = {
      documentElement: docEl,
      body: bodyEl,
      createElement: (tag: string) => makeElement(tag),
      getElementById: (id: string) => elements.find((e) => e.id === id) || null,
      querySelector: (sel: string) => {
        if (sel.startsWith('.')) {
          const cls = sel.slice(1);
          return (
            elements.find((e) => e.classList?.contains(cls) || e.className?.includes(cls)) || null
          );
        }
        return null;
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    (global as any).window = {
      location: { pathname: '/guide' },
      addEventListener: vi.fn(),
      getSelection: () => null,
      scrollY: 0,
      scrollX: 0,
    };

    const { CommentsOverlay } =
      await import('../starlight-plugin/src/client/components/CommentsOverlay');
    const container = makeElement('main');
    const overlay = new CommentsOverlay(container as unknown as HTMLElement, {
      repo: 'test/repo',
    });

    await overlay.init();

    const fab = document.getElementById('md-comments-fab-toggle');
    expect(fab).toBeDefined();
    expect(fab?.className).toContain('md-comments-fab-toggle');

    const drawer = document.querySelector('.md-comments-drawer');
    expect(drawer).toBeDefined();

    overlay.toggleDrawer();
    expect(drawer?.classList.contains('md-comments-drawer-open')).toBe(true);

    overlay.toggleDrawer();
    expect(drawer?.classList.contains('md-comments-drawer-open')).toBe(false);
  });
});
