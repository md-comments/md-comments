import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { load } from 'js-yaml';

describe('Living Architecture Documentation Invariants', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('verifies all monorepo packages in pnpm-workspace.yaml are modeled in LikeC4', () => {
    const workspaceYamlPath = path.join(rootDir, 'pnpm-workspace.yaml');
    const workspaceDoc = load(fs.readFileSync(workspaceYamlPath, 'utf8')) as {
      packages?: string[];
    };
    const packages = workspaceDoc.packages || [];

    const modelC4Path = path.join(rootDir, 'docs/architecture/c4/model.c4');
    expect(fs.existsSync(modelC4Path)).toBe(true);

    const modelContent = fs.readFileSync(modelC4Path, 'utf8');

    const expectedMappings: Record<string, string> = {
      shared: 'sharedEngine',
      'vscode-extension': 'vscodeExt',
      'obsidian-plugin': 'obsidianPlugin',
      'chrome-extension': 'chromeExt',
      'starlight-plugin': 'starlightPlugin',
    };

    for (const [pkgDir, containerName] of Object.entries(expectedMappings)) {
      if (packages.includes(pkgDir)) {
        expect(modelContent).toContain(containerName);
      }
    }
  });

  it('validates LikeC4 model and views syntax', () => {
    const validateCmd = 'npx likec4 validate --no-layout docs/architecture/c4';
    expect(() => {
      execSync(validateCmd, {
        cwd: rootDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    }).not.toThrow();
  });

  it('validates D2 diagrams and verifies layout-engine is set to elk', () => {
    const d2Files = [
      'docs/architecture/dfd/dfd-level-0-context.d2',
      'docs/architecture/dfd/dfd-level-1-subsystems.d2',
      'docs/architecture/dfd/dfd-level-2-storage.d2',
      'docs/architecture/components-integration.d2',
    ];

    for (const relPath of d2Files) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content).toContain('layout-engine: elk');

      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    }
  });

  it('verifies all 14 quality invariants exist in catalog and are documented in invariants-and-adrs.md', () => {
    const requiredInvariants = [
      'INV-OAUTH-ONLY',
      'INV-FAST-FORWARD-RETRY',
      'INV-ZERO-CLIENT-SECRETS',
      'INV-ZERO-CUSTOMER-DATA',
      'INV-TELEMETRY-KILLSWITCH',
      'INV-VISUAL-PARITY',
      'INV-XSS-SANITIZED',
      'INV-QUOTA-DEFENSE',
      'INV-IN-PLACE-PREVIEW',
      'INV-MUTATION-GUARD',
      'INV-BASE-TREE-SHA',
      'INV-AUTH-PERSISTENCE',
      'INV-MODAL-CONFIRMATION',
      'INV-SILENT-BG-REFRESH',
    ];

    const invariantsDocPath = path.join(rootDir, 'docs/architecture/invariants-and-adrs.md');
    expect(fs.existsSync(invariantsDocPath)).toBe(true);
    const invariantsDoc = fs.readFileSync(invariantsDocPath, 'utf8');

    for (const inv of requiredInvariants) {
      const invFile = path.join(rootDir, 'quality/invariants', `${inv}.md`);
      expect(fs.existsSync(invFile)).toBe(true);
      expect(invariantsDoc).toContain(inv);
    }
  });

  it('verifies architecture maintenance skill and workflow exist and are registered', () => {
    const skillPath = path.join(rootDir, '.agents/skills/architecture-docs/SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const skillContent = fs.readFileSync(skillPath, 'utf8');
    expect(skillContent).toContain('name: architecture-docs');

    const workflowPath = path.join(rootDir, '.agents/workflows/architecture-sync.md');
    expect(fs.existsSync(workflowPath)).toBe(true);
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    expect(workflowContent).toContain('name: architecture-sync');
  });

  it('verifies preview runtime and auth components are covered in LikeC4 model', () => {
    const modelC4Path = path.join(rootDir, 'docs/architecture/c4/model.c4');
    const modelContent = fs.readFileSync(modelC4Path, 'utf8');

    const requiredComponents = [
      'earlyHook',
      'inplaceDomUpdater',
      'confirmationModal',
      'authorResolver',
      'authManager',
      'optimisticStore',
    ];

    for (const comp of requiredComponents) {
      expect(modelContent).toContain(comp);
    }
  });

  it('verifies zero machine-specific absolute paths exist in architecture and invariant docs', () => {
    const scanDirs = [
      path.join(rootDir, 'docs/architecture'),
      path.join(rootDir, 'quality/invariants'),
    ];

    const violations: { file: string; line: number; text: string }[] = [];

    for (const dir of scanDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const lines = fs.readFileSync(filePath, 'utf8').split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('file:///Users/') || line.includes('/Users/maratstrelets/')) {
            violations.push({
              file: path.relative(rootDir, filePath),
              line: idx + 1,
              text: line.trim(),
            });
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies generated architecture assets exist for website rendering', () => {
    const expectedD2Svgs = [
      'website/assets/architecture/d2/dfd-level-0-context.svg',
      'website/assets/architecture/d2/dfd-level-1-subsystems.svg',
      'website/assets/architecture/d2/dfd-level-2-storage.svg',
      'website/assets/architecture/d2/components-integration.svg',
    ];

    const expectedC4Svgs = [
      'website/assets/architecture/c4/systemContext.svg',
      'website/assets/architecture/c4/containers.svg',
      'website/assets/architecture/c4/vscodeInternals.svg',
      'website/assets/architecture/c4/previewInternals.svg',
      'website/assets/architecture/c4/sharedInternals.svg',
      'website/assets/architecture/c4/browserInternals.svg',
      'website/assets/architecture/c4/obsidianInternals.svg',
      'website/assets/architecture/c4/starlightInternals.svg',
    ];

    const expectedInteractive = 'website/assets/architecture/interactive/index.html';

    for (const relPath of [...expectedD2Svgs, ...expectedC4Svgs, expectedInteractive]) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath), `Expected asset ${relPath} to exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it('verifies website architecture section is on a separate sub-site route and footer navigation links to it', () => {
    const indexPath = path.join(rootDir, 'website/index.html');
    const archHtmlPath = path.join(rootDir, 'website/architecture.html');
    const archSubsiteIndexPath = path.join(rootDir, 'website/architecture/index.html');

    // Standalone architecture.html removed
    expect(fs.existsSync(archHtmlPath)).toBe(false);

    // Dedicated architecture sub-site exists
    expect(fs.existsSync(archSubsiteIndexPath)).toBe(true);
    const archSubsiteContent = fs.readFileSync(archSubsiteIndexPath, 'utf8');
    expect(archSubsiteContent).toContain('Markdown Comments Architecture');

    // Main website does NOT contain architecture section
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    expect(indexContent).not.toContain('id="architecture"');
    expect(indexContent).not.toContain('class="architecture-section"');

    // Footer contains link to architecture/ but NOT direct Interactive LikeC4 link
    expect(indexContent).toContain('href="architecture/"');
    expect(indexContent).not.toContain('Interactive LikeC4 &nearr;');

    // Header navbar does NOT contain architecture link
    const navMatch = indexContent.match(/<nav class="nav">([\s\S]*?)<\/nav>/);
    expect(navMatch).not.toBeNull();
    if (navMatch) {
      expect(navMatch[1]).not.toContain('architecture');
    }

    // Architecture sub-site contains link to Interactive LikeC4
    expect(archSubsiteContent).toContain('Interactive LikeC4');
    expect(archSubsiteContent).toContain('/assets/architecture/interactive/index.html');

    // Architecture site is separate from demo-astro
    const archSitePkg = path.join(rootDir, 'architecture-site/package.json');
    expect(fs.existsSync(archSitePkg)).toBe(true);

    const demoAstroGuides = path.join(rootDir, 'demo-astro/src/content/docs/guides');
    expect(fs.existsSync(path.join(demoAstroGuides, 'architecture.md'))).toBe(true);
    expect(fs.existsSync(path.join(demoAstroGuides, 'how-it-works.md'))).toBe(true);
    expect(fs.existsSync(path.join(demoAstroGuides, 'sandbox.md'))).toBe(true);
  });
});
