import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataDir = path.resolve(__dirname, '../.chrome-test-profile');
const pathToExtension = path.resolve(__dirname, '../chrome-extension/dist');

async function launch() {
  console.log('Using persistent user data dir:', userDataDir);
  console.log('Loading extension from:', pathToExtension);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    viewport: null,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--start-maximized',
    ],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto('https://github.com/mstrelex/md-test/blob/main/README.md');

  console.log('Chrome is open with persistent profile. Log in to GitHub if needed.');
  console.log('The browser window will remain open.');

  // Keep process alive until user closes the window
  context.on('close', () => {
    console.log('Browser window closed.');
    process.exit(0);
  });
}

launch().catch(console.error);
