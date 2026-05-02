import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpinnerVerb } from './SpinnerVerb.tsx';

const meta: Meta<typeof SpinnerVerb> = {
  component: SpinnerVerb,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpinnerVerb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithStatusText: Story = {
  args: { statusText: 'Reading file src/index.ts' },
};

export const CustomVerbs: Story = {
  args: { verbs: ['Hacking', 'Shipping', 'Deploying'] },
};
