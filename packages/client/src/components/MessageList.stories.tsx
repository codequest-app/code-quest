import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import type { Message } from '../types/ui';
import { MessageList } from './MessageList';

const conversation: Message[] = [
  { id: '1', role: 'user', type: 'text', content: 'How do I list files?', timestamp: 1 },
  {
    id: '2',
    role: 'assistant',
    type: 'thinking',
    content: 'The user wants to list files in a directory...',
    timestamp: 2,
  },
  {
    id: '3',
    role: 'assistant',
    type: 'tool_use',
    content: 'bash',
    meta: { toolId: 't1', input: { command: 'ls -la' } },
    timestamp: 3,
  },
  {
    id: '4',
    role: 'assistant',
    type: 'tool_result',
    content:
      'total 8\n-rw-r--r-- 1 user user 123 Jan 1 main.ts\n-rw-r--r-- 1 user user 456 Jan 1 README.md',
    meta: { toolId: 't1', name: 'bash' },
    timestamp: 4,
  },
  {
    id: '5',
    role: 'assistant',
    type: 'text',
    content: 'Here are the files:\n\n- `main.ts`\n- `README.md`',
    timestamp: 5,
  },
  { id: '6', role: 'user', type: 'text', content: 'Thanks! Can you read main.ts?', timestamp: 6 },
  {
    id: '7',
    role: 'assistant',
    type: 'text',
    content: 'Sure, let me read it for you.',
    timestamp: 7,
  },
];

const meta = {
  component: MessageList,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  decorators: [
    withStoryChannel({ messages: { messages: [] }, className: 'h-[500px] bg-bg text-text' }),
  ],
};

export const Conversation: Story = {
  decorators: [
    withStoryChannel({
      messages: { messages: conversation },
      className: 'h-[500px] bg-bg text-text',
    }),
  ],
};

export const WithError: Story = {
  decorators: [
    withStoryChannel({
      messages: {
        messages: [
          ...conversation,
          { id: '8', role: 'system', type: 'error', content: 'Connection lost', timestamp: 8 },
        ],
      },
      className: 'h-[500px] bg-bg text-text',
    }),
  ],
};

const withSubagent: Message[] = [
  { id: '1', role: 'user', type: 'text', content: 'Run subagent', timestamp: 1 },
  {
    id: '2',
    role: 'assistant',
    type: 'tool_use',
    content: 'Task',
    meta: { toolId: 'task-1', input: {} },
    timestamp: 2,
  },
  {
    id: '3',
    role: 'assistant',
    type: 'text',
    content: 'Subagent result',
    timestamp: 3,
    parentToolUseId: 'task-1',
  },
];

export const WithSubagent: Story = {
  decorators: [
    withStoryChannel({
      messages: { messages: withSubagent },
      className: 'h-[500px] bg-bg text-text',
    }),
  ],
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByText(/subagent message/i);
    await expect(toggle).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(canvas.queryByText('Subagent result')).toBeNull();
    await userEvent.click(toggle);
    await expect(canvas.getByText('Subagent result')).toBeInTheDocument();
  },
};
