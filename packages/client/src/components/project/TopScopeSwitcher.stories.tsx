import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Project } from '@/contexts/ProjectContext';
import { withStoryApp } from '@/test/story-decorator';
import { TopScopeSwitcher } from './TopScopeSwitcher';

const meta: Meta<typeof TopScopeSwitcher> = {
  component: TopScopeSwitcher,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onSelect: fn(), onAddProject: fn() },
  decorators: [withStoryApp({ className: 'min-h-16 bg-bg text-text' })],
} satisfies Meta<typeof TopScopeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProjects: Project[] = [
  { cwd: '/repo/cc-office', name: 'cc-office', pinned: true, lastOpenedAt: '2026-04-20T10:00:00Z' },
  { cwd: '/repo/dq3', name: 'dq3', pinned: true, lastOpenedAt: '2026-04-19T10:00:00Z' },
  { cwd: '/repo/scratch', name: 'scratch', pinned: false, lastOpenedAt: '2026-04-18T10:00:00Z' },
  { cwd: '/repo/old-app', name: 'old-app', pinned: false, lastOpenedAt: '2026-03-01T10:00:00Z' },
];

export const WithActiveProject: Story = {
  args: { projects: sampleProjects, activeProjectCwd: '/repo/cc-office' },
};

export const NoActiveProject: Story = {
  args: { projects: sampleProjects, activeProjectCwd: null },
};

export const SingleProject: Story = {
  args: {
    projects: [sampleProjects[0] as (typeof sampleProjects)[0]],
    activeProjectCwd: '/repo/cc-office',
  },
};

export const NoProjects: Story = {
  args: { projects: [], activeProjectCwd: null },
};
