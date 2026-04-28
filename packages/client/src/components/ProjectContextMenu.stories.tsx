import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../test/story-decorator';
import { ProjectDropdownMenu } from './ProjectContextMenu';

const meta: Meta<typeof ProjectDropdownMenu> = {
  component: ProjectDropdownMenu,
  tags: ['autodocs'],
  args: {
    trigger: <button type="button">Open menu</button>,
    onSelectResume: fn(),
  },
  decorators: [withStoryApp({ className: 'relative h-60 bg-bg text-text p-4' })],
} satisfies Meta<typeof ProjectDropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResumeOnly: Story = {};
export const WithCreateWorktree: Story = {
  args: { onSelectCreateWorktree: fn() },
};
