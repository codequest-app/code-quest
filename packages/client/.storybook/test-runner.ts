import type { TestRunnerConfig } from '@storybook/test-runner';

// Phase 0 goal: smoke test only — detect render crashes after refactor.
// a11y violations are pre-existing debt; tracked as follow-up, not blocking here.
const config: TestRunnerConfig = {
  async preVisit(page) {
    const context = page.context();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  },
};

export default config;
