import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SettingsDialog } from './SettingsDialog';

const meta = {
  component: SettingsDialog,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text min-h-[400px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = { args: { open: false } };
export const Open: Story = { args: { open: true } };
