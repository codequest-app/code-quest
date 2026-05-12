import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolBlock } from './ToolBlock.tsx';

const meta: Meta<typeof ToolBlock> = {
  component: ToolBlock,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 w-180">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div className="p-2 text-xs font-mono">tool output here</div> },
};
