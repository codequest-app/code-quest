import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
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
    cliUuid: 'cli-msg-1',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ ok: false }),
  },
};

export const AssistantMessage: Story = {
  args: {
    cliUuid: 'cli-msg-2',
    messageRole: 'assistant',
    onRewind: fn().mockResolvedValue({ ok: false }),
  },
};

export const RewindFallback: Story = {
  args: {
    cliUuid: 'cli-msg-1',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ ok: false }),
  },
};

export const WithFork: Story = {
  args: {
    cliUuid: 'cli-msg-3',
    messageRole: 'user',
    onRewind: fn().mockResolvedValue({ ok: false }),
    onFork: fn().mockResolvedValue({ ok: true, data: { channelId: 'sess-forked' } }),
  },
};
