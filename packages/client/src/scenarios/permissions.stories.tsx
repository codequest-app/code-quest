import type { PendingControl } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, SCENARIO_CLASS, withStoryChannel } from '../test/story-decorator';
import type { Message } from '../types/ui';
import { planReviewFlow, toolApprovalFlow, toolDenialFlow } from './permissions.fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  title: 'Scenarios/Permissions',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

function withPendingChannel(createFlow: () => { messages: Message[]; pending: PendingControl[] }) {
  const { messages, pending } = createFlow();
  return withStoryChannel({
    className: SCENARIO_CLASS,
    messages: { messages },
    pendingControls: pending,
  });
}

export const ToolApproval: Story = {
  args: { title: 'Clean build artifacts' },
  decorators: [withPendingChannel(toolApprovalFlow)],
  play: expectTextbox,
};

export const ToolDenial: Story = {
  args: { title: 'Delete log files' },
  decorators: [withPendingChannel(toolDenialFlow)],
  play: expectTextbox,
};

export const PlanReview: Story = {
  args: { title: 'Refactor auth module' },
  decorators: [withPendingChannel(planReviewFlow)],
  play: expectTextbox,
};
