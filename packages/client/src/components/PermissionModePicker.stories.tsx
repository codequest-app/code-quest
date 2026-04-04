import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { PermissionModePicker } from './PermissionModePicker';

const meta = {
  component: PermissionModePicker,
  tags: ['autodocs'],
  args: { onSetPermissionMode: fn(), onSetEffort: fn() },
  decorators: [
    (Story) => {
      const socket = createSocket();
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story">
                  <div className="bg-bg text-text p-4 flex justify-end" style={{ minHeight: 60 }}>
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
} satisfies Meta<typeof PermissionModePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { mode: 'normal', effort: 'high' } };
export const AcceptEdits: Story = { args: { mode: 'acceptEdits', effort: 'max' } };
export const PlanMode: Story = { args: { mode: 'plan', effort: 'medium' } };
export const BypassPermissions: Story = { args: { mode: 'bypassPermissions', effort: 'low' } };
