import type { Meta, StoryObj } from '@storybook/react-vite';
import { withThemePreset } from '@/test/story-decorator';
import { AlertBanner } from './AlertBanner';

const meta: Meta<typeof AlertBanner> = {
  component: AlertBanner,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 w-130">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mirrors SystemBlocks warning banner (system notices, compact boundaries)
export const Warning: Story = {
  args: {
    className: 'bg-warning-bg border-l-warning px-4 py-2.5',
    children: 'Compact boundary reached.',
  },
};

// Mirrors SystemBlocks error banner
export const ErrorBanner: Story = {
  args: {
    className: 'bg-danger-bg border-l-danger px-4 py-3 text-danger',
    children: 'Something went wrong processing your request.',
  },
};

// Mirrors ToolUseBlock inline error pill
export const ToolError: Story = {
  args: {
    className: 'bg-danger/10 border-danger px-3 py-1.5 text-xs text-danger mb-1',
    children: 'Tool failed: permission denied',
  },
};

export const WarningLight: Story = {
  args: {
    className: 'bg-warning-bg border-l-warning px-4 py-2.5',
    children: 'Compact boundary reached.',
  },
  decorators: [withThemePreset({ theme: 'light' })],
};

export const ErrorLight: Story = {
  args: {
    className: 'bg-danger-bg border-l-danger px-4 py-3 text-danger',
    children: 'Something went wrong processing your request.',
  },
  decorators: [withThemePreset({ theme: 'light' })],
};
