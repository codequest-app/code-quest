import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { MessageActions } from './MessageActions';

const meta = {
  component: MessageActions,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-surface text-text p-6 group">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    messageId: 'msg-1',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ success: false }),
  },
};

export const AssistantMessage: Story = {
  args: {
    messageId: 'msg-2',
    messageRole: 'assistant',
    onRewind: fn().mockResolvedValue({ success: false }),
  },
};

export const RewindFallback: Story = {
  args: {
    messageId: 'msg-1',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ success: false }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/rewind to here/i));
    await expect(args.onRewind).toHaveBeenCalledWith('msg-1', true);
    await expect(canvas.findByText(/no preview available/i)).resolves.toBeInTheDocument();
  },
};

export const RewindConfirm: Story = {
  args: {
    messageId: 'msg-1',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ success: false }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/rewind to here/i));
    await expect(canvas.findByText(/no preview available/i)).resolves.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /confirm rewind/i }));
    await expect(args.onRewind).toHaveBeenCalledWith('msg-1', false);
  },
};

export const WithFork: Story = {
  args: {
    messageId: 'msg-3',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ success: false }),
    onFork: fn().mockResolvedValue({ success: true, sessionId: 'sess-forked' }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/fork from here/i));
    await expect(args.onFork).toHaveBeenCalledWith('msg-3');
  },
};
