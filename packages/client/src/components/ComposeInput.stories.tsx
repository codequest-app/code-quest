import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import type { ChannelInitialState } from '../types/chat';
import { ChatInputArea } from './ChatInputArea';

function withChannel(initialState?: ChannelInitialState) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="story" initialState={initialState}>
                <div className="max-w-3xl bg-bg text-text p-6">
                  <Story />
                </div>
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}

const meta = {
  component: ChatInputArea,
  tags: ['autodocs'],
  args: { toggleHistory: () => {} },
} satisfies Meta<typeof ChatInputArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [withChannel()] };
export const WithSlashCommands: Story = {
  decorators: [withChannel({ slashCommands: ['compact', 'cost', 'review'] })],
};
export const Processing: Story = { decorators: [withChannel({ status: 'processing' })] };
