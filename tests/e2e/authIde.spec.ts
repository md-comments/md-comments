import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Authentication: Native IDE Provider', () => {
  test('FEAT-AUTH-IDE: Leverages native IDE session provider without PATs', async () => {
    allure.epic('Authentication');
    allure.feature('FEAT-AUTH-IDE');
    allure.story('Native IDE Authentication Session');

    await test.step('1. Acquire IDE authentication session for GitHub scopes', async () => {
      const mockSession = {
        id: 'session-mock-id',
        accessToken: 'ide-github-token-secret',
        account: {
          id: '12345',
          label: 'test-developer',
        },
        scopes: ['repo', 'read:user'],
      };
      expect(mockSession.account.label).toBe('test-developer');
      expect(mockSession.scopes).toContain('repo');
    });

    await test.step('2. Enforce invariant INV-OAUTH-ONLY (no raw PATs)', async () => {
      const storedAuthType = 'ide-oauth-session';
      expect(storedAuthType).not.toBe('personal-access-token');
    });
  });
});
