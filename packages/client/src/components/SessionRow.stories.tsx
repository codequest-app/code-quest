import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
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
    onSelect: fn(),
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

export const WithRename: Story = {
  args: {
    session: { ...baseSession, title: 'Old title' },
    onRename: fn().mockResolvedValue({ success: true }),
  },
};

export const WithDelete: Story = {
  args: {
    onDelete: fn().mockResolvedValue({ success: true }),
  },
};
