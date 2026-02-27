import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Message } from '../types/ui';
import { MessageList } from './MessageList';

const sampleMessages: Message[] = [
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
    content: 'Here are the files in your directory:\n\n- `main.ts`\n- `README.md`',
    timestamp: 5,
  },
];

const meta = {
  component: MessageList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px] h-[400px] bg-bg text-text overflow-auto">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { messages: [] },
};

export const Conversation: Story = {
  args: { messages: sampleMessages },
};

export const WithError: Story = {
  args: {
    messages: [
      ...sampleMessages,
      { id: '6', role: 'system', type: 'error', content: 'Connection lost', timestamp: 6 },
    ],
  },
};
