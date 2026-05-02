import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CompactBoundaryContent,
  ContentBlockStart,
  ControlResponseContent,
  DocumentContent,
  ErrorContent,
  InterruptContent,
  MetaContent,
  PendingActionContent,
  RateLimitContent,
  ResultContent,
  SlashCommandResultContent,
  StreamlinedTextContent,
  StreamlinedToolSummaryContent,
  TaskStartedContent,
} from './SystemBlocks.tsx';

const decorator = (Story: React.ComponentType): React.JSX.Element => (
  <div className="bg-bg text-text max-w-xl p-4">
    <Story />
  </div>
);

// --- PendingActionContent ---
const pendingMeta: Meta<typeof PendingActionContent> = {
  component: PendingActionContent,
  tags: ['autodocs'],
  decorators: [decorator],
} satisfies Meta<typeof PendingActionContent>;
export default pendingMeta;
type PendingStory = StoryObj<typeof pendingMeta>;

export const PendingAction: PendingStory = {
  args: { content: 'Bash: rm -rf /tmp/build' },
};

// --- ControlResponseContent ---
export const ControlApproved: StoryObj<typeof ControlResponseContent> = {
  render: (args) => <ControlResponseContent {...args} />,
  args: { content: 'Approved' },
  decorators: [decorator],
};

export const ControlDenied: StoryObj<typeof ControlResponseContent> = {
  render: (args) => <ControlResponseContent {...args} />,
  args: { content: 'Denied' },
  decorators: [decorator],
};

export const ControlDeniedStopped: StoryObj<typeof ControlResponseContent> = {
  render: (args) => <ControlResponseContent {...args} />,
  args: { content: 'Denied & Stopped by user' },
  decorators: [decorator],
};

// --- ResultContent ---
export const ResultWithStats: StoryObj<typeof ResultContent> = {
  render: (args) => <ResultContent {...args} />,
  args: {
    meta: {
      stats: {
        costUsd: 0.0123,
        durationMs: 4500,
        inputTokens: 1200,
        outputTokens: 800,
        numTurns: 3,
      },
    },
  },
  decorators: [decorator],
};

export const ResultNoStats: StoryObj<typeof ResultContent> = {
  render: () => <ResultContent />,
  decorators: [decorator],
};

// --- ErrorContent ---
export const ErrorMessage: StoryObj<typeof ErrorContent> = {
  render: (args) => <ErrorContent {...args} />,
  args: { content: 'Connection timed out after 30s' },
  decorators: [decorator],
};

// --- CompactBoundaryContent ---
export const CompactBoundary: StoryObj<typeof CompactBoundaryContent> = {
  render: () => <CompactBoundaryContent />,
  decorators: [decorator],
};

// --- InterruptContent ---
export const Interrupt: StoryObj<typeof InterruptContent> = {
  render: () => <InterruptContent />,
  decorators: [decorator],
};

// --- MetaContent ---
export const MetaInfo: StoryObj<typeof MetaContent> = {
  render: (args) => <MetaContent {...args} />,
  args: { content: 'Using claude-sonnet-4-20250514 model' },
  decorators: [decorator],
};

// --- SlashCommandResultContent ---
export const SlashCommandSingleLine: StoryObj<typeof SlashCommandResultContent> = {
  render: (args) => <SlashCommandResultContent {...args} />,
  args: { content: 'Set model to claude-sonnet-4-20250514' },
  decorators: [decorator],
};

export const SlashCommandMultiLine: StoryObj<typeof SlashCommandResultContent> = {
  render: (args) => <SlashCommandResultContent {...args} />,
  args: { content: '## Available commands\n- /model\n- /clear\n- /help' },
  decorators: [decorator],
};

// --- RateLimitContent ---
export const RateLimit: StoryObj<typeof RateLimitContent> = {
  render: (args) => <RateLimitContent {...args} />,
  args: {
    content: 'Rate limited, retrying in 30s',
    meta: {
      rateLimitInfo: {
        rateLimitType: 'token',
        resetsAt: Date.now() + 30000,
        isUsingOverage: false,
      },
    },
  },
  decorators: [decorator],
};

// --- TaskStartedContent ---
export const TaskStarted: StoryObj<typeof TaskStartedContent> = {
  render: (args) => <TaskStartedContent {...args} />,
  args: { content: 'Analyzing codebase', meta: { taskType: 'subagent' } },
  decorators: [decorator],
};

// --- StreamlinedTextContent ---
export const StreamlinedText: StoryObj<typeof StreamlinedTextContent> = {
  render: (args) => <StreamlinedTextContent {...args} />,
  args: { content: 'Quick analysis complete. No issues found.' },
  decorators: [decorator],
};

// --- StreamlinedToolSummaryContent ---
export const StreamlinedToolSummary: StoryObj<typeof StreamlinedToolSummaryContent> = {
  render: (args) => <StreamlinedToolSummaryContent {...args} />,
  args: { content: 'Read 3 files, edited 1 file, ran 2 commands' },
  decorators: [decorator],
};

// --- ContentBlockStart ---
export const BlockStart: StoryObj<typeof ContentBlockStart> = {
  render: (args) => <ContentBlockStart {...args} />,
  args: { meta: { blockType: 'tool_use' } },
  decorators: [decorator],
};

// --- DocumentContent ---
export const Document: StoryObj<typeof DocumentContent> = {
  render: (args) => <DocumentContent {...args} />,
  args: { content: 'report.pdf', meta: { title: 'Monthly Report' } },
  decorators: [decorator],
};
