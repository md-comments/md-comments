import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.resolve(__dirname, '../chrome-extension/dist');
const userDataDir = path.resolve(__dirname, '../.chrome-test-profile');

async function main() {
  console.log('Loading extension from:', pathToExtension);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--start-maximized',
    ],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  
  console.log('Opening GitHub page...');
  await page.goto('https://github.com/mstrelex/md-test/blob/main/README.md');

  console.log('Extension is loaded and active in the browser.');
}

main().catch(console.error);
