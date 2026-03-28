import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AccountUsageDialog } from './AccountUsageDialog';

const meta = {
  component: AccountUsageDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text min-h-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountUsageDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
    model: 'claude-sonnet-4-6',
    authMethod: 'claudeai',
    email: 'user@example.com',
    subscriptionType: 'pro',
    usage: {
      five_hour: { utilization: 0.42, resets_at: new Date(Date.now() + 3600000).toISOString() },
    },
  },
};
export const NoUsage: Story = { args: { open: true, onClose: fn() } };
