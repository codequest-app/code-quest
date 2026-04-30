import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Message } from '../../../types/ui';
import type { MessageNode } from '../../../utils/message-tree';
import { MessageNodeList } from './MessageNodeList';

const t = Date.now();
const nodes: MessageNode[] = [
  {
    message: { id: '1', role: 'user', timestamp: t, type: 'text', content: 'Hey!' } as Message,
    children: [],
  },
  {
    message: {
      id: '2',
      role: 'assistant',
      timestamp: t + 1,
      type: 'text',
      content: 'Hello. Working on it…',
    } as Message,
    children: [],
  },
  {
    message: {
      id: '3',
      role: 'assistant',
      timestamp: t + 2,
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 'tu1', name: 'Read', input: { path: '/a' } },
    } as Message,
    children: [],
  },
];

const meta: Meta<typeof MessageNodeList> = {
  component: MessageNodeList,
  tags: ['autodocs'],
  args: { prevRole: null, onRewind: fn(), onFork: fn(), onStopTask: fn(), onDiffRespond: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageNodeList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { nodes } };
export const Empty: Story = { args: { nodes: [] } };

export const WithToolResult: Story = {
  args: {
    nodes: [
      ...nodes,
      {
        message: {
          id: '4',
          role: 'assistant',
          timestamp: t + 3,
          type: 'tool_result',
          content: 'export function hello() { return "world"; }',
          meta: { toolId: 'tu1', name: 'Read' },
        } as Message,
        children: [],
      },
      {
        message: {
          id: '5',
          role: 'assistant',
          timestamp: t + 4,
          type: 'text',
          content: 'Found the function. It looks correct.',
        } as Message,
        children: [],
      },
    ],
  },
};
