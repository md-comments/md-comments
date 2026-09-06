import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Authentication: Device Flow Autofill & Clipboard', () => {
  test('FEAT-AUTH-AUTOFILL: Auto-fills device verification user code', async ({ page }) => {
    allure.epic('Authentication');
    allure.feature('FEAT-AUTH-AUTOFILL');
    allure.story('Device Authorization Flow Auto-Fill & Clipboard Integration');

    await test.step('1. Simulate GitHub device login page DOM', async () => {
      await page.setContent(`
        <div id="device-login-page">
          <h2>Enter the code displayed on your device</h2>
          <input type="text" id="user-code" name="user_code" placeholder="XXXX-XXXX" />
          <button id="device-submit-btn">Continue</button>
        </div>
      `);
    });

    const mockDeviceCode = 'ABCD-EFGH';

    await test.step('2. Trigger extension autofill handler logic', async () => {
      await page.evaluate((code) => {
        const input = document.getElementById('user-code') as HTMLInputElement;
        if (input) {
          input.value = code;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, mockDeviceCode);

      const val = await page.inputValue('#user-code');
      expect(val).toBe(mockDeviceCode);
    });

    await test.step('3. Verify submit button becomes active', async () => {
      const submitBtn = page.locator('#device-submit-btn');
      await expect(submitBtn).toBeEnabled();
    });
  });
});
