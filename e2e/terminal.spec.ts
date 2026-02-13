import { expect, test } from '@playwright/test';

/**
 * E2E Test: Terminal creation and output display
 */
test.describe('Terminal E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display shell output after clicking New button', async ({ page }) => {
    // Wait for socket connection
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Click "New" button
    await page.getByRole('button', { name: /terminal/i }).click();

    // Wait for terminal tab to appear
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    // Check visible terminal
    const visibleTerminal = page.locator('.terminal-wrapper');
    await expect(visibleTerminal.locator('.xterm-screen')).toBeVisible({ timeout: 3000 });

    // Wait for shell output
    const xtermRows = visibleTerminal.locator('.xterm-rows');
    await expect(xtermRows).not.toBeEmpty({ timeout: 5000 });

    const content = await xtermRows.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(0);

    // Check for common shell indicators
    const hasShellOutput =
      content?.includes('Welcome') ||
      content?.includes('$') ||
      content?.includes('~') ||
      content?.includes('%');

    expect(hasShellOutput).toBe(true);
  });

  test('should handle terminal input and output', async ({ page }) => {
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /terminal/i }).click();
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    const visibleTerminal = page.locator('.terminal-wrapper');
    const xtermRows = visibleTerminal.locator('.xterm-rows');

    // Wait for shell prompt
    await expect(xtermRows).not.toBeEmpty({ timeout: 5000 });

    // Type a command
    await page.keyboard.type('echo "test"');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    const content = await xtermRows.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(0);
  });
});
