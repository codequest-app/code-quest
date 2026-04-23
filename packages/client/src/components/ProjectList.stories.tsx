import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Project } from '../contexts/ProjectContext';
import { withStoryApp } from '../test/story-decorator';
import { ProjectList } from './ProjectList';

const projects: Project[] = [
  {
    name: 'cc-office',
    cwd: '/Users/demo/cc-office',
    pinned: true,
    lastOpenedAt: '2025-01-03T10:00:00Z',
  },
  {
    name: 'anthropic-sdk',
    cwd: '/Users/demo/anthropic-sdk',
    pinned: false,
    lastOpenedAt: '2025-01-02T10:00:00Z',
  },
  {
    name: 'blog',
    cwd: '/Users/demo/blog',
    pinned: false,
    lastOpenedAt: '2025-01-01T10:00:00Z',
  },
];

const meta = {
  component: ProjectList,
  tags: ['autodocs'],
  args: { onSelect: fn(), onAdd: fn() },
  decorators: [withStoryApp({ className: 'w-70 h-90 bg-bg text-text' })],
} satisfies Meta<typeof ProjectList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { projects, activeProjectCwd: '/Users/demo/cc-office' },
};
export const NoActive: Story = { args: { projects, activeProjectCwd: null } };
export const Empty: Story = { args: { projects: [], activeProjectCwd: null } };
