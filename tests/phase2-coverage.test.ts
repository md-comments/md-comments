import { describe, it, expect } from 'vitest';
import { createCoverageHelper } from './e2e/fixtures/coverageHelper.js';
import mcrConfig from '../mcr.config.js';
import MCR from 'monocart-coverage-reports';

describe('Phase 2: Free 100% Code Coverage Tooling Setup', () => {
  it('instantiates CoverageHelper with custom output directory', () => {
    const helper = createCoverageHelper('./coverage/test-cdp');
    expect(helper).toBeDefined();
    expect(typeof helper.startPageCoverage).toBe('function');
    expect(typeof helper.startServiceWorkerCoverage).toBe('function');
    expect(typeof helper.stopAndCollect).toBe('function');
  });

  it('validates mcr.config.ts coverage gates and report settings', () => {
    expect(mcrConfig.name).toContain('Markdown Comments');
    expect(mcrConfig.outputDir).toBe('./coverage/consolidated');
    expect(mcrConfig.reports).toContain('v8');
    expect(mcrConfig.reports).toContain('console-summary');
    expect(mcrConfig.thresholds).toBeDefined();
    expect(typeof mcrConfig.entryFilter).toBe('function');

    // Test entry filter
    const filter = mcrConfig.entryFilter as (entry: any) => boolean;
    expect(filter({ url: 'file:///project/shared/anchor.ts' })).toBe(true);
    expect(filter({ url: 'file:///project/chrome-extension/src/content.ts' })).toBe(true);
    expect(filter({ url: 'file:///project/node_modules/vitest/index.js' })).toBe(false);
  });

  it('initializes Monocart Coverage Reports instance without errors', async () => {
    const testOutputDir = './coverage/test-mcr';
    const mcr = MCR({
      name: 'Test MCR Suite',
      outputDir: testOutputDir,
      reports: ['console-summary'],
    });
    expect(mcr).toBeDefined();
    expect(typeof mcr.add).toBe('function');
    expect(typeof mcr.generate).toBe('function');
  });
});
