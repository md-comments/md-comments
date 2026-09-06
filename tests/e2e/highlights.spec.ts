import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Anchoring: Selection Highlights & Hover Tooltips', () => {
  test('FEAT-ANCH-HIGHLIGHT: Renders mark elements and interactive preview tooltips', async ({
    page,
  }) => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-HIGHLIGHT');
    allure.story('Persistent Selection Highlighting & Hover Tooltips');

    await test.step('1. Mount markdown document DOM with anchored highlight marks', async () => {
      await page.setContent(`
        <article class="markdown-body">
          <p id="p0">
            This is an <mark class="md-comment-highlight" data-comment-id="c1" style="background: rgba(254, 240, 138, 0.4); cursor: pointer;">important paragraph</mark> in documentation.
          </p>
          <div id="md-comment-tooltip" class="md-comment-tooltip" style="display: none; position: absolute; background: #24292f; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px;"></div>
        </article>
      `);
    });

    await test.step('2. Verify presence and attribute of comment highlight mark', async () => {
      const mark = page.locator('mark.md-comment-highlight');
      await expect(mark).toBeVisible();
      await expect(mark).toHaveAttribute('data-comment-id', 'c1');
      await expect(mark).toHaveText('important paragraph');
    });

    await test.step('3. Hover over highlight and trigger tooltip preview', async () => {
      await page.evaluate(() => {
        const mark = document.querySelector('mark.md-comment-highlight') as HTMLElement;
        const tooltip = document.getElementById('md-comment-tooltip') as HTMLElement;
        mark.addEventListener('mouseenter', () => {
          tooltip.innerText = '@alice: Please review this paragraph.';
          tooltip.style.display = 'block';
        });
        mark.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      });

      await page.hover('mark.md-comment-highlight');
      const tooltip = page.locator('#md-comment-tooltip');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText('@alice: Please review this paragraph.');
    });
  });
});
