import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import type { Message } from '../types/ui';
import { ChatMessage } from './ChatMessage';

// Use ChatMessage as a wrapper so we get the full rendering context
const meta = {
  title: 'Components/MessageContent',
  component: ChatMessage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg text-text p-6 space-y-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

const base: Omit<Message, 'type' | 'content'> = {
  id: 'msg-1',
  role: 'assistant',
  timestamp: Date.now(),
};

export const TextMessage: Story = {
  args: {
    message: { ...base, type: 'text', content: 'Hello! How can I help you today?' },
  },
};

export const ThinkingMessage: Story = {
  args: {
    message: { ...base, type: 'thinking', content: 'Let me think about this problem...' },
  },
};

export const ToolUseMessage: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_use',
      content: 'Read',
      meta: { input: { file_path: '/src/index.ts' }, toolId: 'tool-1' },
    },
  },
};

export const ToolUseStreaming: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_use',
      content: 'Write',
      meta: {
        partialInput: '{\n  "file_path": "/src/new.ts",\n  "cont...',
        toolId: 'tool-2',
        input: {},
      },
    },
  },
};

export const ToolResultText: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content: 'File contents:\nconst x = 1;\nconst y = 2;',
      meta: { name: 'Read', toolId: 'tool-1' },
    },
  },
};

export const ToolResultDiff: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content:
        '--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,3 +1,3 @@\n-const old = true;\n+const updated = true;\n const unchanged = 1;',
      meta: { name: 'Edit', toolId: 'tool-1' },
    },
  },
};

export const ResultMessage: Story = {
  args: {
    message: {
      ...base,
      type: 'result',
      content: '',
      meta: { stats: { costUsd: 0.0042, durationMs: 1234, inputTokens: 512, outputTokens: 256 } },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/\$0\.0042/)).toBeInTheDocument();
    await expect(canvas.getByText(/1\.2s/)).toBeInTheDocument();
  },
};

export const ErrorMessage: Story = {
  args: {
    message: { ...base, type: 'error', content: 'Something went wrong: API timeout' },
  },
};

export const ControlRequest: Story = {
  args: {
    message: { ...base, type: 'pending_action', content: 'Bash' },
  },
};

export const ControlResponseApproved: Story = {
  args: {
    message: { ...base, type: 'action_result', content: 'Approved: Bash' },
  },
};

export const ControlResponseDenied: Story = {
  args: {
    message: { ...base, type: 'action_result', content: 'Denied: Bash' },
  },
};

export const RateLimitEvent: Story = {
  args: {
    message: {
      ...base,
      type: 'rate_limit_event',
      content: 'Rate limit reached',
      meta: {
        rateLimitInfo: {
          rateLimitType: 'token',
          resetsAt: Date.now() + 60000,
        },
      },
    },
  },
};

export const TaskStarted: Story = {
  args: {
    message: {
      ...base,
      type: 'task_started',
      content: 'Starting subagent task',
      meta: { taskType: 'code_review' },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/code_review/)).toBeInTheDocument();
  },
};

export const CompactBoundary: Story = {
  args: {
    message: { ...base, type: 'compact_boundary', content: '' },
  },
};

export const HookStarted: Story = {
  args: {
    message: {
      ...base,
      type: 'hook_started',
      content: 'pre-commit',
      meta: { hookEvent: 'PreToolUse' },
    },
  },
};

export const HookResponseWithOutput: Story = {
  args: {
    message: {
      ...base,
      type: 'hook_response',
      content: 'pre-commit',
      meta: { output: 'Hook ran successfully\nAll checks passed.' },
    },
  },
};

export const HookResponseNoOutput: Story = {
  args: {
    message: {
      ...base,
      type: 'hook_response',
      content: 'pre-commit',
    },
  },
};

export const StreamlinedText: Story = {
  args: {
    message: {
      ...base,
      type: 'streamlined_text',
      content: 'This is a streamlined fast-mode response.',
    },
  },
};

export const UnhandledMessage: Story = {
  args: {
    message: {
      ...base,
      type: 'unhandled',
      content: 'some_unknown_event',
      meta: { event: { type: 'some_unknown_event', data: 'payload' } },
    },
  },
};
