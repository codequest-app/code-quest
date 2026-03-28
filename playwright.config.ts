import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: (() => {
        const mockEnv = Object.entries(process.env)
          .filter(([k]) => k.startsWith('MOCK_'))
          .map(([k, v]) => `${k}=${v}`)
          .join(' ');
        return mockEnv ? `${mockEnv} pnpm --filter server dev` : 'pnpm --filter server dev';
      })(),
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm --filter client dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
