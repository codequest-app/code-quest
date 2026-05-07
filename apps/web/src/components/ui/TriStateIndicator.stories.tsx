import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TriStateIndicator } from './TriStateIndicator.tsx';

const meta: Meta<typeof TriStateIndicator> = {
  component: TriStateIndicator,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TriStateIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllOn: Story = { args: { state: 'all' } };
export const AllOff: Story = { args: { state: 'none' } };
export const Partial: Story = { args: { state: 'partial' } };

export const PartialClickable: Story = {
  args: { state: 'partial', onPartial: fn() },
};

export const WithFeatureId: Story = {
  args: { state: 'all', featureId: 'tools' },
};
