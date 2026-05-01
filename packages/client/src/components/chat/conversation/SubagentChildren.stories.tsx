import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Message } from '@/types/ui';
import type { MessageNode } from '@/utils/message-tree';
import { SubagentChildren } from './SubagentChildren';

const t = Date.now();
const nodes: MessageNode[] = [
  {
    message: {
      id: 'c1',
      role: 'assistant',
      timestamp: t,
      type: 'text',
      content: 'Investigating file structure.',
    } as Message,
    children: [],
  },
  {
    message: {
      id: 'c2',
      role: 'assistant',
      timestamp: t + 1,
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 't1', name: 'Grep', input: { pattern: 'foo' } },
    } as Message,
    children: [],
  },
];

const meta: Meta<typeof SubagentChildren> = {
  component: SubagentChildren,
  tags: ['autodocs'],
  args: { onStopTask: fn(), onDiffRespond: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubagentChildren>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { nodes } };
export const WithStopButton: Story = { args: { nodes, parentToolId: 'parent_tool_1' } };
export const SingleChild: Story = { args: { nodes: [nodes[0] as (typeof nodes)[0]] } };
