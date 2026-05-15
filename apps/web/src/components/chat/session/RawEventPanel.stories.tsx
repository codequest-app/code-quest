import { EVENTS } from '@code-quest/schemas';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RawEventPanel } from './RawEventPanel.tsx';

const meta: Meta<typeof RawEventPanel> = {
  component: RawEventPanel,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="w-72 h-100 bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RawEventPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    onFetch: fn().mockResolvedValue({ events: [] }),
  },
};

export const WithEvents: Story = {
  args: {
    onFetch: fn().mockResolvedValue({
      events: [
        { type: 'init', session_id: 'abc-123', model: 'claude-sonnet-4-6' },
        { type: 'assistant', message: { content: [{ type: 'text', text: 'Hello!' }] } },
        { type: 'tool_use', name: 'Read', input: { file_path: '/src/index.ts' } },
        { type: 'result', is_error: false, duration_ms: 1234 },
      ],
    }),
  },
};

export const ManyEvents: Story = {
  args: {
    onFetch: fn().mockResolvedValue({
      events: Array.from({ length: 20 }, (_, i) => ({
        type: i % 2 === 0 ? 'text' : 'tool_use',
        content: `Event content ${i}`,
      })),
    }),
  },
};

export const Streaming: Story = {
  args: {
    onSubscribe: (cb: (evt: unknown) => void) => {
      const events = [
        { type: EVENTS.message.assistant, content: 'Hello from Claude' },
        { type: EVENTS.stream.chunk, delta: { type: 'text_delta', text: 'streaming...' } },
        { type: EVENTS.control.permission, toolName: 'Bash', input: { command: 'ls' } },
        { type: EVENTS.message.result, stats: { durationMs: 500 } },
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < events.length) {
          cb(events[i++]);
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    },
  },
};
