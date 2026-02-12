import { test, expect } from '@playwright/test';

/**
 * E2E Test: Real CLI chat integration
 * These tests require actual Claude CLI / Gemini CLI to be installed and configured.
 * Skip by default; remove test.skip() to run manually.
 */
test.describe('Real CLI chat', () => {
  test.skip(true, 'Requires real CLI');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should complete Claude conversation via chat UI', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    // Type a simple prompt
    await page.locator('[data-testid="chat-input"]').fill('Say "hello world" and nothing else.');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for response with generous timeout
    await expect(page.getByTestId('stats-bar')).toBeVisible({ timeout: 60000 });

    // Should have assistant response
    const messages = page.locator('[data-testid="message-bubble"]');
    await expect(messages).toHaveCount(2); // user + assistant
  });

  test('should complete Gemini conversation via chat UI', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="chat-input"]').fill('Say "hello world" and nothing else.');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByTestId('stats-bar')).toBeVisible({ timeout: 60000 });

    const messages = page.locator('[data-testid="message-bubble"]');
    await expect(messages).toHaveCount(2);
  });

  test('should support multi-round conversation', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    // First round
    await page.locator('[data-testid="chat-input"]').fill('Remember the number 42.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.locator('[data-testid="stats-bar"]').first()).toBeVisible({ timeout: 60000 });

    // Second round
    await page.locator('[data-testid="chat-input"]').fill('What number did I ask you to remember?');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for second response
    await expect(page.locator('[data-testid="stats-bar"]').nth(1)).toBeVisible({ timeout: 60000 });

    // Should have 4 messages (2 user + 2 assistant)
    const messages = page.locator('[data-testid="message-bubble"]');
    await expect(messages).toHaveCount(4);

    // Second response should mention 42
    const lastMessage = messages.last();
    await expect(lastMessage).toContainText('42');
  });
});
