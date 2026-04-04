import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { ManageMcpDialog } from './ManageMcpDialog';

const meta = {
  component: ManageMcpDialog,
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
} satisfies Meta<typeof ManageMcpDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithServers: Story = {
  args: {
    open: true,
    onClose: fn(),
    servers: [
      { name: 'filesystem', enabled: true, status: 'connected', scope: 'project' },
      { name: 'github', enabled: true, status: 'failed' },
    ],
    onReconnect: fn(),
  },
};
export const Empty: Story = { args: { open: true, onClose: fn(), servers: [] } };
