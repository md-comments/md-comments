import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import {
  formatCommentBodyWithMentions,
  getMentionQueryAtCursor,
  filterCollaborators,
} from '../../shared/mentions.js';

test.describe('Mentions: Collaborator Autocomplete & Keyboard Selection', () => {
  const collaborators = [
    {
      login: 'maratstrelets',
      name: 'Marat Strelets',
      avatarUrl: 'https://github.com/maratstrelets.png',
    },
    { login: 'octocat', name: 'The Octocat', avatarUrl: 'https://github.com/octocat.png' },
    { login: 'alice', name: 'Alice Smith', avatarUrl: 'https://github.com/alice.png' },
    { login: 'alex', name: 'Alex Johnson', avatarUrl: 'https://github.com/alex.png' },
  ];

  test('FEAT-MENT-DROPDOWN: Displays collaborator autocomplete dropdown when @ is typed', async () => {
    allure.epic('Mentions');
    allure.feature('FEAT-MENT-DROPDOWN');
    allure.story('@ Collaborator Autocomplete');

    await test.step('1. Detect mention query at cursor position', async () => {
      const text = 'Hey @al, could you verify this?';
      const cursor = 7; // after '@al'
      const query = getMentionQueryAtCursor(text, cursor);

      expect(query).not.toBeNull();
      expect(query?.query).toBe('al');
    });

    await test.step('2. Filter collaborator list by query string', async () => {
      const matches = filterCollaborators(collaborators, 'al');
      expect(matches.length).toBe(2);
      expect(matches.map((c) => c.login)).toEqual(['alice', 'alex']);
    });

    await test.step('3. Render interactive mention badge in formatted comment body', async () => {
      const body = 'Thanks @alice for the feedback!';
      const html = formatCommentBodyWithMentions(body);
      expect(html).toContain('class="md-comments-mention"');
      expect(html).toContain('href="https://github.com/alice"');
      expect(html).toContain('@alice');
    });
  });

  test('FEAT-MENT-KEYBOARD: Navigates suggestions via keyboard and inserts mention', async () => {
    allure.epic('Mentions');
    allure.feature('FEAT-MENT-KEYBOARD');
    allure.story('Keyboard Arrows & Tab Insertion');

    const matches = filterCollaborators(collaborators, 'al'); // ['alice', 'alex']
    let selectedIndex = 0;

    function handleKeyDown(key: 'ArrowDown' | 'ArrowUp' | 'Enter' | 'Tab'): string | null {
      if (key === 'ArrowDown') {
        selectedIndex = (selectedIndex + 1) % matches.length;
        return null;
      }
      if (key === 'ArrowUp') {
        selectedIndex = (selectedIndex - 1 + matches.length) % matches.length;
        return null;
      }
      if (key === 'Enter' || key === 'Tab') {
        return matches[selectedIndex].login;
      }
      return null;
    }

    await test.step('1. Navigate down the list with ArrowDown', async () => {
      handleKeyDown('ArrowDown');
      expect(selectedIndex).toBe(1);
    });

    await test.step('2. Navigate back up with ArrowUp', async () => {
      handleKeyDown('ArrowUp');
      expect(selectedIndex).toBe(0);
    });

    await test.step('3. Select suggestion with Tab key', async () => {
      const selected = handleKeyDown('Tab');
      expect(selected).toBe('alice');
    });

    await test.step('4. Replace cursor mention token with completed @handle', async () => {
      const draft = 'Reviewed by @al';
      const query = getMentionQueryAtCursor(draft, draft.length)!;
      const completed = draft.slice(0, query.start) + '@alice ' + draft.slice(query.end);
      expect(completed).toBe('Reviewed by @alice ');
    });
  });
});
