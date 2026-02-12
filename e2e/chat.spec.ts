import { test, expect } from '@playwright/test';

/**
 * E2E Test: Chat Tab creation and interaction
 */
test.describe('Chat Tab E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should create Claude chat tab via button click', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();

    // Should see a Claude tab
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    // Should see chat panel
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
  });

  test('should create Gemini chat tab via button click', async ({ page }) => {
    await page.getByRole('button', { name: /gemini/i }).click();

    // Should see a Gemini tab
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });
  });

  test('should show chat input in chat panel', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    // Should have chat input
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('should keep terminal tabs working alongside chat tabs', async ({ page }) => {
    // Create a terminal
    await page.getByRole('button', { name: /terminal/i }).click();
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    // Create a Claude chat
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    // Switch back to terminal
    await page.getByText('Terminal 1').click();
    await expect(page.locator('.terminal-wrapper')).toBeVisible();

    // Switch to chat
    await page.getByText('Claude 1').click();
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
  });

  test('should send message and show it in chat', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 5000 });

    // Type and send a message
    await page.getByLabel('Message input').fill('Hello Claude');
    await page.getByRole('button', { name: /send/i }).click();

    // Should show user message
    await expect(page.getByText('Hello Claude')).toBeVisible();
  });

  test('should create multiple chat tabs', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 2')).toBeVisible({ timeout: 5000 });
  });
});
