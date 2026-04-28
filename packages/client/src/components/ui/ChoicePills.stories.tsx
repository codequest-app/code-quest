import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChoicePills } from './ChoicePills';

const meta: Meta<typeof ChoicePills> = {
  component: ChoicePills,
  tags: ['autodocs'],
  args: { onSelect: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChoicePills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Theme: Story = {
  args: {
    options: [
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
    ],
    currentValue: 'dark',
    featureId: 'color-theme',
  },
};

export const Density: Story = {
  args: {
    options: [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' },
    ],
    currentValue: 'compact',
    featureId: 'density',
  },
};

export const FontSize: Story = {
  args: {
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    currentValue: 'md',
    featureId: 'font-size',
  },
};
