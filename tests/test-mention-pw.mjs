import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.resolve(__dirname, '../chrome-extension/dist');
const userDataDir = path.resolve(__dirname, '../.chrome-test-profile');

async function run() {
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
  page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));

  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Navigating to GitHub markdown file...');
  await page.goto('https://github.com/mstrelex/md-test/blob/main/README.md', {
    waitUntil: 'load',
  });

  console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(4000);

  // Trigger sidebar open cleanly
  await page.evaluate(() => {
    const fab = document.getElementById('md-comments-fab-toggle');
    if (fab) {
      fab.click();
    }
  });
  await page.waitForTimeout(2000);

  // Switch to Page Comments tab so .page-textarea is visible
  await page.evaluate(() => {
    const pageTab = document.querySelector('.tab-btn[data-tab="page"]');
    if (pageTab) pageTab.click();
  });
  await page.waitForTimeout(1000);

  // Find textarea in sidebar
  const textarea = await page.waitForSelector('.page-textarea', { state: 'visible', timeout: 5000 });
  console.log('Textarea found and visible:', !!textarea);

  if (textarea) {
    console.log('Focusing and typing @...');
    await textarea.focus();
    await page.waitForTimeout(500);
    await page.keyboard.type('@');
    await page.waitForTimeout(2000);

    // Check if mention menu exists in DOM
    const mentionMenu = await page.$('.md-comments-mention-menu, #md-comments-mention-menu');
    console.log('Mention menu found in DOM:', !!mentionMenu);

    if (mentionMenu) {
      const isVisible = await mentionMenu.isVisible();
      const boundingBox = await mentionMenu.boundingBox();
      console.log('Mention menu visible:', isVisible, 'boundingBox:', boundingBox);
      const openScreenshotPath = path.resolve(__dirname, 'mention_menu_open.png');
      await page.screenshot({ path: openScreenshotPath });
      console.log('Open mention menu screenshot saved to:', openScreenshotPath);

      // Press Enter to select the active mention item
      console.log('Pressing Enter to select mention item...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      const valAfterSelect = await textarea.inputValue();
      console.log('Textarea value after selecting mention:', JSON.stringify(valAfterSelect));

      const menuAfterSelect = await page.$('.md-comments-mention-menu');
      console.log('Mention menu dismissed after select:', !menuAfterSelect);

      const selectedScreenshotPath = path.resolve(__dirname, 'mention_selected.png');
      await page.screenshot({ path: selectedScreenshotPath });
      console.log('Selected mention screenshot saved to:', selectedScreenshotPath);

      // Verify renderCommentBody behavior on page tab
      const pageTabCards = await page.evaluate(() => {
        const pageCards = Array.from(document.querySelectorAll('#tab-page .md-comments-card-body'));
        return pageCards.map((c) => ({
          html: c.innerHTML,
          hasMentionLink: !!c.querySelector('a.md-comments-mention'),
          mentionText: c.querySelector('a.md-comments-mention')?.textContent,
          mentionHref: c.querySelector('a.md-comments-mention')?.getAttribute('href'),
          mentionTitle: c.querySelector('a.md-comments-mention')?.getAttribute('title'),
        }));
      });
      console.log('Page tab cards rendered mentions:', JSON.stringify(pageTabCards, null, 2));

      // Test clickability of existing mention link
      console.log('Testing click on mention link...');
      await page.waitForTimeout(1000);
      const popupPromise = context.waitForEvent('page', { timeout: 4000 }).catch(() => null);
      await page.evaluate(() => {
        const link = document.querySelector('#tab-page a.md-comments-mention');
        if (link) {
          link.scrollIntoView();
          link.click();
        }
      });
      const popup = await popupPromise;
      console.log('Popup opened when clicking mention link:', popup ? popup.url() : 'None (did not open new tab)');
      if (popup) await popup.close();

      // Now test SUBMITTING a comment with @mstrelex to verify commit comments!
      console.log('Submitting new comment with mention...');
      const freshTextarea = await page.$('.page-textarea');
      await freshTextarea.fill('@mstrelex Clean mention test ' + Date.now());
      await page.waitForTimeout(500);
      const submitBtn = await page.$('.submit-page-btn');
      console.log('Submit button found:', !!submitBtn);
      if (submitBtn) {
        await submitBtn.click();
        console.log('Clicked submit button, waiting 5 seconds for GitHub commit & notification...');
        await page.waitForTimeout(5000);
      }
    } else {
      const debugInfo = await page.evaluate(() => {
        const ta = document.querySelector('.page-textarea, textarea');
        return {
          bound: ta?.getAttribute('data-md-mention-bound'),
          value: ta?.value,
          selectionStart: ta?.selectionStart,
          menuInDOM: !!document.getElementById('md-comments-mention-menu'),
        };
      });
      console.log('Debug info:', debugInfo);
    }
  }

  await context.close();
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
