import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SessionHistory } from './SessionHistory';

const meta = {
  component: SessionHistory,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-96 w-72 bg-surface text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { sessions: [], loading: true, onSelect: () => {}, onClose: () => {} },
};

export const WithSessions: Story = {
  args: {
    sessions: [
      {
        id: 'sess-abc',
        provider: 'anthropic',
        command: 'claude',
        args: '',
        mode: 'chat',
        role: 'user',
        createdAt: '2025-06-01T10:00:00Z',
      },
      {
        id: 'sess-def',
        provider: 'anthropic',
        command: 'claude',
        args: '',
        mode: 'code',
        role: 'user',
        createdAt: '2025-06-02T14:30:00Z',
      },
    ],
    onSelect: (id) => console.log(id),
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: { sessions: [], onSelect: () => {}, onClose: () => {} },
};

export const WithLoadMore: Story = {
  args: {
    sessions: [
      {
        id: 'sess-001',
        provider: 'anthropic',
        command: 'claude',
        args: '--chat',
        mode: 'chat',
        role: 'user',
        createdAt: '2025-06-01T10:00:00Z',
        cwd: '/home/user/project',
      },
      {
        id: 'sess-002',
        provider: 'anthropic',
        command: 'claude',
        args: '',
        mode: 'code',
        role: 'user',
        createdAt: '2025-06-02T14:30:00Z',
      },
    ],
    hasMore: true,
    onSelect: (id) => console.log('select', id),
    onClose: () => {},
    onLoadMore: () => console.log('load more'),
  },
};

export const WithRename: Story = {
  args: {
    sessions: [
      {
        id: 'sess-abc',
        provider: 'anthropic',
        command: 'claude',
        args: '',
        mode: 'chat',
        role: 'user',
        title: 'Old title',
        createdAt: '2025-06-01T10:00:00Z',
      },
    ],
    onSelect: fn(),
    onClose: fn(),
    onRename: fn().mockResolvedValue({ success: true }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/rename session/i));
    const input = canvas.getByRole('textbox', { name: /rename session/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'New title');
    await userEvent.keyboard('{Enter}');
    await expect(args.onRename).toHaveBeenCalledWith('sess-abc', 'New title');
  },
};

export const WithDetailExpansion: Story = {
  args: {
    sessions: [
      {
        id: 'sess-abc',
        provider: 'anthropic',
        command: 'claude',
        args: 'claude --chat',
        mode: 'chat',
        role: 'user',
        createdAt: '2025-06-01T10:00:00Z',
        cwd: '/home/user/my-project',
      },
    ],
    onSelect: (id) => console.log('select', id),
    onClose: () => {},
    onGetDetail: async (id) => ({
      id,
      provider: 'anthropic',
      command: 'claude',
      args: 'claude --chat',
      mode: 'chat',
      role: 'user',
      createdAt: '2025-06-01T10:00:00Z',
      cwd: '/home/user/my-project',
    }),
  },
};
