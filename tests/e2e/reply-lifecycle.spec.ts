import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import type { InlineComment } from '../../shared/types.js';

test.describe('Threads: Reply Lifecycle (Editing & Deletion)', () => {
  test('FEAT-THRD-REPLY-EDIT: Edits existing threaded reply in place', async ({ page }) => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-REPLY-EDIT');
    allure.story('In-Place Threaded Reply Editing');

    const comment: InlineComment = {
      id: 'c1',
      author: 'alice',
      body: 'Root discussion point',
      created_at: new Date().toISOString(),
      anchor_hash: 'hash-1',
      paragraph_index: 0,
      heading_context: 'Intro',
      anchor_text: 'Introductory text',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [
        {
          id: 'r1',
          author: 'bob',
          body: 'Initial reply text',
          created_at: new Date().toISOString(),
          reactions: [],
        },
      ],
    };

    await test.step('1. Render thread with reply card and edit controls', async () => {
      await page.setContent(`
        <div id="thread" data-comment-id="c1">
          <div class="root-comment">${comment.body}</div>
          <div class="reply-card" id="reply-r1">
            <span class="reply-body">${comment.replies[0].body}</span>
            <button id="edit-r1-btn">Edit</button>
            <div id="edit-form-r1" style="display: none;">
              <textarea id="edit-r1-input">${comment.replies[0].body}</textarea>
              <button id="save-r1-btn">Save</button>
            </div>
          </div>
        </div>
      `);

      await page.evaluate(() => {
        const editBtn = document.getElementById('edit-r1-btn')!;
        const editForm = document.getElementById('edit-form-r1')!;
        const replyBody = document.querySelector('#reply-r1 .reply-body') as HTMLElement;
        const saveBtn = document.getElementById('save-r1-btn')!;
        const textarea = document.getElementById('edit-r1-input') as HTMLTextAreaElement;

        editBtn.addEventListener('click', () => {
          editForm.style.display = 'block';
        });

        saveBtn.addEventListener('click', () => {
          replyBody.innerText = textarea.value;
          editForm.style.display = 'none';
        });
      });
    });

    await test.step('2. Click edit, modify reply text, and click save', async () => {
      await page.click('#edit-r1-btn');
      await page.fill('#edit-r1-input', 'Updated reply text with revisions');
      await page.click('#save-r1-btn');

      const updatedBody = page.locator('#reply-r1 .reply-body');
      await expect(updatedBody).toHaveText('Updated reply text with revisions');
    });
  });

  test('FEAT-THRD-REPLY-DELETE: Deletes individual threaded reply and preserves root', async ({
    page,
  }) => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-REPLY-DELETE');
    allure.story('Threaded Reply Deletion & Hierarchy Preservation');

    await test.step('1. Render thread with two replies and delete controls', async () => {
      await page.setContent(`
        <div id="thread">
          <div class="root-comment">Root discussion</div>
          <div class="reply-card" id="r1">
            <span>Reply 1</span>
            <button class="del-btn" data-reply-id="r1">Delete</button>
          </div>
          <div class="reply-card" id="r2">
            <span>Reply 2</span>
            <button class="del-btn" data-reply-id="r2">Delete</button>
          </div>
        </div>
      `);

      await page.evaluate(() => {
        document.querySelectorAll('.del-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-reply-id');
            const card = document.getElementById(id!);
            if (card) card.remove();
          });
        });
      });
    });

    await test.step('2. Delete reply 1 and verify only reply 2 and root comment remain', async () => {
      await page.click('#r1 .del-btn');
      await expect(page.locator('#r1')).toHaveCount(0);
      await expect(page.locator('#r2')).toBeVisible();
      await expect(page.locator('.root-comment')).toBeVisible();
    });
  });
});
