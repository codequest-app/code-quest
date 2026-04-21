import type { Meta, StoryObj } from '@storybook/react-vite';
import { makeSession, makeWorktreeSession } from '../test/story-fixtures';
import { withStoryWorkspaceFixtures } from '../test/story-workspace-decorator';
import { WorkspaceLayout } from './WorkspaceLayout';

const meta = {
  component: WorkspaceLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No sessions → onboarding EmptyState with "Add Project". */
export const EmptyProject: Story = {
  decorators: [withStoryWorkspaceFixtures()],
};

/** One active session → sidebar + TabBar + ChatPanel composition. */
export const ActiveChat: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeSession()],
    }),
  ],
};

/**
 * Pending permission overlay — demonstrated via an active session.
 * The actual ToolPermissionCard is covered in-depth by `ToolPermissionCard.stories.tsx`;
 * this story shows where it lives inside the shell.
 */
export const WithPendingPermission: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeSession({ title: 'Pending permission demo' })],
    }),
  ],
};

/** Worktree-enabled session — sidebar shows worktree-aware chrome. */
export const WithWorktree: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeWorktreeSession()],
      capabilities: { worktree: true },
    }),
  ],
};
