import type { PendingControl } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { ChannelProvider, useChannelControl } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { PendingActionBanner } from './PendingActionBanner';

function SetControls({
  controls,
  children,
}: {
  controls: PendingControl[];
  children: React.ReactNode;
}) {
  const { setPendingControls } = useChannelControl();
  useEffect(() => {
    setPendingControls(() => controls);
  }, [controls, setPendingControls]);
  return <>{children}</>;
}

function withChannel(pendingControls: PendingControl[]) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider channelId="story">
                <SetControls controls={pendingControls}>
                  <div className="max-w-3xl bg-surface text-text p-6">
                    <Story />
                  </div>
                </SetControls>
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}

const meta = {
  component: PendingActionBanner,
  tags: ['autodocs'],
} satisfies Meta<typeof PendingActionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoPending: Story = {
  decorators: [withChannel([])],
};

export const WithToolName: Story = {
  decorators: [withChannel([{ requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' }])],
};

export const WithoutToolName: Story = {
  decorators: [withChannel([{ requestId: 'r2', subtype: 'permission_request' }])],
};

export const WithInput: Story = {
  decorators: [
    withChannel([
      {
        requestId: 'r1',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: { command: 'rm -rf /', description: 'Delete everything' },
      },
    ]),
  ],
};

export const HookCallback: Story = {
  decorators: [withChannel([{ requestId: 'r1', subtype: 'hook_callback', toolName: 'Bash' }])],
};

export const AskUserQuestionSingle: Story = {
  decorators: [
    withChannel([
      {
        requestId: 'r1',
        subtype: 'can_use_tool',
        toolName: 'AskUserQuestion',
        input: {
          questions: [
            {
              question: 'Which testing framework do you prefer?',
              header: 'Testing',
              options: [
                { label: 'Vitest', description: 'Fast, Vite-native test runner' },
                { label: 'Jest', description: 'Popular, feature-rich' },
                { label: 'Mocha', description: 'Flexible, mature' },
              ],
              multiSelect: false,
            },
          ],
        },
      },
    ]),
  ],
};

export const AskUserQuestionMulti: Story = {
  decorators: [
    withChannel([
      {
        requestId: 'r1',
        subtype: 'can_use_tool',
        toolName: 'AskUserQuestion',
        input: {
          questions: [
            {
              question: 'Which framework?',
              header: 'Framework',
              options: [
                { label: 'React', description: 'Component-based UI' },
                { label: 'Vue', description: 'Progressive framework' },
                { label: 'Svelte', description: 'Compiler-based' },
              ],
              multiSelect: false,
            },
            {
              question: 'Which tools do you need?',
              header: 'Tools',
              options: [
                { label: 'TypeScript', description: 'Type safety' },
                { label: 'ESLint', description: 'Code quality' },
                { label: 'Prettier', description: 'Code formatting' },
              ],
              multiSelect: true,
            },
          ],
        },
      },
    ]),
  ],
};
