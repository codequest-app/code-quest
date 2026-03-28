import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { NotificationToast } from './NotificationToast';

const meta = {
  component: NotificationToast,
  tags: ['autodocs'],
  args: { onButton: fn(), onDismiss: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoButtons: Story = {
  args: {
    message: 'Would you like to save changes?',
    buttons: [
      { label: 'Save', value: 'save' },
      { label: 'Discard', value: 'discard' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /save/i }));
    await expect(args.onButton).toHaveBeenCalledWith('save');
  },
};

export const ThreeButtons: Story = {
  args: {
    message: 'How would you like to proceed?',
    buttons: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
      { label: 'Maybe', value: 'maybe' },
    ],
  },
};

export const ErrorSeverity: Story = {
  args: {
    message: 'Something went wrong. Retry?',
    severity: 'error',
    buttons: [
      { label: 'Retry', value: 'retry' },
      { label: 'Cancel', value: 'cancel' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /dismiss/i }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const WarningSeverity: Story = {
  args: {
    message: 'This action may have side effects.',
    severity: 'warning',
    buttons: [
      { label: 'Continue', value: 'continue' },
      { label: 'Abort', value: 'abort' },
    ],
  },
};
