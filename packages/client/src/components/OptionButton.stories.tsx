import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OptionButton } from './OptionButton';

const meta = {
  component: OptionButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    onMouseEnter: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs bg-surface text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OptionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  args: {
    index: 1,
    label: 'Continue',
    selected: true,
  },
};

export const Unselected: Story = {
  args: {
    index: 2,
    label: 'Cancel',
    selected: false,
  },
};
