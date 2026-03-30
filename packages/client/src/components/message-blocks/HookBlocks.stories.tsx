import type { Meta, StoryObj } from '@storybook/react-vite';
import { HookDiagnosticsContent, HookResponseContent, HookStartedContent } from './HookBlocks';

const decorator = (Story: React.ComponentType) => (
  <div className="bg-bg text-text max-w-xl p-4">
    <Story />
  </div>
);

const meta = {
  component: HookStartedContent,
  tags: ['autodocs'],
  decorators: [decorator],
} satisfies Meta<typeof HookStartedContent>;

export default meta;

export const HookStarted: StoryObj<typeof HookStartedContent> = {
  args: { content: 'pre-commit', meta: { hookEvent: 'PreToolUse' } },
};

export const HookResponseNoOutput: StoryObj<typeof HookResponseContent> = {
  render: (args) => <HookResponseContent {...args} />,
  args: { content: 'pre-commit' },
  decorators: [decorator],
};

export const HookResponseWithOutput: StoryObj<typeof HookResponseContent> = {
  render: (args) => <HookResponseContent {...args} />,
  args: { content: 'lint-check', meta: { output: 'All checks passed.\n0 errors, 0 warnings.' } },
  decorators: [decorator],
};

export const HookDiagnostics: StoryObj<typeof HookDiagnosticsContent> = {
  render: (args) => <HookDiagnosticsContent {...args} />,
  args: {
    content: 'security-scan',
    meta: {
      diagnostics: 'Warning: found 2 potential issues\n- Unused import\n- Missing return type',
    },
  },
  decorators: [decorator],
};
