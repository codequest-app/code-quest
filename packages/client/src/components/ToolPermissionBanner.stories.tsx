import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { ToolPermissionBanner } from './ToolPermissionBanner';

const meta = {
  component: ToolPermissionBanner,
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
                  <div className="max-w-lg bg-bg text-text p-4">
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
  args: { onRespond: fn() },
} satisfies Meta<typeof ToolPermissionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BashPermission: Story = {
  args: {
    pending: {
      requestId: 'req-1',
      subtype: 'can_use_tool',
      toolName: 'Bash',
      input: { command: 'rm -rf /tmp/build', description: 'Remove build artifacts' },
    },
  },
};

export const ReadPermission: Story = {
  args: {
    pending: {
      requestId: 'req-2',
      subtype: 'can_use_tool',
      toolName: 'Read',
      input: { file_path: '/src/components/App.tsx' },
    },
  },
};

export const WithPermissionSuggestions: Story = {
  args: {
    pending: {
      requestId: 'req-3',
      subtype: 'can_use_tool',
      toolName: 'Bash',
      input: { command: 'npm test' },
      permissionSuggestions: [{ tool: 'Bash', rule: 'npm test' }],
    },
  },
};

export const EmptyInput: Story = {
  args: {
    pending: {
      requestId: 'req-4',
      subtype: 'can_use_tool',
      toolName: 'CustomTool',
      input: {},
    },
  },
};

export const WriteWithLargeInput: Story = {
  args: {
    pending: {
      requestId: 'req-5',
      subtype: 'can_use_tool',
      toolName: 'Write',
      input: {
        file_path: '/src/components/VeryLongComponentName.tsx',
        content: 'export function VeryLongComponentName() {\n  return <div>Hello</div>;\n}\n',
      },
    },
  },
};
