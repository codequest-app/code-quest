import * as Popover from '@radix-ui/react-popover';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../../../test/story-decorator';
import { SessionHistoryPopover } from './SessionHistoryPopover';

const meta: Meta<typeof SessionHistoryPopover> = {
  component: SessionHistoryPopover,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: fn(), onResumed: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <Popover.Root open>
        <Popover.Anchor />
        <Story />
      </Popover.Root>
    ),
    withStoryApp({ className: 'h-screen bg-bg text-text' }),
  ],
} satisfies Meta<typeof SessionHistoryPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSessions: Story = {};
export const FilteredByCwd: Story = { args: { cwd: '/Users/demo/cc-office' } };
export const WithCustomProject: Story = { args: { cwd: '/Users/demo/other-project' } };
