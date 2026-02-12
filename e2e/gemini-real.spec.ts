import { test, expect } from '@playwright/test';

/**
 * E2E Test: Real Gemini CLI integration
 * Tests the full flow with the actual gemini CLI binary.
 *
 * Run: npx playwright test e2e/gemini-real.spec.ts
 */
test.describe('Gemini Real CLI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should send message and receive real Gemini response', async ({ page }) => {
    // 1. Create Gemini tab
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    // 2. Send a simple message
    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('Say exactly: hello world');
    await page.getByRole('button', { name: /send/i }).click();

    // 3. User message should appear
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Say exactly: hello world');

    // 4. Should show processing state
    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible({ timeout: 5000 });

    // 5. Wait for assistant response (real Gemini can take a while)
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({ timeout: 60000 });

    // 6. Response should contain text
    const assistantMsg = page.locator('[data-testid="message-assistant"]');
    const text = await assistantMsg.textContent();
    expect(text!.length).toBeGreaterThan(0);
    console.log('Gemini response:', text);

    // 7. Stats bar should appear
    await expect(page.locator('[data-testid="stats-bar"]')).toBeVisible({ timeout: 60000 });

    // 8. Send button should return
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible({ timeout: 5000 });

    // Take screenshot for proof
    await page.screenshot({ path: '/tmp/gemini-real-response.png' });
  });
});
