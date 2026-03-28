import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SessionRow } from './SessionRow';

const baseSession = {
  id: 'sess-abc',
  provider: 'anthropic',
  command: 'claude',
  args: '',
  mode: 'interactive' as const,
  role: 'user' as const,
  createdAt: '2025-06-01T10:00:00Z',
  cwd: '/home/user/project',
};

const meta = {
  component: SessionRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72 bg-surface text-text border border-border">
        <Story />
      </div>
    ),
  ],
  args: {
    session: baseSession,
    isExpanded: false,
    isCurrent: false,
    isRemote: false,
    onExpand: fn(),
    onSelect: fn(),
    onDeleted: fn(),
  },
} satisfies Meta<typeof SessionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: {
    session: { ...baseSession, title: 'My refactoring session' },
  },
};

export const Current: Story = {
  args: {
    isCurrent: true,
  },
};

export const Expanded: Story = {
  args: {
    isExpanded: true,
    onGetDetail: async (id) => ({
      ...baseSession,
      id,
      title: 'Expanded detail',
    }),
  },
};

export const WithRename: Story = {
  args: {
    session: { ...baseSession, title: 'Old title' },
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

export const WithDelete: Story = {
  args: {
    onDelete: fn().mockResolvedValue({ success: true }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/delete session/i));
    await userEvent.click(canvas.getByText('Confirm'));
    await expect(args.onDelete).toHaveBeenCalledWith('sess-abc');
  },
};

export const Remote: Story = {
  args: {
    isRemote: true,
    session: { ...baseSession, title: 'Remote session' },
    onTeleport: fn(),
  },
};

export const ActiveSession: Story = {
  args: {
    session: { ...baseSession, isActive: true, title: 'Active session' },
    onJoin: fn(),
  },
};
