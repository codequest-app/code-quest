import type { SessionSummary } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SessionDropdown } from './SessionDropdown';

function make(partial: Partial<SessionSummary>): SessionSummary {
  return {
    id: partial.id ?? 's1',
    channelId: partial.channelId ?? 'c1',
    provider: 'claude',
    command: 'claude',
    args: '',
    projectRoot: '/Users/demo/cc-office',
    mode: 'chat',
    role: 'user',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    ...partial,
  };
}

const sessions: SessionSummary[] = [
  make({
    id: 's1',
    channelId: 'c1',
    title: 'Fix login bug',
    firstUserMessage: 'Fix the login bug',
  }),
  make({
    id: 's2',
    channelId: 'c2',
    title: 'Refactor hooks',
    firstUserMessage: 'Extract useFoo hook',
  }),
  make({ id: 's3', channelId: 'c3', firstUserMessage: 'Add dark mode toggle' }),
];

const meta = {
  component: SessionDropdown,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    onSelect: fn(),
    onClose: fn(),
    onRename: fn(async () => ({ ok: true, data: {} }) as never),
    onDelete: fn(async () => ({ ok: true, data: {} }) as never),
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { sessions } };
export const Loading: Story = { args: { sessions: [], loading: true } };
export const Empty: Story = { args: { sessions: [], loading: false } };
