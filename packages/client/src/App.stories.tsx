// Mirrors <App /> shell (Toaster + ErrorBoundary + WorkspaceLayout) without createSocket().
// For workspace-state variants see WorkspaceLayout.stories.tsx.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/workspace/ErrorFallback';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { makeSession } from './test/story-fixtures';
import { withStoryWorkspaceFixtures } from './test/story-workspace-decorator';

function AppShell(): React.JSX.Element {
  return (
    <>
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <WorkspaceLayout />
      </ErrorBoundary>
    </>
  );
}

const meta: Meta<typeof AppShell> = {
  title: 'App/Shell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultShell: Story = {
  decorators: [withStoryWorkspaceFixtures({ sessions: [makeSession()] })],
};
