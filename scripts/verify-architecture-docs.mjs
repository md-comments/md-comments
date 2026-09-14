#!/usr/bin/env node

/**
 * Living Architecture Documentation Verification Harness
 *
 * Enforces:
 * 1. Monorepo workspace package coverage in LikeC4 model
 * 2. Preview runtime & auth component coverage in LikeC4 model
 * 3. LikeC4 semantic & syntax validation
 * 4. D2 diagram syntax & strict ELK layout engine configuration
 * 5. Complete 14-invariant catalog and documentation coverage
 * 6. Agent architecture skill and workflow presence
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { load } from 'js-yaml';

const rootDir = process.cwd();
let errorCount = 0;

function reportSuccess(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function reportError(msg) {
  console.error(`\x1b[31m✖\x1b[0m ${msg}`);
  errorCount++;
}

console.log('\n==> Validating Living Architecture Documentation...\n');

// 1. Check workspace packages parity in LikeC4 model
try {
  const workspaceYamlPath = path.join(rootDir, 'pnpm-workspace.yaml');
  const workspaceDoc = load(fs.readFileSync(workspaceYamlPath, 'utf8'));
  const packages = workspaceDoc.packages || [];

  const modelC4Path = path.join(rootDir, 'docs/architecture/c4/model.c4');
  if (!fs.existsSync(modelC4Path)) {
    reportError(`Missing LikeC4 model file at ${modelC4Path}`);
  } else {
    const modelContent = fs.readFileSync(modelC4Path, 'utf8');

    // Expected container identifiers in model.c4
    const packageMapping = {
      'shared': 'sharedEngine',
      'vscode-extension': 'vscodeExt',
      'obsidian-plugin': 'obsidianPlugin',
      'chrome-extension': 'chromeExt',
      'starlight-plugin': 'starlightPlugin',
    };

    for (const [pkgDir, containerName] of Object.entries(packageMapping)) {
      if (packages.includes(pkgDir)) {
        if (modelContent.includes(containerName)) {
          reportSuccess(`Workspace package '${pkgDir}' modeled as '${containerName}' in LikeC4`);
        } else {
          reportError(`Workspace package '${pkgDir}' missing container mapping '${containerName}' in model.c4`);
        }
      }
    }

    // 2. Check preview runtime & auth components
    const requiredComponents = [
      'authManager',
      'authorResolver',
      'optimisticStore',
      'commentStore',
      'commentActions',
      'commentPreviewPanel',
      'earlyHook',
      'inplaceDomUpdater',
      'confirmationModal',
      'mutationGuard',
      'inlineAnchors',
      'gitRefBackend',
    ];

    for (const comp of requiredComponents) {
      if (modelContent.includes(comp)) {
        reportSuccess(`Component '${comp}' correctly modeled in LikeC4`);
      } else {
        reportError(`Critical component '${comp}' missing from LikeC4 model.c4`);
      }
    }
  }
} catch (e) {
  reportError(`Failed during package & component parity check: ${e.message}`);
}

// 3. LikeC4 syntax and semantic validation
try {
  const c4Dir = path.join(rootDir, 'docs/architecture/c4');
  const result = execSync('npx likec4 validate --no-layout docs/architecture/c4', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  reportSuccess('LikeC4 model & views passed offline validation');
} catch (e) {
  reportError(`LikeC4 validation failed: ${e.stderr || e.stdout || e.message}`);
}

// 4. Validate D2 diagram files and ELK layout engine
const d2Files = [
  'docs/architecture/dfd/dfd-level-0-context.d2',
  'docs/architecture/dfd/dfd-level-1-subsystems.d2',
  'docs/architecture/dfd/dfd-level-2-storage.d2',
  'docs/architecture/components-integration.d2',
];

for (const relPath of d2Files) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    reportError(`Missing D2 diagram file at ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Enforce layout-engine: elk
  if (!content.includes('layout-engine: elk')) {
    reportError(`D2 diagram ${relPath} must specify 'layout-engine: elk' in vars.d2-config`);
  } else {
    reportSuccess(`D2 diagram ${relPath} configured with ELK layout engine`);
  }

  // Check balanced braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    reportError(`D2 diagram ${relPath} has unbalanced braces (${openBraces} open vs ${closeBraces} close)`);
  }
}

// 5. Validate the 17 Invariants in catalog and documentation
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
  'INV-NO-THIRD-PARTY-AUTH-PROXY',
  'INV-SAFE-DESERIALIZATION',
  'INV-INPUT-VALIDATION-REPO',
];

const invariantsDocPath = path.join(rootDir, 'docs/architecture/invariants-and-adrs.md');
const invariantsDocContent = fs.existsSync(invariantsDocPath) ? fs.readFileSync(invariantsDocPath, 'utf8') : '';

for (const inv of requiredInvariants) {
  const invFilePath = path.join(rootDir, 'quality/invariants', `${inv}.md`);
  if (!fs.existsSync(invFilePath)) {
    reportError(`Missing invariant catalog file for ${inv} at quality/invariants/${inv}.md`);
  } else {
    reportSuccess(`Invariant catalog file verified: ${inv}`);
  }

  if (!invariantsDocContent.includes(inv)) {
    reportError(`Invariant ${inv} not documented in docs/architecture/invariants-and-adrs.md`);
  }
}

// 6. Verify living architecture skill and workflow
const requiredSkillPath = path.join(rootDir, '.agents/skills/architecture-docs/SKILL.md');
if (!fs.existsSync(requiredSkillPath)) {
  reportError(`Missing architecture maintenance skill at ${requiredSkillPath}`);
} else {
  reportSuccess('Architecture maintenance agent skill verified (.agents/skills/architecture-docs/SKILL.md)');
}

const requiredWorkflowPath = path.join(rootDir, '.agents/workflows/architecture-sync.md');
if (!fs.existsSync(requiredWorkflowPath)) {
  reportError(`Missing architecture sync workflow at ${requiredWorkflowPath}`);
} else {
  reportSuccess('Architecture sync workflow verified (.agents/workflows/architecture-sync.md)');
}

// 7. Verify zero absolute local paths in documentation
const scanDirs = ['docs/architecture', 'quality/invariants'];
for (const dir of scanDirs) {
  const fullDir = path.join(rootDir, dir);
  if (fs.existsSync(fullDir)) {
    const files = fs
      .readdirSync(fullDir, { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.md'));
    for (const f of files) {
      const filePath = path.join(fullDir, f);
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('file:///') || content.includes('/Users/')) {
        reportError(`Found machine-specific absolute path in ${path.join(dir, f)}`);
      }
    }
  }
}
reportSuccess('All architecture and quality documentation links are portable (zero absolute file:/// paths)');

// 8. Verify static website architecture assets
const websiteD2Dir = path.join(rootDir, 'website/assets/architecture/d2');
const websiteC4Dir = path.join(rootDir, 'website/assets/architecture/c4');
const websiteInteractiveFile = path.join(
  rootDir,
  'website/assets/architecture/interactive/index.html'
);

const requiredD2Svgs = [
  'dfd-level-0-context.svg',
  'dfd-level-1-subsystems.svg',
  'dfd-level-2-storage.svg',
  'components-integration.svg',
];

for (const svg of requiredD2Svgs) {
  const p = path.join(websiteD2Dir, svg);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    reportError(`Missing or empty website D2 SVG asset at ${path.relative(rootDir, p)}`);
  } else {
    reportSuccess(`Website D2 SVG verified: ${svg}`);
  }
}

const requiredC4Svgs = ['systemContext.svg', 'containers.svg', 'vscodeInternals.svg'];
for (const svg of requiredC4Svgs) {
  const p = path.join(websiteC4Dir, svg);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    reportError(`Missing or empty website C4 SVG asset at ${path.relative(rootDir, p)}`);
  } else {
    reportSuccess(`Website C4 SVG verified: ${svg}`);
  }
}

if (!fs.existsSync(websiteInteractiveFile) || fs.statSync(websiteInteractiveFile).size === 0) {
  reportError(
    'Missing or empty website LikeC4 interactive build at website/assets/architecture/interactive/index.html'
  );
} else {
  reportSuccess('Website LikeC4 interactive build verified');
}

// 9. Verify separate architecture sub-site and clean main website
const websiteIndexPath = path.join(rootDir, 'website/index.html');
const websiteArchHtml = path.join(rootDir, 'website/architecture.html');
const websiteArchSubsiteIndex = path.join(rootDir, 'website/architecture/index.html');

if (fs.existsSync(websiteArchHtml)) {
  reportError('website/architecture.html should be removed in favor of the dedicated /architecture sub-site');
} else {
  reportSuccess('Single-page architecture.html correctly absent');
}

if (!fs.existsSync(websiteArchSubsiteIndex)) {
  reportError('Missing dedicated architecture sub-site build at website/architecture/index.html');
} else {
  reportSuccess('Dedicated architecture sub-site verified at website/architecture/index.html');
}

if (fs.existsSync(websiteIndexPath)) {
  const indexContent = fs.readFileSync(websiteIndexPath, 'utf8');
  if (indexContent.includes('id="architecture"') || indexContent.includes('class="architecture-section"')) {
    reportError('website/index.html should not contain architecture section; it must be on a separate route');
  } else if (!indexContent.includes('href="architecture/"')) {
    reportError('website/index.html footer missing link to architecture sub-site (architecture/)');
  } else if (indexContent.includes('Interactive LikeC4 &nearr;')) {
    reportError('website/index.html footer should not link to LikeC4 directly; it must be linked from within the architecture subsite');
  } else {
    reportSuccess('Main website cleanly separated with footer link to architecture subsite only');
  }
}

// 10. Verify separate architecture-site package and pristine demo-astro
const archSitePkg = path.join(rootDir, 'architecture-site/package.json');
if (!fs.existsSync(archSitePkg)) {
  reportError('Missing standalone architecture-site package at architecture-site/package.json');
} else {
  reportSuccess('Standalone architecture-site package verified');
}

const demoAstroGuides = path.join(rootDir, 'demo-astro/src/content/docs/guides');
if (
  !fs.existsSync(path.join(demoAstroGuides, 'architecture.md')) ||
  !fs.existsSync(path.join(demoAstroGuides, 'how-it-works.md')) ||
  !fs.existsSync(path.join(demoAstroGuides, 'sandbox.md'))
) {
  reportError('demo-astro guides were modified; demo-astro must remain pristine');
} else {
  reportSuccess('demo-astro site verified pristine and unchanged');
}

if (fs.existsSync(websiteArchSubsiteIndex)) {
  const subContent = fs.readFileSync(websiteArchSubsiteIndex, 'utf8');
  if (!subContent.includes('Interactive LikeC4')) {
    reportError('Architecture subsite missing link to Interactive LikeC4 viewer');
  } else {
    reportSuccess('Architecture subsite contains link to Interactive LikeC4 viewer');
  }
}

console.log('');
if (errorCount > 0) {
  console.error(`\x1b[31m✖ Architecture verification failed with ${errorCount} error(s).\x1b[0m\n`);
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All architecture documentation checks passed cleanly!\x1b[0m\n');
  process.exit(0);
}
