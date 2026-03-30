import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PermissionHeader } from './PermissionHeader';

const meta = {
  component: PermissionHeader,
  tags: ['autodocs'],
  args: {
    onInputChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PermissionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BashCommand: Story = {
  args: {
    toolName: 'Bash',
    input: { command: 'rm -rf /tmp/build', description: 'Clean build directory' },
  },
};

export const ReadFile: Story = {
  args: {
    toolName: 'Read',
    input: { file_path: '/src/components/App.tsx' },
  },
};

export const WriteFile: Story = {
  args: {
    toolName: 'Write',
    input: { file_path: '/src/utils/helpers.ts' },
  },
};

export const UnknownTool: Story = {
  args: {
    toolName: 'CustomTool',
    input: {},
  },
};
