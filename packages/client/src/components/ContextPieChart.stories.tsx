import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextPieChart } from './ContextPieChart';

const meta = {
  component: ContextPieChart,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContextPieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { pct: 0 },
};

export const Half: Story = {
  args: { pct: 50 },
};

export const Full: Story = {
  args: { pct: 100 },
};
