import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ToggleSwitch } from './ToggleSwitch';

const meta = {
  component: ToggleSwitch,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {
  args: { isOn: true, onClick: fn() },
};

export const Off: Story = {
  args: { isOn: false, onClick: fn() },
};

export const DisplayOnly: Story = {
  args: { isOn: true },
};
