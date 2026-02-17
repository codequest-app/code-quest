import { expect, test } from '@playwright/test';

test.describe('Orchestrator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for socket connection
    await expect(page.getByTestId('connection-status')).toHaveText('Connected', { timeout: 10000 });
  });

  test('should create orchestrator tab via button click', async ({ page }) => {
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByText('Orchestrator 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('orchestrator-page')).toBeVisible();
  });

  test('should show planning view with chat and Plan Tasks button', async ({ page }) => {
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('chat-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /plan tasks/i })).toBeVisible();
  });

  test('should transition to task planner after Plan Tasks', async ({ page }) => {
    test.slow(); // Mock CLI cold-start can be slow
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });

    // Click Plan Tasks → sends prompt to coordinator → mock echoes back → TaskPlanner appears
    await page.getByRole('button', { name: /plan tasks/i }).click();
    await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 45000 });
    await expect(page.getByLabel('Task 1 description')).toBeVisible();
    await expect(page.getByLabel('Add task')).toBeVisible();
  });

  test('should keep other tabs working alongside orchestrator', async ({ page }) => {
    // Create a terminal tab first
    await page.getByRole('button', { name: /^\+ Terminal$/ }).click();
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 5000 });

    // Create orchestrator tab
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByText('Orchestrator 1')).toBeVisible({ timeout: 5000 });

    // Switch back to terminal
    await page.getByText('Terminal 1').click();
    await expect(page.getByTestId('orchestrator-page')).not.toBeVisible();

    // Switch to orchestrator
    await page.getByText('Orchestrator 1').click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible();
  });

  test('dispatch single worker and receive response', async ({ page }) => {
    test.slow(); // Mock CLI + worktree setup can be slow
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });

    // Navigate to TaskPlanner via Plan Tasks flow
    await page.getByRole('button', { name: /plan tasks/i }).click();
    await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 45000 });

    // Remove pre-filled tasks 3 and 2, keep only task 1
    await page.getByLabel('Remove task 3').click();
    await page.getByLabel('Remove task 2').click();

    // Fill task description and dispatch
    const taskInput = page.getByLabel('Task 1 description');
    await taskInput.fill('Hello from orchestrator E2E');
    await page.getByRole('button', { name: /dispatch/i }).click();

    // Worker grid and pane should appear
    await expect(page.getByTestId('worker-grid')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid^="worker-pane-"]').first()).toBeVisible({
      timeout: 15000,
    });

    // Worker should receive streamed echo response
    await expect(page.locator('[data-testid="stream-output"]').first()).toContainText(
      'Hello from orchestrator E2E',
      { timeout: 30000 },
    );
  });

  test('dispatch pre-filled tasks and all workers receive responses', async ({ page }) => {
    test.slow();
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });

    // Navigate to TaskPlanner — mock returns 3 pre-filled tasks
    await page.getByRole('button', { name: /plan tasks/i }).click();
    await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 45000 });

    // Verify pre-filled tasks are present
    await expect(page.getByLabel('Task 1 description')).toHaveValue(/Refactor authentication/);
    await expect(page.getByLabel('Task 2 description')).toHaveValue(/unit tests/);
    await expect(page.getByLabel('Task 3 description')).toHaveValue(/API documentation/);

    // Dispatch all pre-filled tasks
    await page.getByRole('button', { name: /dispatch 3 tasks/i }).click();

    // All worker panes should appear (wave 1: task 1, wave 2: tasks 2+3)
    await expect(page.getByTestId('worker-grid')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid^="worker-pane-"]').first()).toBeVisible({
      timeout: 15000,
    });

    // First worker should have battle overlay
    const firstPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(firstPane.locator('[data-testid="battle-overlay"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test('battle overlay appears in worker pane', async ({ page }) => {
    test.slow();
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-page')).toBeVisible({ timeout: 5000 });

    // Navigate to TaskPlanner
    await page.getByRole('button', { name: /plan tasks/i }).click();
    await expect(page.getByTestId('task-planner')).toBeVisible({ timeout: 45000 });

    // Remove extra tasks, keep one
    await page.getByLabel('Remove task 3').click();
    await page.getByLabel('Remove task 2').click();
    await page.getByLabel('Task 1 description').fill('Fix the auth bug');
    await page.getByRole('button', { name: /dispatch/i }).click();

    // Worker pane should appear
    const workerPane = page.locator('[data-testid^="worker-pane-"]').first();
    await expect(workerPane).toBeVisible({ timeout: 30000 });

    // Battle overlay should appear inside worker pane
    await expect(workerPane.locator('[data-testid="battle-overlay"]')).toBeVisible({
      timeout: 30000,
    });
    await expect(workerPane.locator('[data-testid="enemy-display"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
