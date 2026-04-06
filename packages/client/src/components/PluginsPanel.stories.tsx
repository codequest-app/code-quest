import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { PluginsPanel } from './PluginsPanel';

const meta = {
  component: PluginsPanel,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'bg-bg text-text min-h-[400px]' })],
} satisfies Meta<typeof PluginsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPlugins: Story = {
  args: {
    open: true,
    onClose: fn(),
  },
};

export const Empty: Story = {
  args: {
    open: true,
    onClose: fn(),
  },
};
