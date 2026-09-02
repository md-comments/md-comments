import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.resolve(__dirname, '../chrome-extension/dist');
const userDataDir = path.resolve(__dirname, '../.chrome-test-profile');
const artifactDir = '/Users/maratstrelets/.gemini/antigravity-ide/brain/e0a9db83-6f8d-4d86-a17f-a2a33889614e';

async function main() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--start-maximized',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());
  console.log('Navigating to GitHub...');
  await page.goto('https://github.com/mstrelex/md-test/blob/main/README.md', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click the comments floating button or open sidebar
  const floatingBtn = await page.$('.md-comments-floating-badge, [title*="Comments"], .md-comments-toggle-btn');
  if (floatingBtn) {
    console.log('Clicking floating comments toggle button...');
    await floatingBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('Taking full page screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'page_actual.png'), fullPage: false });
  console.log('Screenshot saved.');
  await context.close();
}

main().catch(console.error);
