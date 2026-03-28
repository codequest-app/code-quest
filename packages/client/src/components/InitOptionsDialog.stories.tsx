import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { InitOptionsDialog } from './InitOptionsDialog';

const meta = {
  component: InitOptionsDialog,
  tags: ['autodocs'],
  args: { open: true, onClose: fn(), onSave: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text min-h-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InitOptionsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialValues: Story = {
  args: {
    initial: {
      systemPrompt: 'You are a helpful coding assistant.',
      appendSystemPrompt: 'Always respond in English.',
    },
  },
};

export const Closed: Story = {
  args: { open: false },
};

export const SaveWithSystemPrompt: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const textarea = canvas.getByLabelText(/system prompt/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Custom system prompt');
    await userEvent.click(canvas.getByRole('button', { name: /save/i }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ systemPrompt: 'Custom system prompt' }),
    );
  },
};

export const CloseDialog: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /cancel/i }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};
