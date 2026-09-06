import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const resultsDir = path.resolve('allure-results');
const reportDir = path.resolve('coverage/allure-report');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log(`[Allure] Generating interactive HTML dashboard from ${resultsDir} -> ${reportDir}...`);

try {
  execSync(`npx allure generate "${resultsDir}" --clean -o "${reportDir}"`, {
    stdio: 'inherit',
  });
  console.log(`[Allure] Report successfully generated at: ${reportDir}/index.html`);
} catch (err) {
  console.warn('[Allure] Notice during generation:', err.message);
}
