import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { CommandMenu } from './CommandMenu';

const meta = {
  component: CommandMenu,
  tags: ['autodocs'],
  args: {
    onMcpStatus: fn(),
    onToggleMcp: fn(),
    onManagePlugins: fn(),
    onAttachFile: fn(),
  },
  decorators: [
    withStoryChannel({
      className: 'relative h-[400px] bg-bg text-text flex items-end p-4',
    }),
  ],
} satisfies Meta<typeof CommandMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAllCallbacks: Story = {
  args: {
    onMcpStatus: fn(),
    onToggleMcp: fn(),
    onManagePlugins: fn(),
    onAttachFile: fn(),
  },
};
