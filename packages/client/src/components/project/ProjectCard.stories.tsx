import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../../test/story-decorator';
import { ProjectCard } from './ProjectCard';

const meta: Meta<typeof ProjectCard> = {
  component: ProjectCard,
  tags: ['autodocs'],
  args: { onSelect: fn() },
  decorators: [withStoryApp({ className: 'w-65 bg-bg text-text' })],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  args: { name: 'cc-office', cwd: '/Users/demo/cc-office', active: false },
};
export const Active: Story = {
  args: { name: 'cc-office', cwd: '/Users/demo/cc-office', active: true },
};
export const NoCwd: Story = {
  args: { name: 'ephemeral', active: false },
};
export const LongName: Story = {
  args: {
    name: 'some-extremely-long-project-name-that-might-truncate',
    cwd: '/x',
    active: false,
  },
};
