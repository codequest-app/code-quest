import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { RawEventPanel } from './RawEventPanel';

const meta = {
  component: RawEventPanel,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [
    (Story) => (
      <div className="w-72 h-[400px] bg-bg text-text">
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
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle('Refresh'));
    const summary = await canvas.findByText(/Event #1 — init/i);
    await expect(summary).toBeInTheDocument();
    await userEvent.click(summary);
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
        { type: 'message:assistant', content: 'Hello from Claude' },
        { type: 'stream:chunk', delta: { type: 'text_delta', text: 'streaming...' } },
        { type: 'control:permission', toolName: 'Bash', input: { command: 'ls' } },
        { type: 'message:result', stats: { durationMs: 500 } },
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
