import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { PluginsPanel } from './PluginsPanel';

const meta = {
  component: PluginsPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const socket = createSocket();
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story">
                  <div className="bg-bg text-text min-h-[400px]">
                    <Story />
                  </div>
                </ChannelProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>
      );
    },
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
