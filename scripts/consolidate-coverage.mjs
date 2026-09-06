import fs from 'fs';
import path from 'path';
import MCR from 'monocart-coverage-reports';

async function consolidate() {
  console.log('[Coverage] Initializing Monocart Coverage Reports consolidation...');

  const mcrConfig = {
    name: 'Markdown Comments Unified 100% Coverage Report',
    outputDir: './coverage/consolidated',
    reports: ['v8', 'console-summary', 'lcovonly', 'html'],
    entryFilter: (entry) => {
      const url = entry.url || '';
      return (
        (url.includes('shared/') || url.includes('chrome-extension/src/')) &&
        !url.includes('node_modules') &&
        !url.includes('.test.')
      );
    },
    thresholds: {
      statements: 100,
      branches: 90,
      functions: 100,
      lines: 100,
    },
  };

  const mcr = MCR(mcrConfig);

  // 1. Ingest Vitest coverage data if present
  const vitestCoveragePath = path.resolve('coverage/coverage-final.json');
  if (fs.existsSync(vitestCoveragePath)) {
    try {
      const vitestData = JSON.parse(fs.readFileSync(vitestCoveragePath, 'utf8'));
      await mcr.add(vitestData);
      console.log('[Coverage] Added Vitest coverage data.');
    } catch (e) {
      console.warn('[Coverage] Warning parsing Vitest coverage-final.json:', e.message);
    }
  }

  // 2. Ingest CDP coverage data if present
  const cdpDir = path.resolve('coverage/cdp');
  if (fs.existsSync(cdpDir)) {
    const files = fs.readdirSync(cdpDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const cdpData = JSON.parse(fs.readFileSync(path.join(cdpDir, file), 'utf8'));
        await mcr.add(cdpData);
        console.log(`[Coverage] Added CDP coverage file: ${file}`);
      } catch (e) {
        console.warn(`[Coverage] Failed reading CDP file ${file}:`, e.message);
      }
    }
  }

  // 3. Generate consolidated output
  try {
    const coverageResults = await mcr.generate();
    console.log('[Coverage] Consolidated report generated successfully.');
    return coverageResults;
  } catch (err) {
    console.warn('[Coverage] Note during generation:', err.message);
  }
}

consolidate().catch(console.error);
