import { expect, test } from '@playwright/test';

/**
 * E2E: Orchestrator Battle — tests battle overlay progression in worker panes.
 *
 * Uses MOCK_CLI=true (echo mode) which emits tool_use events to drive battle.
 * Run: pnpm test:e2e:mock -- --grep "Orchestrator Battle"
 */

/** Navigate to orchestrator → Plan Tasks → TaskPlanner */
async function navigateToTaskPlanner(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId('connection-status')).toHaveText('Connected', { timeout: 10000 });
  await page.getByRole('button', { name: /orchestrator/i }).click();
  await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /plan tasks/i }).click();
  await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 45000 });
}

/** Dispatch a single task (removes pre-filled tasks 2 and 3) */
async function dispatchSingleTask(page: import('@playwright/test').Page, description: string) {
  await page.getByLabel('Remove task 3').click();
  await page.getByLabel('Remove task 2').click();
  await page.getByLabel('Task 1 description').fill(description);
  await page.getByRole('button', { name: /dispatch/i }).click();
}

test.describe('Orchestrator Battle', () => {
  test('single worker battle shows skill casts and damage in log', async ({ page }) => {
    test.slow();
    await navigateToTaskPlanner(page);
    await dispatchSingleTask(page, 'Fix the auth bug');

    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 30000 });

    const battleOverlay = workerPane.locator('[data-testid="battle-overlay"]');
    await expect(battleOverlay).toBeVisible({ timeout: 30000 });

    // Battle log should contain skill cast entries (from tool_use events)
    const battleLog = battleOverlay.locator('[data-testid="battle-log"]');
    await expect(battleLog.locator('.log-skill').first()).toBeVisible({ timeout: 30000 });

    // Battle log should contain damage entries
    await expect(battleLog.locator('.log-damage').first()).toBeVisible({ timeout: 30000 });
  });

  test('single worker battle ends with victory', async ({ page }) => {
    test.slow();
    await navigateToTaskPlanner(page);
    await dispatchSingleTask(page, 'Fix the auth bug');

    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 30000 });

    const battleOverlay = workerPane.locator('[data-testid="battle-overlay"]');
    await expect(battleOverlay).toBeVisible({ timeout: 30000 });

    // Battle log should show victory
    const battleLog = battleOverlay.locator('[data-testid="battle-log"]');
    await expect(battleLog.locator('.log-victory')).toBeVisible({ timeout: 30000 });

    // Message box should show victory text
    const messageBox = battleOverlay.locator('[data-testid="message-box"]');
    await expect(messageBox).toContainText('勝利', { timeout: 30000 });
  });

  test('battle overlay appears with enemy before stream output', async ({ page }) => {
    test.slow();
    await navigateToTaskPlanner(page);
    await dispatchSingleTask(page, 'Fix the auth bug');

    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 30000 });

    // Battle overlay and enemy should appear
    const battleOverlay = workerPane.locator('[data-testid="battle-overlay"]');
    await expect(battleOverlay).toBeVisible({ timeout: 30000 });
    await expect(battleOverlay.locator('[data-testid="enemy-display"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('all three workers show battle with skills and damage', async ({ page }) => {
    test.slow();
    await navigateToTaskPlanner(page);

    // Dispatch all 3 pre-filled tasks
    await page.getByRole('button', { name: /dispatch 3 tasks/i }).click();
    await expect(page.getByTestId('worker-grid')).toBeVisible({ timeout: 30000 });

    // All 3 worker panes should appear (wave 0: task 1, wave 1: tasks 2+3)
    const workerPanes = page.locator('[data-testid^="worker-pane-"]');
    await expect(workerPanes).toHaveCount(3, { timeout: 60000 });

    // Each worker should have battle log with skill and damage entries
    // (overlay may have faded after victory, so check DOM presence not visibility)
    for (let i = 0; i < 3; i++) {
      const pane = workerPanes.nth(i);
      const battleLog = pane.locator('[data-testid="battle-log"]');
      await expect(battleLog.locator('.log-skill').first()).toBeAttached({ timeout: 60000 });
      await expect(battleLog.locator('.log-damage').first()).toBeAttached({ timeout: 60000 });
    }
  });

  test('all three workers reach victory', async ({ page }) => {
    test.slow();
    await navigateToTaskPlanner(page);

    await page.getByRole('button', { name: /dispatch 3 tasks/i }).click();
    await expect(page.getByTestId('worker-grid')).toBeVisible({ timeout: 30000 });

    const workerPanes = page.locator('[data-testid^="worker-pane-"]');
    await expect(workerPanes).toHaveCount(3, { timeout: 60000 });

    // All workers should reach victory (check DOM presence, overlay may have faded)
    for (let i = 0; i < 3; i++) {
      const pane = workerPanes.nth(i);
      const battleLog = pane.locator('[data-testid="battle-log"]');
      await expect(battleLog.locator('.log-victory')).toBeAttached({ timeout: 60000 });
    }
  });
});
