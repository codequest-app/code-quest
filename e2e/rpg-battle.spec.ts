import { type ConsoleMessage, expect, test } from '@playwright/test';

/**
 * E2E: RPG Battle overlay flow
 *
 * Requires: MOCK_CLI=true MOCK_SCENARIO=fixture MOCK_FIXTURE=e2e/fixtures/fixtures/claude-rpg-battle.jsonl
 *
 * The fixture replays: thinking → Read(tool_use) → Edit(tool_use) → text → result
 * which drives the full battle lifecycle: start → stasis → skill/damage → victory → fade
 *
 * Run:
 *   MOCK_CLI=true MOCK_SCENARIO=fixture \
 *   MOCK_FIXTURE=e2e/fixtures/fixtures/claude-rpg-battle.jsonl \
 *   pnpm test:e2e:mock -- --grep "RPG Battle"
 */

const hasFixture = process.env.MOCK_SCENARIO === 'fixture' && !!process.env.MOCK_FIXTURE;
const maybeDescribe = hasFixture ? test.describe : test.describe.skip;

maybeDescribe('RPG Battle Flow (JSONL fixture)', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('battle overlay appears with enemy on user message', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('fix the login bug in auth.ts');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.locator('[data-testid="battle-overlay"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="enemy-display"]')).toBeVisible({ timeout: 5000 });
  });

  test('tool_use events produce skill and damage log entries', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('fix the login bug in auth.ts');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.locator('[data-testid="battle-overlay"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.battle-log-entry.log-skill')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.battle-log-entry.log-damage')).toBeVisible({ timeout: 15000 });
  });

  test('result triggers victory message and overlay fades', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('fix the login bug in auth.ts');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.locator('.battle-log-entry.log-victory')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="battle-overlay"]')).toContainText('勝利', {
      timeout: 5000,
    });
    await expect(page.locator('.battle-overlay-fading')).toBeVisible({ timeout: 5000 });
  });

  test('model indicator displays based on prompt complexity', async ({ page }) => {
    await page.getByRole('button', { name: /claude/i }).click();
    await expect(page.getByText('Claude 1')).toBeVisible({ timeout: 5000 });

    const textarea = page.getByLabel('Message input');
    await expect(textarea).toBeVisible({ timeout: 3000 });
    await textarea.fill('fix the login bug');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.locator('[data-testid="model-indicator"]')).toBeVisible({ timeout: 10000 });
  });
});
