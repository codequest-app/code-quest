import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../test/story-decorator';
import { ResumeSessionsDropdown } from './ResumeSessionsDropdown';

const meta = {
  component: ResumeSessionsDropdown,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: fn() },
  decorators: [withStoryApp({ className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof ResumeSessionsDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSessions: Story = {};
export const FilteredByCwd: Story = { args: { cwd: '/Users/demo/cc-office' } };
export const Closed: Story = { args: { open: false } };
