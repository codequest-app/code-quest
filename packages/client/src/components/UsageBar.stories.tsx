import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { UsageBar } from './UsageBar';

const meta = {
  component: UsageBar,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6 font-mono' })],
} satisfies Meta<typeof UsageBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTiers: Story = {
  args: {
    usage: {
      five_hour: { utilization: 0.3, resets_at: '2026-03-03T10:00:00Z' },
      seven_day: { utilization: 0.6 },
      seven_day_sonnet: { utilization: 0.85 },
      extra_usage: { is_enabled: true, utilization: 0.5, monthly_limit: 1000, used_credits: 500 },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('usage-bar')).toBeInTheDocument();
    await expect(canvas.getByTestId('usage-bar-5hr')).toBeInTheDocument();
    await expect(canvas.getByTestId('usage-bar-7day')).toBeInTheDocument();
  },
};

export const LowUsage: Story = {
  args: {
    usage: {
      five_hour: { utilization: 0.1 },
      seven_day: { utilization: 0.2 },
    },
  },
};

export const HighUsage: Story = {
  args: {
    usage: {
      five_hour: { utilization: 0.95 },
      seven_day: { utilization: 0.82 },
    },
  },
  play: async ({ canvas }) => {
    const bar = canvas.getByTestId('usage-bar-5hr');
    await expect(bar.className).toContain('bg-danger');
  },
};

export const WithExtraUsage: Story = {
  args: {
    usage: {
      extra_usage: { is_enabled: true, utilization: 0.7, monthly_limit: 2000, used_credits: 1400 },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('usage-bar-extra')).toBeInTheDocument();
  },
};

export const ExtraUsageDisabled: Story = {
  args: {
    usage: {
      five_hour: { utilization: 0.4 },
      extra_usage: { is_enabled: false },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByTestId('usage-bar-extra')).toBeNull();
  },
};
