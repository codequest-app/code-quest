import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CollapsibleBlock } from '../ui/CollapsibleBlock';

const meta: Meta<typeof CollapsibleBlock> = {
  component: CollapsibleBlock,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    icon: '📄',
    label: 'example.ts',
    children: (
      <pre className="bg-code-block p-3 rounded text-xs font-mono">
        {`function hello() {\n  return 'world';\n}`}
      </pre>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('example.ts')).toBeInTheDocument();
    const toggle = canvas.getByRole('button');
    await userEvent.click(toggle);
    await expect(canvas.getByText(/hello/)).toBeInTheDocument();
  },
};

export const DefaultOpen: Story = {
  args: {
    icon: '✏️',
    label: 'main.ts',
    defaultOpen: true,
    children: (
      <pre className="bg-code-block p-3 rounded text-xs font-mono">
        {`const x = 42;\nconsole.log(x);`}
      </pre>
    ),
  },
};
