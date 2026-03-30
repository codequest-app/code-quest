import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HookCallbackBanner } from './HookCallbackBanner';

const meta = {
  component: HookCallbackBanner,
  tags: ['autodocs'],
  args: {
    onRespond: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HookCallbackBanner>;

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
};

export const WithSubtypeOnly: Story = {
  args: {
    pending: {
      requestId: 'req-2',
      subtype: 'pre_tool_use',
    },
  },
};
