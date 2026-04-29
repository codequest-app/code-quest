import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Message } from '../../../types/ui';
import type { MessageNode } from '../../../utils/message-tree';
import { CollapsibleTimeline } from './CollapsibleTimeline';

const base = { role: 'assistant' as const, timestamp: Date.now() };

function textNode(id: string, content: string): MessageNode {
  return { message: { ...base, id, type: 'text', content } as Message, children: [] };
}

function toolNode(id: string, name: string, isError = false): MessageNode {
  return {
    message: {
      ...base,
      id,
      type: 'tool_use',
      content: name,
      meta: {
        toolId: `tu_${id}`,
        name,
        input: {},
        result: { content: 'done', is_error: isError },
      },
    } as Message,
    children: [],
  };
}

const meta: Meta<typeof CollapsibleTimeline> = {
  component: CollapsibleTimeline,
  tags: ['autodocs'],
  args: { onRewind: fn(), onFork: fn(), onStopTask: fn(), onDiffRespond: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleMessage: Story = {
  args: { nodes: [textNode('1', 'Checking the repo structure…')] },
};

export const MixedTools: Story = {
  args: {
    nodes: [
      textNode('1', 'Starting investigation'),
      toolNode('2', 'Read'),
      toolNode('3', 'Grep'),
      textNode('4', 'Found the bug'),
    ],
  },
};

export const WithError: Story = {
  args: {
    nodes: [toolNode('1', 'Bash'), toolNode('2', 'Read', true), textNode('3', 'Failed')],
  },
};
