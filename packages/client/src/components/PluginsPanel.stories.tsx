import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SocketProvider } from '../contexts/SocketContext';
import { createFakeClaude } from '../test/fake-claude';
import { PluginsPanel } from './PluginsPanel';

const claude = createFakeClaude();

const meta = {
  component: PluginsPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SocketProvider socket={claude.socket}>
        <div className="bg-bg text-text min-h-[400px]">
          <Story />
        </div>
      </SocketProvider>
    ),
  ],
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
