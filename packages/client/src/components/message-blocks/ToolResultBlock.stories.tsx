import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ToolResultBlock } from './ToolResultBlock';

const meta = {
  component: ToolResultBlock,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolResultBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainTextResult: Story = {
  args: {
    content: 'File saved successfully.\n2 files changed, 15 insertions(+), 3 deletions(-).',
    meta: { toolId: 'tr-1', name: 'Bash' },
  },
};

export const DiffResult: Story = {
  args: {
    content:
      '--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n import { foo } from "./foo";\n+import { bar } from "./bar";\n \n export function main() {',
    meta: { name: 'Edit', toolId: 'tool-123' },
    onDiffRespond: fn(),
  },
};

export const AnsiResult: Story = {
  args: {
    content: '\x1b[32mPASS\x1b[0m src/index.test.ts\n  \x1b[32m\u2713\x1b[0m should work (2ms)',
    meta: { toolId: 'tr-3', name: 'Bash' },
  },
};
