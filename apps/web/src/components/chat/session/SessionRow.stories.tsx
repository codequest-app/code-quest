import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SessionRow } from './SessionRow.tsx';

const baseSession = {
  id: 'sess-abc',
  channelId: 'sess-abc',
  projectRoot: '/test/project',
  provider: 'anthropic',
  command: 'claude',
  args: '',
  mode: 'interactive' as const,
  role: 'user' as const,
  createdAt: '2025-06-01T10:00:00Z',
  cwd: '/home/user/project',
};

const meta: Meta<typeof SessionRow> = {
  component: SessionRow,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
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
    onRename: fn().mockResolvedValue({ ok: true, data: {} }),
  },
};

export const WithDelete: Story = {
  args: {
    onDelete: fn().mockResolvedValue({ ok: true, data: {} }),
  },
};
