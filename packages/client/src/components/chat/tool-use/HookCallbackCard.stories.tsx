import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HookCallbackCard } from './HookCallbackCard';

const meta: Meta<typeof HookCallbackCard> = {
  component: HookCallbackCard,
  tags: ['autodocs'],
  args: {
    onRespond: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-md bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HookCallbackCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToolName: Story = {
  args: {
    pending: {
      requestId: 'req-1',
      subtype: 'hook_callback',
      toolName: 'Bash',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Bash')).toBeInTheDocument();
    await expect(canvas.getByText('Continue')).toBeInTheDocument();
    await expect(canvas.getByText('Cancel')).toBeInTheDocument();
  },
};

export const WithSubtypeOnly: Story = {
  args: {
    pending: {
      requestId: 'req-2',
      subtype: 'pre_tool_use',
    },
  },
};

export const WithCallbackId: Story = {
  args: {
    pending: {
      requestId: 'req-3',
      subtype: 'hook_callback',
      callbackId: 'lint-check',
      toolName: 'Edit',
    },
  },
};
