import type { Meta, StoryObj } from '@storybook/react-vite';
import { JsonViewer } from '@/components/chat/ui/JsonViewer';

const meta: Meta<typeof JsonViewer> = {
  component: JsonViewer,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-surface text-text p-4 max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    data: { key: 'value', count: 42, active: true },
  },
};

export const Nested: Story = {
  args: {
    data: {
      session: { id: 'abc123', model: 'claude-sonnet-4-6' },
      stats: { tokens: 1024, cost: 0.002 },
      tools: ['Read', 'Write', 'Bash'],
    },
    className: 'bg-code-block p-3 rounded-lg text-xs',
  },
};

export const ArrayData: Story = {
  args: {
    data: [
      { id: 1, name: 'Item A' },
      { id: 2, name: 'Item B' },
    ],
  },
};
