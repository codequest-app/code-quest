import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
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
  args: { sessions: [], loading: true, onSelect: () => {} },
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
        title: 'Fix login bug',
        createdAt: '2025-06-01T10:00:00Z',
      },
      {
        id: 'sess-def',
        provider: 'anthropic',
        command: 'claude',
        args: '',
        mode: 'code',
        role: 'user',
        title: 'Add dark mode',
        createdAt: '2025-06-02T14:30:00Z',
      },
    ],
    onSelect: (id) => console.log(id),
  },
};

export const Empty: Story = {
  args: { sessions: [], onSelect: () => {} },
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
    onRename: fn().mockResolvedValue({ success: true }),
  },
};
