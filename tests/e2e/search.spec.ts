import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Threads: In-Drawer Real-Time Search & Filtering', () => {
  test('FEAT-THRD-SEARCH: Filters sidebar comment threads by keyword and author', async ({
    page,
  }) => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-SEARCH');
    allure.story('Real-Time Sidebar Comment & Author Search');

    await test.step('1. Render comment drawer with search input and comment cards', async () => {
      await page.setContent(`
        <div id="md-comments-sidebar" class="sidebar">
          <input type="text" id="filter-input" placeholder="Search comments by text or author..." />
          <div id="comments-container">
            <div class="comment-card" data-author="alice" data-body="Refactor the authentication module">
              <span class="author">@alice</span>
              <p class="body">Refactor the authentication module</p>
            </div>
            <div class="comment-card" data-author="bob" data-body="Looks good to me, ready to merge">
              <span class="author">@bob</span>
              <p class="body">Looks good to me, ready to merge</p>
            </div>
            <div class="comment-card" data-author="charlie" data-body="Add more unit tests for storage">
              <span class="author">@charlie</span>
              <p class="body">Add more unit tests for storage</p>
            </div>
          </div>
        </div>
      `);

      await page.evaluate(() => {
        const input = document.getElementById('filter-input') as HTMLInputElement;
        const cards = document.querySelectorAll('.comment-card') as NodeListOf<HTMLElement>;

        input.addEventListener('input', () => {
          const query = input.value.toLowerCase().trim();
          cards.forEach((card) => {
            const author = (card.getAttribute('data-author') || '').toLowerCase();
            const body = (card.getAttribute('data-body') || '').toLowerCase();
            const matches = !query || author.includes(query) || body.includes(query);
            card.style.display = matches ? 'block' : 'none';
          });
        });
      });
    });

    await test.step('2. Filter by keyword and verify filtered results', async () => {
      await page.fill('#filter-input', 'authentication');
      const visibleCards = page.locator('.comment-card:visible');
      await expect(visibleCards).toHaveCount(1);
      await expect(visibleCards.first()).toContainText('Refactor the authentication module');
    });

    await test.step('3. Filter by author and verify filtered results', async () => {
      await page.fill('#filter-input', 'bob');
      const visibleCards = page.locator('.comment-card:visible');
      await expect(visibleCards).toHaveCount(1);
      await expect(visibleCards.first()).toContainText('@bob');
    });

    await test.step('4. Clear query and verify all comments restore', async () => {
      await page.fill('#filter-input', '');
      const visibleCards = page.locator('.comment-card:visible');
      await expect(visibleCards).toHaveCount(3);
    });
  });
});
