import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThinkingBlock } from './ThinkingBlock.tsx';

const meta: Meta<typeof ThinkingBlock> = {
  component: ThinkingBlock,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThinkingBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Streaming: Story = {
  args: {
    content: 'Let me analyze the code structure and identify the key components...',
    isStreaming: true,
  },
};

export const CompletedWithDuration: Story = {
  args: {
    content:
      'I analyzed the codebase and found that the main entry point is in `src/index.ts`. The architecture follows a three-layer pattern with UI, Bridge, and CLI layers.',
    durationMs: 5200,
  },
};

export const WithBudgetTokens: Story = {
  args: {
    content: 'Considering the best approach to refactor this module...',
    budgetTokens: 10000,
  },
};

export const DefaultLabel: Story = {
  args: { content: 'Some thinking content here.' },
};
