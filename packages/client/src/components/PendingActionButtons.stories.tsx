import type { PendingControl } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useChannelControl } from '../contexts/channel';
import { withStoryChannel } from '../test/story-decorator';
import { PendingActionButtons } from './PendingActionButtons';

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

function withPendingControls(pendingControls: PendingControl[]) {
  return (Story: () => React.ReactNode) => (
    <SetControls controls={pendingControls}>
      <Story />
    </SetControls>
  );
}

const meta: Meta<typeof PendingActionButtons> = {
  component: PendingActionButtons,
  tags: ['autodocs'],
} satisfies Meta<typeof PendingActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoPending: Story = {
  decorators: [
    withPendingControls([]),
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const WithToolName: Story = {
  decorators: [
    withPendingControls([{ requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' }]),
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const WithoutToolName: Story = {
  decorators: [
    withPendingControls([{ requestId: 'r2', subtype: 'permission_request' }]),
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const WithInput: Story = {
  decorators: [
    withPendingControls([
      {
        requestId: 'r1',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: { command: 'rm -rf /', description: 'Delete everything' },
      },
    ]),
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const HookCallback: Story = {
  decorators: [
    withPendingControls([{ requestId: 'r1', subtype: 'hook_callback', toolName: 'Bash' }]),
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const AskUserQuestionSingle: Story = {
  decorators: [
    withPendingControls([
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
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};

export const AskUserQuestionMulti: Story = {
  decorators: [
    withPendingControls([
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
    withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' }),
  ],
};
