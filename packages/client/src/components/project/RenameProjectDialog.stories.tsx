import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '@/test/story-decorator';
import { RenameProjectDialog } from './RenameProjectDialog.tsx';

const meta: Meta<typeof RenameProjectDialog> = {
  component: RenameProjectDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onRename: fn(), onClose: fn() },
  decorators: [withStoryApp({ className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof RenameProjectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { args: { open: true, currentName: 'cc-office' } };
export const LongName: Story = {
  args: { open: true, currentName: 'very-long-project-name-that-might-overflow-the-dialog' },
};
export const Closed: Story = { args: { open: false, currentName: 'cc-office' } };
