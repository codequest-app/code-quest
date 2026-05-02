import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withStoryChannel } from '@/test/story-decorator';
import { WorktreeBanner } from './WorktreeBanner.tsx';

const meta: Meta<typeof WorktreeBanner> = {
  component: WorktreeBanner,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'max-w-xl bg-bg text-text' })],
} satisfies Meta<typeof WorktreeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    worktree: { name: 'feature-auth', path: '/repo/.claude/worktrees/feature-auth' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('feature-auth')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /open in new tab/i })).toBeInTheDocument();
  },
};

export const LongName: Story = {
  args: {
    worktree: {
      name: 'refactor-authentication-middleware-for-oauth2-compliance',
      path: '/repo/.claude/worktrees/refactor-authentication-middleware-for-oauth2-compliance',
    },
  },
};

export const ShortName: Story = {
  args: {
    worktree: { name: 'fix', path: '/repo/.claude/worktrees/fix' },
  },
};
