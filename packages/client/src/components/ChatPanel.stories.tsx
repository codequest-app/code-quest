import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { ChatPanel } from './ChatPanel';

const socket = createSocket();

const meta = {
  component: ChatPanel,
  tags: ['autodocs'],
  args: {
    joinSession: fn(),
    toggleHistory: fn(),
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story-session">
                  <div className="h-[600px] bg-bg text-text">
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
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SendMessage: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'Hello Claude');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Hello Claude')).toBeInTheDocument();
  },
};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};

export const Processing: Story = {};
