import { type ConsoleMessage, expect, test } from '@playwright/test';

/**
 * E2E: Orchestrator Battle overlay flow (JSONL fixture)
 *
 * Requires: MOCK_CLI=true MOCK_SCENARIO=fixture MOCK_FIXTURE=e2e/fixtures/fixtures/claude-rpg-battle.jsonl
 *
 * Run:
 *   MOCK_CLI=true MOCK_SCENARIO=fixture \
 *   MOCK_FIXTURE=e2e/fixtures/fixtures/claude-rpg-battle.jsonl \
 *   pnpm test:e2e:mock -- --grep "Orchestrator Battle"
 */

const hasFixture = process.env.MOCK_SCENARIO === 'fixture' && !!process.env.MOCK_FIXTURE;
const maybeDescribe = hasFixture ? test.describe : test.describe.skip;

/** Navigate to TaskPlanner: click Orchestrator → Plan Tasks → wait for planner */
async function navigateToTaskPlanner(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /orchestrator/i }).click();
  await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /plan tasks/i }).click();
  await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 30000 });
}

maybeDescribe('Orchestrator Battle Flow (JSONL fixture)', () => {
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

  test('worker battle shows skill and damage log entries', async ({ page }) => {
    await navigateToTaskPlanner(page);

    await page.getByLabel('Task 1 description').fill('fix the login bug in auth.ts');
    await page.getByRole('button', { name: /dispatch/i }).click();

    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 15000 });

    // Battle overlay with skill and damage entries
    await expect(workerPane.locator('[data-testid="battle-overlay"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(workerPane.locator('.battle-log-entry.log-skill')).toBeVisible({
      timeout: 15000,
    });
    await expect(workerPane.locator('.battle-log-entry.log-damage')).toBeVisible({
      timeout: 15000,
    });
  });

  test('worker battle ends with victory on result event', async ({ page }) => {
    await navigateToTaskPlanner(page);

    await page.getByLabel('Task 1 description').fill('fix the login bug in auth.ts');
    await page.getByRole('button', { name: /dispatch/i }).click();

    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 15000 });

    // Victory log entry and fading overlay
    await expect(workerPane.locator('.battle-log-entry.log-victory')).toBeVisible({
      timeout: 20000,
    });
    await expect(workerPane.locator('[data-testid="battle-overlay"]')).toContainText('勝利', {
      timeout: 5000,
    });
    await expect(workerPane.locator('.battle-overlay-fading')).toBeVisible({ timeout: 5000 });
  });
});
