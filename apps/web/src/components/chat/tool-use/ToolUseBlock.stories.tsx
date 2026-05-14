import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolUseBlock } from './ToolUseBlock.tsx';

const meta: Meta<typeof ToolUseBlock> = {
  component: ToolUseBlock,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
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
    toolName: 'Bash',
    input: { command: 'ls -la /tmp' },
    result: { content: 'total 0\ndrwxrwxrwt 12 root wheel 384 Mar 30 10:00 .' },
  },
};

export const BashError: Story = {
  args: {
    toolName: 'Bash',
    input: { command: 'cat /nonexistent' },
    result: { content: 'cat: /nonexistent: No such file or directory', is_error: true },
  },
};

export const ReadFile: Story = {
  args: {
    toolName: 'Read',
    input: { file_path: '/src/index.ts' },
    result: { content: 'export function main() {\n  console.log("hello");\n}' },
  },
};

export const ToolRunning: Story = {
  args: { toolName: 'Bash', input: { command: 'npm test' } },
};

export const TaskRunning: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Analyse protocol.md', subagent_type: 'Explore' },
    taskType: 'subagent',
  },
};

export const TaskDone: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Analyse protocol.md', subagent_type: 'Explore' },
    taskType: 'subagent',
    result: { content: 'Found 3 issues' },
  },
};

export const TaskFailed: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Analyse protocol.md' },
    taskType: 'subagent',
    result: { content: 'Failed to analyse.', is_error: true },
  },
};

export const EditWithDiff: Story = {
  args: {
    toolName: 'Edit',
    input: {
      file_path: '/src/auth/login.ts',
      old_string:
        '  const user = await db.users.findByEmail(email);\n  if (!user) throw new Error("User not found");',
      new_string:
        '  if (!email || !password) {\n    throw new Error("Email and password are required");\n  }\n  const user = await db.users.findByEmail(email);\n  if (!user) throw new Error("User not found");',
    },
    result: { content: 'The file has been updated successfully.' },
  },
};

export const EditStreamingIncomplete: Story = {
  args: {
    toolName: 'Edit',
    partialInput: '{"file_path": "/src/auth/login.ts", "old_str',
  },
};

export const LocalAgentRunning: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Run local checks' },
    taskType: 'local_agent',
  },
};
