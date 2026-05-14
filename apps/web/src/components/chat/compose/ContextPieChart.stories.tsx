import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextPieChart } from './ContextPieChart';

const meta: Meta<typeof ContextPieChart> = {
  component: ContextPieChart,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
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
