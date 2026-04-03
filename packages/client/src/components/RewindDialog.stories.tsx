import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createFakeClaude } from '../test/fake-claude';
import { RewindDialog } from './RewindDialog';

const claude = createFakeClaude();

const meta = {
  component: RewindDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SocketProvider socket={claude.socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="story-ch">
                <div className="bg-bg text-text min-h-[400px] flex items-center justify-center">
                  <Story />
                </div>
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof RewindDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    open: true,
    onClose: fn(),
    onSelect: fn(),
  },
};
