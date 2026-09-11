import fs from 'fs';
import path from 'path';

const triageDir = path.resolve(process.cwd(), 'artifacts/ai-triage');
if (!fs.existsSync(triageDir)) {
  fs.mkdirSync(triageDir, { recursive: true });
}

const testResultsDir = path.resolve(process.cwd(), 'test-results');
const diffFiles = [];

if (fs.existsSync(testResultsDir)) {
  const entries = fs.readdirSync(testResultsDir, { recursive: true });
  for (const entry of entries) {
    if (typeof entry === 'string' && (entry.endsWith('-diff.png') || entry.endsWith('-actual.png'))) {
      diffFiles.push(entry);
    }
  }
}

const reportPath = path.join(triageDir, `visual-drift-${Date.now()}.md`);
const reportContent = `### 🎨 Visual Drift Diagnostic Packet

- **Timestamp**: ${new Date().toISOString()}
- **Component Parity Scope**: GitHub Extension, VS Code Extension, Demo Sites
- **Detected Visual Diffs**: ${diffFiles.length > 0 ? diffFiles.join(', ') : 'Pixel ratio or component metric assertion failed in tests/e2e/visual/'}

#### Recommendation
Inspect the uploaded \`visual-regression-diffs\` or \`playwright-report\` artifact in this GitHub Actions run to examine the side-by-side golden vs actual screenshot diff. Verify if changes were intentional or if style tokens diverged.
`;

fs.writeFileSync(reportPath, reportContent, 'utf8');
console.log(`Generated visual drift triage packet: ${reportPath}`);
