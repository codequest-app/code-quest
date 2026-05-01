import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '@/test/story-decorator';
import { RemoveProjectConfirmDialog } from './RemoveProjectConfirmDialog';

const meta: Meta<typeof RemoveProjectConfirmDialog> = {
  component: RemoveProjectConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onConfirm: fn(), onClose: fn() },
  decorators: [withStoryApp({ className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof RemoveProjectConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoActiveSessions: Story = {
  args: { open: true, projectName: 'cc-office', activeSessionCount: 0 },
};
export const OneActiveSession: Story = {
  args: { open: true, projectName: 'cc-office', activeSessionCount: 1 },
};
export const MultipleActiveSessions: Story = {
  args: { open: true, projectName: 'cc-office', activeSessionCount: 3 },
};
export const Closed: Story = {
  args: { open: false, projectName: 'cc-office', activeSessionCount: 0 },
};
