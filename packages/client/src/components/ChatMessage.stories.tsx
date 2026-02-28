import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Message } from '../types/ui';
import { ChatMessage } from './ChatMessage';

const base: Omit<Message, 'type' | 'content' | 'meta'> = {
  id: '1',
  role: 'assistant',
  timestamp: Date.now(),
};

const meta = {
  component: ChatMessage,
  tags: ['autodocs'],
  args: { showAvatar: true },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg text-text p-6 font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserText: Story = {
  args: {
    message: { ...base, role: 'user', type: 'text', content: 'Can you help me fix this bug?' },
  },
};

export const AssistantText: Story = {
  args: {
    message: { ...base, type: 'text', content: 'Hello **world**! Here is `inline code`.' },
  },
};

export const TextWithCodeBlock: Story = {
  args: {
    message: {
      ...base,
      type: 'text',
      content:
        'Here is some code:\n\n```typescript\nconst x: number = 42;\nconsole.log(x);\n```\n\nDone!',
    },
  },
};

export const Thinking: Story = {
  args: {
    message: {
      ...base,
      type: 'thinking',
      content: 'Let me analyze the requirements and think through the approach...',
    },
  },
};

export const ToolUse: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_use',
      content: 'bash',
      meta: { toolId: 't1', input: { command: 'ls -la /home' } },
    },
  },
};

export const ToolResult: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content:
        'total 12\ndrwxr-xr-x 3 user user 4096 Jan 1 00:00 .\ndrwxr-xr-x 5 root root 4096 Jan 1 00:00 ..',
      meta: { toolId: 't1', name: 'bash' },
    },
  },
};

export const ErrorMessage: Story = {
  args: {
    message: {
      ...base,
      role: 'system',
      type: 'error',
      content: 'Connection lost: server unreachable',
    },
  },
};

export const ControlRequest: Story = {
  args: {
    message: {
      ...base,
      type: 'control_request',
      content: 'bash',
      meta: { requestId: 'r1', input: { command: 'rm -rf /tmp/old' } },
    },
  },
};

export const WithoutAvatar: Story = {
  args: {
    showAvatar: false,
    message: { ...base, type: 'text', content: 'This is a consecutive message without avatar.' },
  },
};
