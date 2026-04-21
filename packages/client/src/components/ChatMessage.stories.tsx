import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withThemePreset } from '../test/story-decorator';
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/hello/i)).toBeInTheDocument();
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
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('button', { name: /copy/i }).length).toBeGreaterThan(0);
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/bash/i)).toBeInTheDocument();
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/connection lost/i)).toBeInTheDocument();
  },
};

export const ControlRequest: Story = {
  args: {
    message: {
      ...base,
      type: 'pending_action',
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

export const ToolResultWithName: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content: 'file.txt\nREADME.md',
      meta: { toolId: 't1', name: 'bash' },
    },
  },
};

export const ToolResultWithDiff: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content: [
        '--- a/src/main.ts',
        '+++ b/src/main.ts',
        '@@ -10,4 +10,4 @@',
        '-const old = true;',
        '+const updated = false;',
        ' const keep = 1;',
        ' const also = 2;',
      ].join('\n'),
      meta: { toolId: 't1', name: 'Edit' },
    },
  },
};

export const ContentBlockStartWithType: Story = {
  args: {
    message: {
      ...base,
      type: 'content_block_start',
      content: '',
      meta: { blockType: 'tool_use', index: 0 },
    },
  },
};

export const ContentBlockStartGeneric: Story = {
  args: {
    message: { ...base, type: 'content_block_start', content: '' },
  },
};

export const RateLimitWithOverage: Story = {
  args: {
    message: {
      ...base,
      role: 'system',
      type: 'rate_limit_event',
      content: 'Rate limit: limited',
      meta: {
        rateLimitInfo: {
          status: 'limited',
          rateLimitType: 'requests',
          isUsingOverage: true,
          overageStatus: 'active',
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/rate limit/i)).toBeInTheDocument();
  },
};

export const TaskStartedWithType: Story = {
  args: {
    message: {
      ...base,
      role: 'system',
      type: 'task_started',
      content: 'Running sub-agent for code analysis',
      meta: { taskType: 'local_agent' },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/sub-agent/i)).toBeInTheDocument();
  },
};

export const TaskStartedNoType: Story = {
  args: {
    message: {
      ...base,
      role: 'system',
      type: 'task_started',
      content: 'Starting task',
    },
  },
};

const sampleText: Message = {
  ...base,
  role: 'assistant',
  type: 'text',
  content: 'Here is a sample assistant reply so you can preview the palette + density combo.',
};

export const DarkComfortable: Story = {
  args: { message: sampleText },
  decorators: [withThemePreset({ theme: 'dark', density: 'comfortable' })],
};
export const DarkCompact: Story = {
  args: { message: sampleText },
  decorators: [withThemePreset({ theme: 'dark', density: 'compact' })],
};
export const LightComfortable: Story = {
  args: { message: sampleText },
  decorators: [withThemePreset({ theme: 'light', density: 'comfortable' })],
};
export const LightCompact: Story = {
  args: { message: sampleText },
  decorators: [withThemePreset({ theme: 'light', density: 'compact' })],
};
