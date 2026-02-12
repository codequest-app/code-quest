import { test, expect } from '@playwright/test';

test.describe('Orchestrator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for socket connection
    await expect(page.getByTestId('connection-status')).toHaveText('Connected', { timeout: 10000 });
  });

  test('should create orchestrator tab via button click', async ({ page }) => {
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByText('Orchestrator 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('orchestrator-panel')).toBeVisible();
  });

  test('should show coordinator chat and dispatch form', async ({ page }) => {
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('orchestrator-panel')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('chat-panel')).toBeVisible();
    await expect(page.getByTestId('dispatch-form')).toBeVisible();
  });

  test('should show dispatch form with task input and buttons', async ({ page }) => {
    await page.getByRole('button', { name: /orchestrator/i }).click();
    await expect(page.getByTestId('dispatch-form')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Task 1 description')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Add task')).toBeVisible();
    await expect(page.getByLabel('Dispatch all')).toBeVisible();
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
    // Terminal tab should be active (orchestrator panel hidden)
    await expect(page.getByTestId('orchestrator-panel')).not.toBeVisible();

    // Switch to orchestrator
    await page.getByText('Orchestrator 1').click();
    await expect(page.getByTestId('orchestrator-panel')).toBeVisible();
  });
});
