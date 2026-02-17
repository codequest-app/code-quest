import { type ConsoleMessage, expect, test } from '@playwright/test';

/**
 * E2E: Complete send → receive flow for Claude & Gemini
 * Verifies the full lifecycle: create tab → send message → user bubble → assistant response → stats
 *
 * Run: MOCK_CLI=true npx playwright test e2e/chat-send-receive.spec.ts
 */
test.describe('Chat Send & Receive (mock CLI)', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    consoleErrors = [];

    // Monitor all console output
    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('Claude: send message and receive assistant response', async ({ page }) => {
    // 1. Create Claude tab
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // 2. Type and send message
    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('Hello Claude, this is an E2E test');
    await page.getByRole('button', { name: /send/i }).click();

    // 3. User message should appear immediately
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="message-user"]')).toContainText(
      'Hello Claude, this is an E2E test',
    );

    // 4. Should show "Stop" button (processing state)
    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible({ timeout: 3000 });

    // 5. Wait for assistant response
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({ timeout: 15000 });

    // 6. Assistant response should contain echoed message (mock script echoes back)
    await expect(page.locator('[data-testid="message-assistant"]')).toContainText(
      'Hello Claude, this is an E2E test',
      { timeout: 15000 },
    );

    // 7. Battle overlay should have appeared during processing
    await expect(page.locator('[data-testid="battle-overlay"]')).toBeVisible({ timeout: 10000 });

    // 8. Stats bar should appear (indicates completion)
    await expect(page.locator('[data-testid="stats-bar"]')).toBeVisible({ timeout: 15000 });

    // 9. "Send" button should return (no longer processing)
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible({ timeout: 5000 });

    // 10. No console errors
    const relevantErrors = consoleErrors.filter(
      (e) => !e.includes('404') && !e.includes('favicon'),
    );
    expect(relevantErrors).toEqual([]);
  });

  test('Gemini: send message and receive assistant response', async ({ page }) => {
    // 1. Create Gemini tab
    await page.getByRole('button', { name: /gemini/i }).click();
    await expect(page.getByText('Gemini 1')).toBeVisible({ timeout: 5000 });

    // 2. Send message
    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('Hello Gemini, this is an E2E test');
    await page.getByRole('button', { name: /send/i }).click();

    // 3. User message
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible({ timeout: 3000 });

    // 4. Processing state
    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible({ timeout: 3000 });

    // 5. Assistant response
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="message-assistant"]')).toContainText(
      'Hello Gemini, this is an E2E test',
      { timeout: 15000 },
    );

    // 6. Battle overlay should have appeared during processing
    await expect(page.locator('[data-testid="battle-overlay"]')).toBeVisible({ timeout: 10000 });

    // 7. Stats bar (completion)
    await expect(page.locator('[data-testid="stats-bar"]')).toBeVisible({ timeout: 15000 });

    // 8. Send button restored
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible({ timeout: 5000 });

    // 9. No console errors
    const relevantErrors = consoleErrors.filter(
      (e) => !e.includes('404') && !e.includes('favicon'),
    );
    expect(relevantErrors).toEqual([]);
  });

  test('Claude: second message (multi-turn with --resume)', async ({ page }) => {
    // Create and send first message
    await page.getByRole('button', { name: /claude/i }).click();
    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('First message');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for first response
    await expect(page.locator('[data-testid="stats-bar"]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible({ timeout: 5000 });

    // Send second message
    await textarea.fill('Second message');
    await page.getByRole('button', { name: /send/i }).click();

    // Should have 2 user messages
    await expect(page.locator('[data-testid="message-user"]')).toHaveCount(2, { timeout: 15000 });

    // Should have 2 assistant messages
    await expect(page.locator('[data-testid="message-assistant"]')).toHaveCount(2, {
      timeout: 15000,
    });

    // Second assistant message should contain echoed text
    const secondAssistant = page.locator('[data-testid="message-assistant"]').nth(1);
    await expect(secondAssistant).toContainText('Second message', { timeout: 15000 });
  });
});
