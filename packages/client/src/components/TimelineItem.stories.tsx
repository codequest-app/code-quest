import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimelineItem } from './TimelineItem';

const meta = {
  component: TimelineItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimelineItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    toolName: 'Read',
    description: 'src/index.ts',
    status: 'success',
    input: JSON.stringify({ file_path: 'src/index.ts' }, null, 2),
    output: 'const app = express();\napp.listen(3000);',
  },
};

export const InProgress: Story = {
  args: {
    toolName: 'Write',
    description: 'src/utils/helpers.ts',
    status: 'in-progress',
    input: JSON.stringify({ file_path: 'src/utils/helpers.ts', content: '...' }, null, 2),
    output: '',
  },
};

export const ErrorStatus: Story = {
  args: {
    toolName: 'Bash',
    description: 'npm test',
    status: 'error',
    input: 'npm test',
    output: 'FAIL src/index.test.ts\n  ✕ should work (5ms)',
  },
};

export const Warning: Story = {
  args: {
    toolName: 'Edit',
    description: 'src/config.ts',
    status: 'warning',
    input: JSON.stringify(
      { file_path: 'src/config.ts', old_string: 'foo', new_string: 'bar' },
      null,
      2,
    ),
    output: 'File edited successfully',
  },
};
