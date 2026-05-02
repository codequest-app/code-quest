import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import {
  CenterDivider,
  CollapsibleBlock,
  OutputContent,
  RotatableChevron,
  StatusLine,
} from './primitives.tsx';

const meta: Meta = {
  title: 'message-blocks/primitives',
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const ChevronClosed: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <RotatableChevron />
      <span className="text-sm">Closed</span>
    </div>
  ),
};

export const ChevronOpen: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <RotatableChevron open />
      <span className="text-sm">Open</span>
    </div>
  ),
};

export const StatusLineVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusLine icon="✓">All checks passed</StatusLine>
      <StatusLine icon="⏳" className="text-warning">
        Running...
      </StatusLine>
      <StatusLine icon="✗" className="text-danger">
        Build failed
      </StatusLine>
    </div>
  ),
};

export const CollapsibleBlockToggle: Story = {
  render: () => (
    <CollapsibleBlock icon="📄" label="example.ts" labelDetail="src/utils" labelRange="1-42">
      <pre className="bg-code-block p-3 rounded text-xs font-mono">
        {`function hello() {\n  return 'world';\n}`}
      </pre>
    </CollapsibleBlock>
  ),
  play: async ({ canvas }) => {
    const toggle = canvas.getByText('example.ts');
    await userEvent.click(toggle);
    await expect(canvas.getByText(/hello/)).toBeInTheDocument();
  },
};

export const Divider: Story = {
  render: () => <CenterDivider>Context compacted</CenterDivider>,
};

export const OutputWithFilePaths: Story = {
  render: () => (
    <OutputContent content="Error in /src/auth/login.ts:42\n  Cannot find module './session'" />
  ),
};

export const OutputError: Story = {
  render: () => (
    <OutputContent content="TypeError: Cannot read property 'id' of undefined" isError />
  ),
};
