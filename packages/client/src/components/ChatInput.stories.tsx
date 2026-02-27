import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ChatInput } from './ChatInput';

const meta = {
  component: ChatInput,
  tags: ['autodocs'],
  args: {
    onSend: fn(),
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[480px] bg-bg p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SubmitViaButton: Story = {
  play: async ({ args, canvas, step }) => {
    await step('Type and submit', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'hello world');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));
    });

    await expect(args.onSend).toHaveBeenCalledWith('hello world');
    await expect(canvas.getByRole('textbox')).toHaveValue('');
  },
};

export const SubmitViaEnter: Story = {
  play: async ({ args, canvas, step }) => {
    await step('Type and press Enter', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'hi{Enter}');
    });

    await expect(args.onSend).toHaveBeenCalledWith('hi');
  },
};

export const ShiftEnterNewline: Story = {
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'line1{Shift>}{Enter}{/Shift}line2');
    await expect(args.onSend).not.toHaveBeenCalled();
  },
};
