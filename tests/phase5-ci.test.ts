import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

describe('Phase 5: CI/CD Pipeline & 100% Coverage Gate Integration', () => {
  it('validates that .github/workflows/nightly-regression.yml exists and parses as valid YAML', () => {
    const workflowPath = path.resolve('.github/workflows/nightly-regression.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);

    const content = fs.readFileSync(workflowPath, 'utf8');
    const parsed: any = yaml.load(content);
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe('Comprehensive Regression & Knowledge Graph Suite');
  });

  it('verifies CI triggers (nightly cron and manual workflow_dispatch)', () => {
    const workflowPath = path.resolve('.github/workflows/nightly-regression.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');
    const parsed: any = yaml.load(content);

    expect(parsed.on).toBeDefined();
    expect(parsed.on.schedule).toBeDefined();
    expect(parsed.on.workflow_dispatch).toBeDefined();
  });

  it('verifies all 4 required CI pipeline jobs exist with correct dependency sequencing', () => {
    const workflowPath = path.resolve('.github/workflows/nightly-regression.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');
    const parsed: any = yaml.load(content);

    const jobs = parsed.jobs;
    expect(jobs['knowledge-graph-and-unit']).toBeDefined();
    expect(jobs['headless-playwright-e2e']).toBeDefined();
    expect(jobs['coverage-and-reporting-gate']).toBeDefined();
    expect(jobs['ai-diagnostic-and-alert']).toBeDefined();

    expect(jobs['headless-playwright-e2e'].needs).toBe('knowledge-graph-and-unit');
    expect(jobs['coverage-and-reporting-gate'].needs).toContain('headless-playwright-e2e');
    expect(jobs['ai-diagnostic-and-alert'].if).toBe('failure()');
  });

  it('ensures CI execution steps map to valid package.json scripts and repo tools', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
    expect(pkg.scripts['quality:build']).toBeDefined();
    expect(pkg.scripts['test:coverage']).toBeDefined();
    expect(pkg.scripts['test:e2e']).toBeDefined();
    expect(pkg.scripts['test:report']).toBeDefined();
    expect(pkg.scripts['coverage:consolidate']).toBeDefined();
    expect(fs.existsSync(path.resolve('scripts/test-repo-cleanup.ts'))).toBe(true);
  });
});
