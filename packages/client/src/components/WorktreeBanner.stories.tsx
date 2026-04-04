import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorktreeBanner } from './WorktreeBanner';

const meta = {
  component: WorktreeBanner,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xl bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorktreeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    worktree: { name: 'feature-auth', path: '/repo/.claude/worktrees/feature-auth' },
  },
};
