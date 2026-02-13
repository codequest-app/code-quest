import { expect, test } from '@playwright/test';

test.describe('Terminal Tab Switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should preserve terminal content when switching tabs via serialize/restore', async ({
    page,
  }) => {
    // Create terminal 1
    await page.getByRole('button', { name: /terminal/i }).click();
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    // Wait for shell output in terminal 1
    const xtermRows = page.locator('.terminal-wrapper .xterm-rows');
    await expect(xtermRows).not.toBeEmpty({ timeout: 5000 });

    // Create terminal 2
    await page.getByRole('button', { name: /terminal/i }).click();
    await expect(page.getByText('Terminal 2')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Only 1 xterm instance should exist (serialize disposes the other)
    const terminalContent = page.locator('.terminal-content');
    const xtermCount = await terminalContent.locator('.xterm').count();
    expect(xtermCount).toBe(1);

    // Switch back to terminal 1
    await page.getByText('Terminal 1').click();
    await page.waitForTimeout(1000);

    // Still only 1 xterm instance
    const xtermCountAfter = await terminalContent.locator('.xterm').count();
    expect(xtermCountAfter).toBe(1);

    // Terminal 1 should have restored content
    const restoredContent = await page.locator('.terminal-wrapper .xterm-rows').textContent();
    expect(restoredContent).toBeTruthy();
    expect(restoredContent?.length).toBeGreaterThan(0);
  });
});
