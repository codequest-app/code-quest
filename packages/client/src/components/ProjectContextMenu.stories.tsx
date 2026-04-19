import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../test/story-decorator';
import { ProjectContextMenu } from './ProjectContextMenu';

const meta = {
  component: ProjectContextMenu,
  tags: ['autodocs'],
  args: { x: 80, y: 80, onSelectResume: fn(), onClose: fn() },
  decorators: [withStoryApp({ className: 'relative h-60 bg-bg text-text' })],
} satisfies Meta<typeof ProjectContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResumeOnly: Story = {};
export const WithCreateWorktree: Story = {
  args: { onSelectCreateWorktree: fn() },
};
