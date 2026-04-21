/**
 * App shell composition stories.
 *
 * Note: we do NOT render `<App />` directly — it calls `createSocket()` to
 * connect to a real backend, which is incompatible with Storybook. Instead we
 * mirror its provider stack via `withStoryWorkspaceFixtures`, plus the
 * `<Toaster />` and `<ErrorBoundary>` wrappers. Tracked in design.md
 * "Decision: App.stories renders real <App />" — this is the documented
 * fallback.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/ErrorFallback';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { makeSession, makeWorktreeSession } from './test/story-fixtures';
import { withStoryWorkspaceFixtures } from './test/story-workspace-decorator';

function AppShell() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <WorkspaceLayout />
      </ErrorBoundary>
    </>
  );
}

const meta = {
  title: 'App/Shell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultShell: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeSession()],
    }),
  ],
};

export const EmptyShell: Story = {
  decorators: [withStoryWorkspaceFixtures()],
};

export const WorktreeShell: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeSession(), makeWorktreeSession()],
      capabilities: { worktree: true },
    }),
  ],
};
