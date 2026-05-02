import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '@/test/story-decorator';
import { CreateWorktreeDialog } from './CreateWorktreeDialog.tsx';

const meta: Meta<typeof CreateWorktreeDialog> = {
  component: CreateWorktreeDialog,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [withStoryApp({ className: 'bg-surface text-text min-h-screen' })],
} satisfies Meta<typeof CreateWorktreeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false, cwd: '/repo' },
};

export const Open: Story = {
  args: { open: true, cwd: '/repo' },
};

export const LongPath: Story = {
  args: { open: true, cwd: '/Users/demo/projects/very-long-project-name/nested/deep' },
};
