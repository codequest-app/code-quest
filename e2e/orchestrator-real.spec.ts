import { expect, test } from '@playwright/test';

/**
 * E2E Test: Real Orchestrator with Gemini CLI
 * Tests the full orchestrator flow: create → dispatch → workers complete → synthesize
 *
 * Run: npx playwright test e2e/orchestrator-real.spec.ts
 */
test.describe
  .serial('Orchestrator Real CLI', () => {
    test.setTimeout(180000); // 3 min timeout for real CLI calls

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
    });

    test('should dispatch single gemini worker, complete, and synthesize', async ({ page }) => {
      // 1. Create orchestrator tab
      await page.getByRole('button', { name: /orchestrator/i }).click();
      await expect(page.getByText('Orchestrator 1')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('orchestrator-panel')).toBeVisible();
      await expect(page.getByTestId('dispatch-form')).toBeVisible();

      // 2. Fill in a task - use Gemini provider
      const taskInput = page.getByLabel('Task 1 description');
      await expect(taskInput).toBeVisible({ timeout: 3000 });
      await taskInput.fill('Say exactly: worker1 done');

      // Change provider to gemini
      await page.getByLabel('Task 1 provider').selectOption('gemini');

      // 3. Click Dispatch
      await page.getByLabel('Dispatch all').click();

      // 4. Worker panel should appear with the worker card
      await expect(page.getByTestId('worker-panel')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Workers (1)')).toBeVisible();
      await expect(page.getByTestId('worker-card')).toBeVisible();

      // 5. Wait for Synthesize button (appears when status = workers-complete)
      await expect(page.getByLabel('Synthesize')).toBeVisible({ timeout: 90000 });

      // Worker card should still be visible with complete status
      await expect(page.getByTestId('worker-card')).toBeVisible();

      await page.screenshot({ path: '/tmp/orchestrator-workers-complete.png' });
      console.log('Workers complete, clicking Synthesize...');

      // 6. Click Synthesize
      await page.getByLabel('Synthesize').click();

      // 7. Coordinator should receive synthesis and show assistant response
      await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({
        timeout: 90000,
      });

      const assistantMsg = page.locator('[data-testid="message-assistant"]').first();
      const text = await assistantMsg.textContent();
      expect(text?.length).toBeGreaterThan(0);
      console.log('Synthesis response:', text?.substring(0, 200));

      // 8. Stats bar should appear on the assistant message
      await expect(page.locator('[data-testid="stats-bar"]')).toBeVisible({ timeout: 10000 });

      // Take final screenshot
      await page.screenshot({ path: '/tmp/orchestrator-synthesized.png' });
    });

    test('should dispatch two gemini workers in parallel', async ({ page }) => {
      // 1. Create orchestrator tab
      await page.getByRole('button', { name: /orchestrator/i }).click();
      await expect(page.getByTestId('orchestrator-panel')).toBeVisible({ timeout: 5000 });

      // 2. Fill task 1
      await page.getByLabel('Task 1 description').fill('Say exactly: result-alpha');
      await page.getByLabel('Task 1 provider').selectOption('gemini');

      // 3. Add second task
      await page.getByLabel('Add task').click();
      await expect(page.getByLabel('Task 2 description')).toBeVisible({ timeout: 3000 });
      await page.getByLabel('Task 2 description').fill('Say exactly: result-beta');
      await page.getByLabel('Task 2 provider').selectOption('gemini');

      // 4. Dispatch
      await page.getByLabel('Dispatch all').click();

      // 5. Should see 2 workers
      await expect(page.getByText('Workers (2)')).toBeVisible({ timeout: 10000 });

      // 6. Wait for all workers to complete (Synthesize button appears)
      await expect(page.getByLabel('Synthesize')).toBeVisible({ timeout: 90000 });

      // Both worker cards should be visible
      const workerCards = page.getByTestId('worker-card');
      expect(await workerCards.count()).toBe(2);

      await page.screenshot({ path: '/tmp/orchestrator-2workers-complete.png' });
      console.log('Both workers complete, clicking Synthesize...');

      // 7. Synthesize
      await page.getByLabel('Synthesize').click();

      // 8. Wait for coordinator synthesis
      await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({
        timeout: 90000,
      });

      const text = await page.locator('[data-testid="message-assistant"]').first().textContent();
      expect(text?.length).toBeGreaterThan(0);
      console.log('Synthesis (2 workers):', text?.substring(0, 200));

      await page.screenshot({ path: '/tmp/orchestrator-2workers-synthesized.png' });
    });
  });
