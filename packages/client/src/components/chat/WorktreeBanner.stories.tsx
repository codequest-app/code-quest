import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../test/story-decorator';
import { WorktreeBanner } from './WorktreeBanner';

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
};
