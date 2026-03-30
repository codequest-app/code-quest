import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { CommandMenu } from './CommandMenu';

const socket = createSocket();

const meta = {
  component: CommandMenu,
  tags: ['autodocs'],
  args: {
    onOpenModelPicker: fn(),
    onOpenAccountUsage: fn(),
    onMcpStatus: fn(),
    onToggleMcp: fn(),
    onManagePlugins: fn(),
    onOpenConfig: fn(),
    onSwitchAccount: fn(),
    onOpenHelp: fn(),
    onResumeConversation: fn(),
    onAttachFile: fn(),
  },
  decorators: [
    (Story) => (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="story-session">
                <div className="relative h-[400px] bg-bg text-text flex items-end p-4">
                  <Story />
                </div>
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof CommandMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAllCallbacks: Story = {
  args: {
    onOpenModelPicker: fn(),
    onOpenAccountUsage: fn(),
    onMcpStatus: fn(),
    onToggleMcp: fn(),
    onManagePlugins: fn(),
    onOpenConfig: fn(),
    onSwitchAccount: fn(),
    onOpenHelp: fn(),
    onResumeConversation: fn(),
    onAttachFile: fn(),
  },
};
