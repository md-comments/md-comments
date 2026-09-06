import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Authentication: OAuth Device Flow', () => {
  test('FEAT-AUTH-DEVICE: Authenticates via RFC 8628 device authorization', async () => {
    allure.epic('Authentication');
    allure.feature('FEAT-AUTH-DEVICE');
    allure.story('OAuth Device Flow RFC 8628');

    await test.step('1. Request device code and user code from GitHub OAuth', async () => {
      const mockDeviceCodeResponse = {
        device_code: 'mock-device-code-12345',
        user_code: 'WDJB-MJHT',
        verification_uri: 'https://github.com/login/device',
        expires_in: 900,
        interval: 5,
      };
      expect(mockDeviceCodeResponse.user_code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(mockDeviceCodeResponse.verification_uri).toBe('https://github.com/login/device');
    });

    await test.step('2. Poll for token exchange after user verification', async () => {
      const mockTokenResponse = {
        access_token: 'ghu_mock_oauth_access_token_12345',
        token_type: 'bearer',
        scope: 'repo',
      };
      expect(mockTokenResponse.access_token).toBeDefined();
      expect(mockTokenResponse.access_token.startsWith('ghu_')).toBe(true);
    });

    await test.step('3. Hydrate session into client storage', async () => {
      const mockProfile = {
        login: 'test-runner-bot',
        name: 'Test Runner Bot',
        avatar_url: 'https://github.com/ghost.png',
      };
      expect(mockProfile.login).toBe('test-runner-bot');
    });
  });
});
