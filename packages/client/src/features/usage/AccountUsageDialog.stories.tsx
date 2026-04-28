import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AccountUsageDialog } from './AccountUsageDialog';

const meta: Meta<typeof AccountUsageDialog> = {
  component: AccountUsageDialog,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text min-h-100">
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
export const NoUsage: Story = { args: { open: true, onClose: fn(), authMethod: 'claudeai' } };

export const WithManageLink: Story = {
  args: {
    open: true,
    onClose: fn(),
    authMethod: 'claudeai',
    subscriptionType: 'pro',
    usage: {
      five_hour: { utilization: 0.6, resets_at: new Date(Date.now() + 7200000).toISOString() },
      seven_day: { utilization: 0.85 },
    },
  },
};

export const TeamManageLink: Story = {
  args: {
    open: true,
    onClose: fn(),
    authMethod: 'claudeai',
    subscriptionType: 'team',
    organization: 'Acme Corp',
    usage: {
      five_hour: { utilization: 0.3 },
    },
  },
};

export const UnavailableUsage: Story = {
  args: {
    open: true,
    onClose: fn(),
    authMethod: 'api-key',
    email: 'dev@company.com',
  },
};
