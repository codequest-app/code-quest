import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparkLegend } from './SparkLegend';

const meta = {
  component: SparkLegend,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative bg-bg text-text p-8 border border-border rounded-xl min-h-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SparkLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EffortLow: Story = { args: { effort: 'low' } };
export const EffortMedium: Story = { args: { effort: 'medium' } };
export const EffortHigh: Story = { args: { effort: 'high' } };
export const EffortMax: Story = { args: { effort: 'max' } };
export const FastMode: Story = { args: { isFastMode: true } };
export const EffortWithFastMode: Story = { args: { effort: 'high', isFastMode: true } };
export const NoEffortNoFast: Story = { args: {} };
