import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.resolve(__dirname, '../chrome-extension/dist');

async function run() {
  console.log('Loading extension from:', pathToExtension);
  const context = await chromium.launchPersistentContext('/tmp/pw-chrome-profile-' + Date.now(), {
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const page = await context.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  console.log('Navigating to GitHub...');
  await page.goto('https://github.com/facebook/react/blob/main/README.md', { waitUntil: 'networkidle' });
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());

  // Wait a bit for content script to run
  await page.waitForTimeout(4000);

  // Check if FAB button or sidebar exists
  const fab = await page.$('.md-comments-fab-toggle, #md-comments-fab-toggle, .sidebar-toggle-btn');
  console.log('FAB element found:', !!fab);
  if (fab) {
    console.log('Clicking FAB button...');
    await fab.click();
    await page.waitForTimeout(2000);
  }

  // Check drawer
  const drawer = await page.$('.sidebar-container, .md-comments-drawer, #md-comments-sidebar-embedded');
  console.log('Sidebar/Drawer found:', !!drawer);

  // Take screenshot
  const screenshotPath = path.resolve(__dirname, 'github_ext_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  // Inspect HTML of comment cards in DOM
  const cardsInfo = await page.evaluate(() => {
    const cards = document.querySelectorAll('.md-comments-card, .comment-card');
    return Array.from(cards).map(card => ({
      className: card.className,
      outerHTML: card.outerHTML,
    }));
  });
  console.log('Found cards:', cardsInfo.length);
  if (cardsInfo.length > 0) {
    console.log('Card 0 HTML snippet:', cardsInfo[0].outerHTML.slice(0, 500));
  }

  await context.close();
}

run().catch(console.error);
