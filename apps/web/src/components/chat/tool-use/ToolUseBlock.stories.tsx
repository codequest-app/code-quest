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
    task: {
      toolUseId: 'tu-5',
      taskType: 'subagent',
      status: 'running',
      description: 'Analyse protocol.md',
      lastToolName: 'Bash',
    },
  },
};

export const TaskDone: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Analyse protocol.md', subagent_type: 'Explore' },
    task: {
      toolUseId: 'tu-7',
      taskType: 'subagent',
      status: 'completed',
      description: 'Analyse protocol.md',
      summary: 'Found 3 issues',
      usage: { inputTokens: 18432, outputTokens: 2048 },
    },
  },
};

export const TaskFailed: Story = {
  args: {
    toolName: 'Task',
    input: { description: 'Analyse protocol.md' },
    task: {
      toolUseId: 'tu-8',
      taskType: 'subagent',
      status: 'failed',
      description: 'Analyse protocol.md',
    },
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
    task: {
      toolUseId: 'tu-9',
      taskType: 'local_agent',
      status: 'running',
      description: 'Run local checks',
      lastToolName: 'Read',
    },
  },
};
