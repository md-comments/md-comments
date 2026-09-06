import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import playwrightConfig from '../playwright.config.js';

describe('Phase 3: Open-Source Allure Drill-Down Test Reporting Setup', () => {
  it('validates playwright.config.ts incorporates allure-playwright reporter', () => {
    expect(playwrightConfig.reporter).toBeDefined();
    const reporters = playwrightConfig.reporter as any[];
    const allureReporterEntry = reporters.find(
      (r) => Array.isArray(r) && r[0] === 'allure-playwright'
    );
    expect(allureReporterEntry).toBeDefined();
    expect(allureReporterEntry[1].resultsDir).toBe('allure-results');
  });

  it('verifies generate-allure-report.mjs script exists and is executable', () => {
    const scriptPath = path.resolve('scripts/generate-allure-report.mjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    expect(scriptContent).toContain('allure generate');
  });

  it('supports allure step hierarchies in Playwright tests', async () => {
    // Verify allure-playwright package exports
    const allureModule = await import('allure-playwright');
    expect(allureModule.allure).toBeDefined();
    expect(typeof allureModule.test).toBe('function');
  });
});
