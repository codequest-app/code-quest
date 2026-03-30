import type { Meta, StoryObj } from '@storybook/react-vite';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { WorkspaceLayout } from './WorkspaceLayout';

const socket = createSocket();

const meta = {
  component: WorkspaceLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <div className="h-[600px] flex flex-col bg-bg text-text">
                <Story />
              </div>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
