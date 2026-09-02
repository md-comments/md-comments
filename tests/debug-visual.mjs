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
  await page.goto('https://github.com/mstrelex/md-test/blob/main/README.md', { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  // Trigger sidebar open
  await page.evaluate(() => {
    const badge = document.querySelector('.md-comments-floating-badge, .md-comments-badge');
    if (badge) (badge).click();
    const btn = document.querySelector('#md-comments-toggle, [title*="Comments"]');
    if (btn) (btn).click();
  });
  await page.waitForTimeout(3000);

  // Get debug info from within the page
  const debugInfo = await page.evaluate(() => {
    const card = document.querySelector('.md-comments-card');
    if (!card) return { error: 'No card found' };

    const header = card.querySelector('.md-comments-card-header');
    const authorSection = card.querySelector('.md-comments-author-section');
    const actions = card.querySelector('.md-comments-card-actions');
    const emojiContainer = card.querySelector('.emoji-picker-container');
    const editBtn = card.querySelector('.edit-comment-btn');

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        display: style.display,
        flexDirection: style.flexDirection,
        justifyContent: style.justifyContent,
        position: style.position,
        float: style.float,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        width: style.width
      };
    };

    return {
      card: getBox(card),
      header: getBox(header),
      authorSection: getBox(authorSection),
      actions: getBox(actions),
      emojiContainer: getBox(emojiContainer),
      editBtn: getBox(editBtn)
    };
  });

  console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));

  // Take screenshot of whole page & sidebar
  await page.screenshot({ path: path.join(artifactDir, 'debug_screenshot.png'), fullPage: false });
  console.log('Screenshot saved to', path.join(artifactDir, 'debug_screenshot.png'));

  // Keep open for a moment
  await page.waitForTimeout(2000);
  await context.close();
}

main().catch(console.error);
