import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { OptionButton } from './OptionButton';

const meta: Meta<typeof OptionButton> = {
  component: OptionButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    onMouseEnter: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
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
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Unselected: Story = {
  args: {
    index: 2,
    label: 'Cancel',
    selected: false,
  },
};

export const LongLabel: Story = {
  args: {
    index: 3,
    label: 'Allow this tool for the rest of the session',
    selected: false,
  },
};
