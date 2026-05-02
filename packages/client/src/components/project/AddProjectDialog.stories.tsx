import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '@/test/story-decorator';
import { AddProjectDialog } from './AddProjectDialog.tsx';

const meta: Meta<typeof AddProjectDialog> = {
  component: AddProjectDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onSelect: fn(), onClose: fn() },
  decorators: [withStoryApp({ className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof AddProjectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { args: { open: true } };
export const Closed: Story = { args: { open: false } };
export const WithSelect: Story = { args: { open: true } };
