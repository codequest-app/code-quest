import type { Meta, StoryObj } from '@storybook/react-vite';
import { makeSession, makeWorktreeSession } from '@/test/story-fixtures';
import { withStoryWorkspaceFixtures } from '@/test/story-workspace-decorator';
import { WorkspaceLayout } from './WorkspaceLayout';

const meta: Meta<typeof WorkspaceLayout> = {
  component: WorkspaceLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyProject: Story = {
  decorators: [withStoryWorkspaceFixtures()],
};

export const ActiveChat: Story = {
  decorators: [withStoryWorkspaceFixtures({ sessions: [makeSession()] })],
};

export const WithWorktree: Story = {
  decorators: [
    withStoryWorkspaceFixtures({
      sessions: [makeWorktreeSession()],
      capabilities: { worktree: true },
    }),
  ],
};
