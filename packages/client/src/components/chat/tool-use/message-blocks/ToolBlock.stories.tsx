import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolBlock, ToolBlockRow } from './ToolBlock';

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

export const SingleRow: Story = {
  args: { children: null },
  render: () => (
    <ToolBlock>
      <ToolBlockRow label="command">{'ls -la /tmp'}</ToolBlockRow>
    </ToolBlock>
  ),
};

export const MultipleRows: Story = {
  args: { children: null },
  render: () => (
    <ToolBlock>
      <ToolBlockRow label="command" divider>
        {'git status --short'}
      </ToolBlockRow>
      <ToolBlockRow label="output">
        <pre className="m-0">{' M packages/client/src/foo.ts\n?? packages/client/src/bar.ts'}</pre>
      </ToolBlockRow>
    </ToolBlock>
  ),
};

export const WithCopy: Story = {
  args: { children: null },
  render: () => (
    <ToolBlock>
      <ToolBlockRow
        label="result"
        copyText="The full text goes to the clipboard when the button is clicked."
      >
        Hover the row to reveal a copy button.
      </ToolBlockRow>
    </ToolBlock>
  ),
};
