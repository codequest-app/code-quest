import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { EffortSwitch } from './EffortSwitch';

const levels = ['low', 'medium', 'high', 'max'];

const meta: Meta<typeof EffortSwitch> = {
  component: EffortSwitch,
  tags: ['autodocs'],
  args: {
    levels,
    onSelect: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EffortSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Low: Story = {
  args: { level: 'low' },
};

export const Medium: Story = {
  args: { level: 'medium' },
};

export const Max: Story = {
  args: { level: 'max' },
};
