import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatsBar } from './StatsBar';

const meta = {
  component: StatsBar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          width: 500,
          background: '#1e1e1e',
          color: '#e0e0e0',
          padding: 16,
          fontFamily: 'monospace',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoStats: Story = {
  args: { stats: null },
};

export const CostOnly: Story = {
  args: { stats: { costUsd: 0.0042 } },
};

export const AllStats: Story = {
  args: {
    stats: { costUsd: 0.05, durationMs: 2350, inputTokens: 512, outputTokens: 1024 },
  },
};
