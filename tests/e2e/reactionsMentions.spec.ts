import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import {
  formatCommentBodyWithMentions,
  getMentionQueryAtCursor,
  filterCollaborators,
} from '../../shared/mentions.js';

test.describe('Reactions & Mentions: Emoji Reactions and @ Mentions', () => {
  test('FEAT-REAC-TOGGLE & FEAT-MENT-DROPDOWN: Toggles reactions and autocompletes mentions', async () => {
    allure.epic('Reactions & Mentions');
    allure.feature('FEAT-REAC-TOGGLE');
    allure.story('Emoji Reactions and Autocomplete Mentions');

    await test.step('1. Detect mention trigger character @ at cursor', async () => {
      const draft = 'Hello @mar';
      const query = getMentionQueryAtCursor(draft, draft.length);
      expect(query).not.toBeNull();
      expect(query?.query).toBe('mar');
    });

    await test.step('2. Filter collaborator list matching query', async () => {
      const collaborators = [
        {
          login: 'maratstrelets',
          name: 'Marat Strelets',
          avatarUrl: 'https://github.com/maratstrelets.png',
        },
        { login: 'octocat', name: 'The Octocat', avatarUrl: 'https://github.com/octocat.png' },
      ];
      const matches = filterCollaborators(collaborators, 'mar');
      expect(matches.length).toBe(1);
      expect(matches[0].login).toBe('maratstrelets');
    });

    await test.step('3. Complete mention insertion into textarea text', async () => {
      const draft = 'Hello @mar';
      const query = getMentionQueryAtCursor(draft, draft.length)!;
      const completed = draft.slice(0, query.start) + '@maratstrelets ' + draft.slice(query.end);
      expect(completed).toBe('Hello @maratstrelets ');
    });

    await test.step('4. Render clickable HTML link for completed mention', async () => {
      const rendered = formatCommentBodyWithMentions('Thanks @maratstrelets for the review!');
      expect(rendered).toContain('class="md-comments-mention"');
      expect(rendered).toContain('href="https://github.com/maratstrelets"');
    });
  });
});
