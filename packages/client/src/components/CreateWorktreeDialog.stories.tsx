import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';

const meta = {
  component: CreateWorktreeDialog,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [
    (Story) => (
      <div className="bg-surface text-text min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateWorktreeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false, cwd: '/repo' },
};

export const Open: Story = {
  args: { open: true, cwd: '/repo' },
};
