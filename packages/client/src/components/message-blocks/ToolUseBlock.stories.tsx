import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolUseBlock } from './ToolUseBlock';

const meta = {
  component: ToolUseBlock,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolUseBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BashCommand: Story = {
  args: {
    content: 'Bash',
    meta: {
      toolId: 'tu-1',
      input: { command: 'ls -la /tmp' },
      result: { content: 'total 0\ndrwxrwxrwt 12 root wheel 384 Mar 30 10:00 .' },
    },
  },
};

export const BashError: Story = {
  args: {
    content: 'Bash',
    meta: {
      toolId: 'tu-2',
      input: { command: 'cat /nonexistent' },
      result: { content: 'cat: /nonexistent: No such file or directory', is_error: true },
    },
  },
};

export const ReadFile: Story = {
  args: {
    content: 'Read',
    meta: {
      toolId: 'tu-3',
      input: { file_path: '/src/index.ts' },
      result: { content: 'export function main() {\n  console.log("hello");\n}' },
    },
  },
};

export const ToolRunning: Story = {
  args: {
    content: 'Bash',
    meta: { toolId: 'tu-4', input: { command: 'npm test' } },
  },
};
