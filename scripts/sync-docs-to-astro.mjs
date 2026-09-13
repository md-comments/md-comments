#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename */

/**
 * sync-docs-to-astro.mjs
 * Synchronizes repository documentation (docs/architecture/*.md and docs/*.md)
 * into demo-astro/src/content/docs/ with proper Starlight frontmatter and zoomable diagram references.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const docsDir = path.join(rootDir, 'docs');
const archDocsDir = path.join(docsDir, 'architecture');
const astroDocsDir = path.join(rootDir, 'architecture-site/src/content/docs');
const astroArchDir = path.join(astroDocsDir, 'architecture');
const astroGuidesDir = path.join(astroDocsDir, 'guides');
const astroPublicDir = path.join(rootDir, 'architecture-site/public/architecture');

// 1. Ensure target directories exist
fs.mkdirSync(astroArchDir, { recursive: true });
fs.mkdirSync(astroGuidesDir, { recursive: true });
fs.mkdirSync(path.join(astroPublicDir, 'd2'), { recursive: true });
fs.mkdirSync(path.join(astroPublicDir, 'c4'), { recursive: true });

// 2. Copy vector SVGs into demo-astro/public/architecture/
const websiteAssetsDir = path.join(rootDir, 'website/assets/architecture');
if (fs.existsSync(websiteAssetsDir)) {
  const d2Source = path.join(websiteAssetsDir, 'd2');
  if (fs.existsSync(d2Source)) {
    for (const file of fs.readdirSync(d2Source)) {
      if (file.endsWith('.svg')) {
        fs.copyFileSync(path.join(d2Source, file), path.join(astroPublicDir, 'd2', file));
      }
    }
  }

  const c4Source = path.join(websiteAssetsDir, 'c4');
  if (fs.existsSync(c4Source)) {
    for (const file of fs.readdirSync(c4Source)) {
      if (file.endsWith('.svg')) {
        fs.copyFileSync(path.join(c4Source, file), path.join(astroPublicDir, 'c4', file));
      }
    }
  }
}

if (process.argv.includes('--post-build')) {
  const interactiveSource = path.join(rootDir, 'website/assets/architecture/interactive');
  const targetInteractiveDir = path.join(rootDir, 'website/architecture/assets/architecture/interactive');
  if (fs.existsSync(interactiveSource)) {
    fs.mkdirSync(targetInteractiveDir, { recursive: true });
    fs.cpSync(interactiveSource, targetInteractiveDir, { recursive: true });
    console.log('✔ Interactive LikeC4 assets copied to website/architecture subsite.');
  }
  process.exit(0);
}

// 3. Helper to write markdown with validated frontmatter
function writeWithFrontmatter(targetPath, title, description, content, extraDiagrams = '') {
  let cleaned = content.trim();
  // Strip existing frontmatter if present
  if (cleaned.startsWith('---')) {
    const endIdx = cleaned.indexOf('---', 3);
    if (endIdx !== -1) {
      cleaned = cleaned.slice(endIdx + 3).trim();
    }
  }
  // Strip initial top-level # title since Starlight renders title from frontmatter
  cleaned = cleaned.replace(/^#\s+[^\n]+\n+/, '');

  const frontmatter = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n`;
  const result = frontmatter + (extraDiagrams ? extraDiagrams + '\n\n' : '') + cleaned;
  fs.writeFileSync(targetPath, result, 'utf8');
}

// 4. Architecture docs
const archDocs = [
  {
    source: path.join(archDocsDir, 'README.md'),
    target: path.join(astroDocsDir, 'index.md'),
    title: 'System Architecture Overview',
    description: 'Living architecture models, decentralized Git storage, and zero-pollution documentation principles.',
    diagrams: '',
  },
  {
    source: path.join(archDocsDir, 'c4-architecture.md'),
    target: path.join(astroArchDir, 'c4-architecture.md'),
    title: 'LikeC4 Architecture Models',
    description: 'Hierarchical C4 models: System Context, Container architecture, and Subsystem internals.',
    diagrams: `> 🔍 **Interactive Full-Screen Explorer**: Launch the complete [**Interactive LikeC4 Viewer**](/assets/architecture/interactive/index.html) with pan, zoom, and hierarchical drill-down.\n\n### System Context Diagram (Vector)\n<p><img src="/architecture/architecture/c4/systemContext.svg" alt="C4 System Context Diagram" class="sl-diagram-clickable" loading="lazy" /></p>\n\n### Containers Architecture Diagram (Vector)\n<p><img src="/architecture/architecture/c4/containers.svg" alt="C4 Containers Diagram" class="sl-diagram-clickable" loading="lazy" /></p>\n\n### VS Code Subsystem Internals (Vector)\n<p><img src="/architecture/architecture/c4/vscodeInternals.svg" alt="C4 VS Code Internals" class="sl-diagram-clickable" loading="lazy" /></p>`,
  },
  {
    source: path.join(archDocsDir, 'data-flow-diagrams.md'),
    target: path.join(astroArchDir, 'data-flow-diagrams.md'),
    title: 'Data Flow Diagrams (D2 + ELK)',
    description: 'Multi-level Data Flow Diagrams for processes P1-P6 and Git ref storage pipelines.',
    diagrams: `### DFD Level 0: System Context (D2 + ELK)\n<p><img src="/architecture/architecture/d2/dfd-level-0-context.svg" alt="DFD Level 0 System Context" class="sl-diagram-clickable" loading="lazy" /></p>\n\n### DFD Level 1: Subsystem Data Flows P1-P6 (D2 + ELK)\n<p><img src="/architecture/architecture/d2/dfd-level-1-subsystems.svg" alt="DFD Level 1 Subsystems" class="sl-diagram-clickable" loading="lazy" /></p>\n\n### DFD Level 2: Git Ref & Base Tree SHA Pipeline (D2 + ELK)\n<p><img src="/architecture/architecture/d2/dfd-level-2-storage.svg" alt="DFD Level 2 Storage Pipeline" class="sl-diagram-clickable" loading="lazy" /></p>`,
  },
  {
    source: path.join(archDocsDir, 'components-integration.md'),
    target: path.join(astroArchDir, 'components-integration.md'),
    title: 'Components Integration Topology',
    description: 'Multi-package communication, IPC postMessage protocols, and client-side webview architecture.',
    diagrams: `### Component Integration Topology (D2 + ELK)\n<p><img src="/architecture/architecture/d2/components-integration.svg" alt="Components Integration Topology" class="sl-diagram-clickable" loading="lazy" /></p>`,
  },
  {
    source: path.join(archDocsDir, 'sequence-diagrams.md'),
    target: path.join(astroArchDir, 'sequence-diagrams.md'),
    title: 'Runtime Sequence Diagrams',
    description: 'Step-by-step lifecycles for optimistic preview sync, multi-tier auth, modal deletion, and Git ref storage.',
    diagrams: '',
  },
  {
    source: path.join(archDocsDir, 'invariants-and-adrs.md'),
    target: path.join(astroArchDir, 'invariants-and-adrs.md'),
    title: 'Invariants & ADR Catalog',
    description: 'Formal architectural invariants and Architectural Decision Records governing system safety.',
    diagrams: '',
  },
];

for (const doc of archDocs) {
  if (fs.existsSync(doc.source)) {
    const content = fs.readFileSync(doc.source, 'utf8');
    writeWithFrontmatter(doc.target, doc.title, doc.description, content, doc.diagrams);
  }
}

// 5. Additional Documentation Guides
const guideDocs = [
  {
    source: path.join(docsDir, 'AGENTIC_AI_WORKFLOWS.md'),
    target: path.join(astroGuidesDir, 'agentic-ai-workflows.md'),
    title: 'Agentic AI Workflows',
    description: 'Integrating autonomous AI coding agents with human-centered documentation reviews.',
  },
  {
    source: path.join(docsDir, 'safari-extension-guide.md'),
    target: path.join(astroGuidesDir, 'safari-extension-guide.md'),
    title: 'Safari Extension Guide',
    description: 'macOS Safari App Extension packaging, developer mode, and architecture.',
  },
  {
    source: path.join(docsDir, 'starlight-plugin.md'),
    target: path.join(astroGuidesDir, 'starlight-plugin.md'),
    title: 'Starlight Plugin Guide',
    description: 'Integrating @md-comments/starlight into Astro Starlight documentation sites.',
  },
];

for (const doc of guideDocs) {
  if (fs.existsSync(doc.source)) {
    const content = fs.readFileSync(doc.source, 'utf8');
    writeWithFrontmatter(doc.target, doc.title, doc.description, content);
  }
}

console.log('✔ Documentation synchronized to Astro content collection successfully.');
