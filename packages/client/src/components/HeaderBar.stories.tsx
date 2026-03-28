import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import type { ChannelInitialState } from '../types/chat';
import { HeaderBar } from './HeaderBar';

function withChannel(initialState?: ChannelInitialState) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider
                channelId="abc-12345"
                initialState={{
                  availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
                  ...initialState,
                }}
              >
                <div className="bg-bg text-text">
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
  component: HeaderBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeaderBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  decorators: [withChannel({ status: 'idle', model: 'claude-sonnet-4-6' })],
};
export const Disconnected: Story = { decorators: [withChannel({ status: 'disconnected' })] };
export const Processing: Story = {
  decorators: [withChannel({ status: 'processing', model: 'claude-sonnet-4-6' })],
};
export const WithTitle: Story = {
  args: { title: 'Fix login bug' },
  decorators: [withChannel({ status: 'idle', model: 'claude-sonnet-4-6' })],
};
