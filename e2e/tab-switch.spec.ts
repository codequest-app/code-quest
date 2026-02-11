import { test, expect } from '@playwright/test';

test.describe('Terminal Tab Switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should preserve terminal DOM when switching tabs', async ({ page }) => {
    // Create terminal 1
    await page.getByRole('button', { name: /new/i }).click();
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    // Wait for terminal 1 output
    const terminalContent = page.locator('.terminal-content');
    await expect(terminalContent.locator('.xterm-rows').first()).not.toBeEmpty({ timeout: 5000 });

    // Count xterm instances before creating terminal 2
    const xtermCountBefore = await terminalContent.locator('.xterm').count();
    expect(xtermCountBefore).toBe(1);

    // Create terminal 2
    await page.getByRole('button', { name: /new/i }).click();
    await expect(page.getByText('Terminal 2')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Both xterm instances should exist in DOM (one hidden, one visible)
    const xtermCountAfter = await terminalContent.locator('.xterm').count();
    expect(xtermCountAfter).toBe(2);

    // Switch back to terminal 1
    await page.getByText('Terminal 1').click();
    await page.waitForTimeout(500);

    // Both should still exist
    const xtermCountSwitch = await terminalContent.locator('.xterm').count();
    expect(xtermCountSwitch).toBe(2);

    // The visible terminal should have content (not re-created)
    const visibleWrapper = terminalContent.locator('.terminal-wrapper:not([style*="display: none"])');
    const visibleRows = visibleWrapper.locator('.xterm-rows');
    const content = await visibleRows.textContent();
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);
  });
});
