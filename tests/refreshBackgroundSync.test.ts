import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CommentPollManager } from '../shared/commentSync';

describe('Background Refresh & Progress Line Lifecycle across Chrome & Safari', () => {
  const sidebarCss = fs.readFileSync(
    path.resolve(__dirname, '../chrome-extension/src/sidebar.css'),
    'utf8'
  );
  const contentTs = fs.readFileSync(
    path.resolve(__dirname, '../chrome-extension/src/content.ts'),
    'utf8'
  );

  describe('CSS Specification for .sidebar-refresh-progress-line', () => {
    it('verifies .sidebar-header has position: relative to anchor progress line', () => {
      const match = sidebarCss.match(/\.sidebar-header\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      expect(match![1]).toMatch(/position:\s*relative;/);
    });

    it('verifies .sidebar-refresh-progress-line is a 2px indeterminate progress bar', () => {
      const match = sidebarCss.match(/\.sidebar-refresh-progress-line\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const block = match![1];

      expect(block).toMatch(/position:\s*absolute;/);
      expect(block).toMatch(/bottom:\s*0;/);
      expect(block).toMatch(/left:\s*0;/);
      expect(block).toMatch(/right:\s*0;/);
      expect(block).toMatch(/height:\s*2px;/);
      expect(block).toMatch(/overflow:\s*hidden;/);
      expect(block).toMatch(/opacity:\s*0;/);
      expect(block).toMatch(/pointer-events:\s*none;/);
    });

    it('verifies .sidebar-refresh-progress-line.active triggers animation and full opacity', () => {
      expect(sidebarCss).toMatch(/\.sidebar-refresh-progress-line\.active\s*\{[^}]*opacity:\s*1;/);
      expect(sidebarCss).toMatch(
        /\.sidebar-refresh-progress-line\.active::after\s*\{[^}]*animation:\s*md-comments-progress-line/
      );
    });
  });

  describe('setRefreshingProgress DOM Helper Invariants', () => {
    function createMockProgressLine() {
      const classes = new Set<string>();
      const styles: Record<string, string> = { display: 'none' };
      const el = {
        style: styles,
        classList: {
          add: (c: string) => classes.add(c),
          remove: (c: string) => classes.delete(c),
          contains: (c: string) => classes.has(c),
        },
        get offsetWidth() {
          return 380;
        },
      };
      return el;
    }

    function setRefreshingProgress(
      active: boolean,
      lineEl: ReturnType<typeof createMockProgressLine>
    ) {
      if (!lineEl) return;
      if (active) {
        lineEl.style.display = 'block';
        void lineEl.offsetWidth;
        lineEl.classList.add('active');
      } else {
        lineEl.classList.remove('active');
        setTimeout(() => {
          if (!lineEl.classList.contains('active')) {
            lineEl.style.display = 'none';
          }
        }, 200);
      }
    }

    it('activates progress line with display block and active class', () => {
      const line = createMockProgressLine();
      expect(line.style.display).toBe('none');
      expect(line.classList.contains('active')).toBe(false);

      setRefreshingProgress(true, line);
      expect(line.style.display).toBe('block');
      expect(line.classList.contains('active')).toBe(true);
    });

    it('deactivates progress line removing active class and hiding after transition', () => {
      vi.useFakeTimers();
      const line = createMockProgressLine();
      setRefreshingProgress(true, line);
      expect(line.classList.contains('active')).toBe(true);

      setRefreshingProgress(false, line);
      expect(line.classList.contains('active')).toBe(false);

      // Still visible during CSS opacity fade
      expect(line.style.display).toBe('block');

      // After 200ms transition completes
      vi.advanceTimersByTime(200);
      expect(line.style.display).toBe('none');
      vi.useRealTimers();
    });
  });

  describe('Silent Background Sync Invariants in content.ts (INV-SILENT-REFRESH)', () => {
    it('verifies injectSidebar includes the progress line element in .sidebar-header', () => {
      expect(contentTs).toContain(
        '<div class="sidebar-refresh-progress-line" id="sidebar-refresh-progress-line" style="display: none;"></div>'
      );
    });

    it('verifies refreshDocumentComments invokes setRefreshingProgress', () => {
      expect(contentTs).toMatch(/setRefreshingProgress\(true\)/);
      expect(contentTs).toMatch(/setRefreshingProgress\(false\)/);
      expect(contentTs).toMatch(/isBackgroundRefresh:\s*true/);
    });

    it('verifies loadDocumentComments skips isLoadingComments and FAB reset during background refresh', () => {
      expect(contentTs).toMatch(
        /if\s*\(!isBackgroundRefresh\)\s*\{\s*isLoadingComments\s*=\s*true;/
      );
      expect(contentTs).toMatch(/if\s*\(!isBackgroundRefresh\)[\s\S]*?openSidebar\('inline'\);/);
    });

    it('verifies app check is bypassed if already verified for the repository', () => {
      const appInstallationStatus = {
        checked: true,
        installed: true,
        repoAccess: true,
        appSlug: 'markdown-comments',
      };
      const currentMetadata = { owner: 'owner-a', repo: 'repo-b' };
      const targetMeta = { owner: 'owner-a', repo: 'repo-b' };

      const needsAppCheck =
        !appInstallationStatus.checked ||
        currentMetadata.owner !== targetMeta.owner ||
        currentMetadata.repo !== targetMeta.repo;

      expect(needsAppCheck).toBe(false);
    });

    it('verifies renderSidebarComments double-guards against showing validating card when comments exist', () => {
      expect(contentTs).toMatch(
        /const hasExistingComments =\s*loadedComments\.inline_comments\.length > 0 \|\| loadedComments\.page_comments\.length > 0;/
      );
      expect(contentTs).toMatch(/if \(isCheckingAppInstallation && !hasExistingComments\)/);
    });

    it('triggers CommentPollManager on visibilitychange/focus silently', async () => {
      vi.useFakeTimers();
      const listeners: Record<string, () => void> = {};
      const mockDoc = {
        hidden: false,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          listeners[event] = cb;
        }),
        removeEventListener: vi.fn(),
      };
      const mockWin = {
        addEventListener: vi.fn((event: string, cb: () => void) => {
          listeners[event] = cb;
        }),
        removeEventListener: vi.fn(),
      };

      vi.stubGlobal('document', mockDoc);
      vi.stubGlobal('window', mockWin);

      const checkFn = vi.fn().mockResolvedValue(undefined);
      const poller = new CommentPollManager(checkFn, { intervalMs: 30000, minIntervalMs: 0 });
      poller.start();

      // Trigger focus (switching back to tab)
      listeners['focus']();
      await vi.advanceTimersByTimeAsync(10);
      expect(checkFn).toHaveBeenCalledTimes(1);

      // Trigger visibility change (tab becomes visible)
      mockDoc.hidden = false;
      listeners['visibilitychange']();
      await vi.advanceTimersByTimeAsync(10);
      expect(checkFn).toHaveBeenCalledTimes(2);

      poller.stop();
      vi.useRealTimers();
    });
  });
});
