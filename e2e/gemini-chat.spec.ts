import { expect, test } from '@playwright/test';

/**
 * E2E Test: Gemini chat via mock CLI
 * Validates the full flow: create tab → send message → receive response
 *
 * Run with: MOCK_CLI=true npx playwright test e2e/gemini-chat.spec.ts
 */
test.describe('Gemini Chat E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should create Gemini chat tab', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();

    // Tab should appear
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    // Chat panel should be visible
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Chat input should be visible
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });

  test('should send message and show user bubble', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 5000 });

    // Type and send
    await page.getByLabel('Message input').fill('Hello Gemini');
    await page.getByRole('button', { name: /send/i }).click();

    // User message should appear
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Hello Gemini');
  });

  test('should receive assistant response from mock CLI', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 5000 });

    // Send message
    await page.getByLabel('Message input').fill('Hello Gemini');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for assistant response
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({ timeout: 15000 });

    // Should have stats bar (indicates completion)
    await expect(page.locator('[data-testid="stats-bar"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show correct response content from mock', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 5000 });

    // Send message
    await page.getByLabel('Message input').fill('Test message for Gemini');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for assistant response with mock content
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({ timeout: 15000 });

    // Mock script echoes back the message, so response should contain it
    const assistantMessage = page.locator('[data-testid="message-assistant"]');
    await expect(assistantMessage).toContainText('Test message for Gemini', { timeout: 15000 });
  });

  test('should support multiple messages in same session', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 5000 });

    // First message
    await page.getByLabel('Message input').fill('First message');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for first response
    await expect(page.locator('[data-testid="stats-bar"]').first()).toBeVisible({ timeout: 15000 });

    // Second message
    await page.getByLabel('Message input').fill('Second message');
    await page.getByRole('button', { name: /send/i }).click();

    // Should have 2 user messages
    await expect(page.locator('[data-testid="message-user"]')).toHaveCount(2, { timeout: 15000 });

    // Should have 2 assistant messages
    await expect(page.locator('[data-testid="message-assistant"]')).toHaveCount(2, {
      timeout: 15000,
    });
  });

  test('should create multiple Gemini tabs', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 2')).toBeVisible({ timeout: 5000 });

    // Both tabs should exist
    await expect(page.getByText('Gemini 1')).toBeVisible();
    await expect(page.getByText('Gemini 2')).toBeVisible();
  });

  test('should close Gemini tab', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    // Close the tab
    await page.getByRole('button', { name: 'close' }).click();

    // Tab should be gone
    await expect(page.getByText('Gemini 1')).not.toBeVisible();
  });
});
