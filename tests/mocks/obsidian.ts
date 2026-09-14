import { vi } from 'vitest';

export class ItemView {
  contentEl = {
    empty: vi.fn(),
    createDiv: vi.fn().mockReturnValue({
      createDiv: vi.fn().mockReturnValue({}),
      createEl: vi.fn().mockReturnValue({
        dataset: {},
        insertAdjacentHTML: vi.fn(),
      }),
    }),
  };
  app = {
    workspace: { on: vi.fn(), getActiveFile: vi.fn() },
    vault: { on: vi.fn() },
  };
  registerEvent = vi.fn();
  addAction = vi.fn();
  constructor(public leaf: any) {}
}

export class WorkspaceLeaf {}
export class TFile {}
export class Plugin {}
