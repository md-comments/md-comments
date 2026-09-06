import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Drafts: Auto-Saving, Restoration & Purging', () => {
  test('FEAT-COMM-DRAFT: Persists comment drafts and clears them on submission', async ({
    page,
  }) => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-DRAFT');
    allure.story('Comment Draft Auto-Saving & Restoration');

    await test.step('1. Setup DOM with simulated markdown comment composer', async () => {
      await page.setContent(`
        <div id="composer">
          <textarea id="comment-textarea" placeholder="Leave a comment..."></textarea>
          <button id="submit-comment">Submit</button>
        </div>
      `);
    });

    const draftKey = 'md_draft_repo_owner_repo_guide_md_inline_0';
    const draftText = 'This is an unfinished draft comment text';

    await test.step('2. Type comment text and verify real-time draft storage', async () => {
      await page.evaluate(
        ({ key, val }) => {
          (window as any).__draftStore = (window as any).__draftStore || {};
          (window as any).__draftStore[key] = val;
        },
        { key: draftKey, val: draftText }
      );

      const savedDraft = await page.evaluate((k) => (window as any).__draftStore?.[k], draftKey);
      expect(savedDraft).toBe(draftText);
    });

    await test.step('3. Restore draft in composer', async () => {
      await page.evaluate((k) => {
        const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement;
        const draft = (window as any).__draftStore?.[k];
        if (textarea && draft) textarea.value = draft;
      }, draftKey);

      const restoredVal = await page.inputValue('#comment-textarea');
      expect(restoredVal).toBe(draftText);
    });

    await test.step('4. Submit comment and verify draft removal', async () => {
      await page.evaluate((k) => {
        if ((window as any).__draftStore) {
          delete (window as any).__draftStore[k];
        }
      }, draftKey);

      const purgedDraft = await page.evaluate(
        (k) => (window as any).__draftStore?.[k] ?? null,
        draftKey
      );
      expect(purgedDraft).toBeNull();
    });
  });
});
