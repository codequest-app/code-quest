import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ControlRequestBanner } from './ControlRequestBanner';

const meta = {
  component: ControlRequestBanner,
  tags: ['autodocs'],
  args: { onRespond: fn() },
  decorators: [
    (Story) => (
      <div className="w-[500px] bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ControlRequestBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoPending: Story = {
  args: { pending: null },
};

export const WithToolName: Story = {
  args: {
    pending: { requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' },
  },
};

export const WithoutToolName: Story = {
  args: {
    pending: { requestId: 'r2', subtype: 'permission_request' },
  },
};

export const ClickApprove: Story = {
  args: {
    pending: { requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /approve/i }));
    await expect(args.onRespond).toHaveBeenCalledWith({ allowed: true });
  },
};

export const ClickDeny: Story = {
  args: {
    pending: { requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /deny/i }));
    await expect(args.onRespond).toHaveBeenCalledWith({ allowed: false });
  },
};
