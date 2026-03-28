import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import type { ChannelInitialState } from '../types/chat';
import { ComposeToolbar } from './ComposeToolbar';

function withChannel(initialState?: ChannelInitialState) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider
                channelId="story"
                initialState={{
                  availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet' }],
                  ...initialState,
                }}
              >
                <div className="max-w-3xl bg-bg text-text p-6 relative">
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

const meta = { component: ComposeToolbar, tags: ['autodocs'] } satisfies Meta<
  typeof ComposeToolbar
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { decorators: [withChannel({ permissionMode: 'normal' })] };
export const Processing: Story = { decorators: [withChannel({ status: 'processing' })] };
export const AcceptEdits: Story = { decorators: [withChannel({ permissionMode: 'acceptEdits' })] };
export const WithUsage: Story = { decorators: [withChannel({ stats: { inputTokens: 120000 } })] };
