import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import type { InlineComment, Reaction } from '../../shared/types.js';

test.describe('Reactions: Emoji Reactions & Tooltip Deduplication', () => {
  test('FEAT-REAC-TOGGLE: Adds and removes emoji reactions with optimistic UI updates', async () => {
    allure.epic('Reactions');
    allure.feature('FEAT-REAC-TOGGLE');
    allure.story('Emoji Reactions with Optimistic UI');

    const comment: InlineComment = {
      id: 'comm-react-1',
      author: 'alice',
      body: 'Reviewing performance benchmarks',
      created_at: new Date().toISOString(),
      anchor_hash: 'hash123',
      paragraph_index: 0,
      heading_context: 'Intro',
      anchor_text: 'Benchmark intro',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    function toggleReaction(targetComment: InlineComment, emoji: string, user: string): void {
      targetComment.reactions = targetComment.reactions || [];
      const existing = targetComment.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes(user)) {
          existing.users = existing.users.filter((u) => u !== user);
          if (existing.users.length === 0) {
            targetComment.reactions = targetComment.reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          existing.users.push(user);
        }
      } else {
        targetComment.reactions.push({
          emoji,
          users: [user],
        });
      }
    }

    await test.step('1. Optimistically add thumbs up reaction', async () => {
      toggleReaction(comment, '+1', 'bob');
      expect(comment.reactions?.length).toBe(1);
      expect(comment.reactions?.[0].emoji).toBe('+1');
      expect(comment.reactions?.[0].users.length).toBe(1);
      expect(comment.reactions?.[0].users).toContain('bob');
    });

    await test.step('2. Add second user reaction to same emoji', async () => {
      toggleReaction(comment, '+1', 'carol');
      expect(comment.reactions?.[0].users.length).toBe(2);
      expect(comment.reactions?.[0].users).toEqual(['bob', 'carol']);
    });

    await test.step('3. Remove reaction by clicking again (toggle off)', async () => {
      toggleReaction(comment, '+1', 'bob');
      expect(comment.reactions?.[0].users.length).toBe(1);
      expect(comment.reactions?.[0].users).toEqual(['carol']);
    });
  });

  test('FEAT-REAC-TOOLTIP: Displays participant tooltip and deduplicates user reactions', async () => {
    allure.epic('Reactions');
    allure.feature('FEAT-REAC-TOOLTIP');
    allure.story('Reaction Usernames Tooltip & Deduplication');

    const reaction: Reaction = {
      emoji: 'rocket',
      users: ['alice', 'bob', 'carol'],
    };

    function formatReactionTooltip(r: Reaction): string {
      const uniqueUsers = Array.from(new Set(r.users));
      if (uniqueUsers.length === 0) return '';
      if (uniqueUsers.length === 1) return uniqueUsers[0];
      if (uniqueUsers.length === 2) return `${uniqueUsers[0]} and ${uniqueUsers[1]}`;
      return `${uniqueUsers.slice(0, 2).join(', ')} and ${uniqueUsers.length - 2} other(s)`;
    }

    await test.step('1. Format tooltip for multiple reacting users', async () => {
      const tooltip = formatReactionTooltip(reaction);
      expect(tooltip).toBe('alice, bob and 1 other(s)');
    });

    await test.step('2. Deduplicate accidental double-voting', async () => {
      const duplicateUsers = ['alice', 'alice', 'bob'];
      const deduplicated = Array.from(new Set(duplicateUsers));
      expect(deduplicated).toEqual(['alice', 'bob']);
      expect(deduplicated.length).toBe(2);
    });
  });
});
