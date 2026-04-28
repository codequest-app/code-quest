import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../test/story-decorator';
import { SessionHistoryPopover } from './SessionHistoryPopover';

const meta: Meta<typeof SessionHistoryPopover> = {
  component: SessionHistoryPopover,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: fn(), onResumed: fn() },
  decorators: [withStoryApp({ className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof SessionHistoryPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSessions: Story = {};
export const FilteredByCwd: Story = { args: { cwd: '/Users/demo/cc-office' } };
