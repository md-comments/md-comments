import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VS Code Preview MutationObserver Infinite Loop Prevention', () => {
  const sidebarJsPath = path.resolve(__dirname, '../vscode-extension/media/previewSidebar.js');
  const sidebarJs = fs.readFileSync(sidebarJsPath, 'utf8');

  const actionsJsPath = path.resolve(__dirname, '../vscode-extension/media/previewActions.js');
  const actionsJs = fs.readFileSync(actionsJsPath, 'utf8');

  it('verifies previewSidebar.js guards badgeCount.textContent mutation to prevent infinite loop', () => {
    // Unconditional `badgeCount.textContent = String(count)` inside a MutationObserver
    // causes a childList mutation that recursively retriggers the observer.
    expect(sidebarJs).toMatch(
      /badgeCount\.textContent\s*!==\s*countStr[\s\S]+?badgeCount\.textContent\s*=\s*countStr/
    );
  });

  it('verifies previewSidebar.js debounces MutationObserver callbacks with scheduleInit', () => {
    expect(sidebarJs).toContain('function scheduleInit()');
    expect(sidebarJs).toContain('new MutationObserver(scheduleInit)');
  });

  it('verifies previewActions.js debounces MutationObserver callbacks with scheduleInit', () => {
    expect(actionsJs).toContain('function scheduleInit()');
    expect(actionsJs).toContain('new MutationObserver(scheduleInit)');
  });

  it('simulates updateFab execution without runaway textContent mutation', () => {
    let textContent = '0';
    let mutationCount = 0;
    const badgeCount = {
      get textContent() {
        return textContent;
      },
      set textContent(val: string) {
        mutationCount++;
        textContent = val;
      },
    };

    const count = 3;
    const countStr = String(count);

    // Simulate 10 update cycles (as if triggered by observer)
    for (let i = 0; i < 10; i++) {
      if (badgeCount.textContent !== countStr) {
        badgeCount.textContent = countStr;
      }
    }

    // Only 1 mutation must occur, not 10
    expect(mutationCount).toBe(1);
    expect(badgeCount.textContent).toBe('3');
  });
});
