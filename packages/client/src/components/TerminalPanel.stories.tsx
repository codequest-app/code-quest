import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import type { ChannelInitialState } from '../types/chat';
import { TerminalPanel } from './TerminalPanel';

function withChannel(terminalSessions: ChannelInitialState['terminalSessions']) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="story" initialState={{ terminalSessions }}>
                <div className="h-[400px] w-72 bg-bg text-text">
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

const meta = { component: TerminalPanel, tags: ['autodocs'] } satisfies Meta<typeof TerminalPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithSession: Story = {
  decorators: [
    withChannel({
      s1: { id: 's1', title: 'Terminal 1', outputLines: ['$ git status', 'On branch main'] },
    }),
  ],
};
export const Empty: Story = { decorators: [withChannel({})] };
