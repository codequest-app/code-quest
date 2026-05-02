import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { InitOptionsDialog } from './InitOptionsDialog.tsx';

const meta: Meta<typeof InitOptionsDialog> = {
  component: InitOptionsDialog,
  tags: ['autodocs'],
  args: { open: true, onClose: fn(), onSave: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text min-h-100">
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
  play: async ({ args, userEvent }) => {
    const body = within(document.body);
    const textarea = await body.findByLabelText('System Prompt');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Custom system prompt');
    await userEvent.click(body.getByRole('button', { name: /save/i }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ systemPrompt: 'Custom system prompt' }),
    );
  },
};

export const CloseDialog: Story = {
  play: async ({ args, userEvent }) => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole('button', { name: /cancel/i }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};
