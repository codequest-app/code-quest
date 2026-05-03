import type { Meta, StoryObj } from '@storybook/react-vite';
import { SCENARIO_CLASS, withStoryChannel } from '@/test/story-decorator';
import {
  makeHeavyToolUseConversation,
  makeSkillInvocationConversation,
  makeSubagentDone,
  makeSubagentRunning,
} from '@/test/story-fixtures';
import { ChatSession } from './ChatSession.tsx';

const meta: Meta<typeof ChatSession> = {
  component: ChatSession,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: SCENARIO_CLASS })],
} satisfies Meta<typeof ChatSession>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};

export const HeavyToolUse: Story = {
  decorators: [
    withStoryChannel({
      className: SCENARIO_CLASS,
      messages: makeHeavyToolUseConversation(),
    }),
  ],
  args: { title: 'Migrate old API' },
};

export const WithSkillInvocation: Story = {
  decorators: [
    withStoryChannel({
      className: SCENARIO_CLASS,
      messages: makeSkillInvocationConversation(),
    }),
  ],
  args: { title: 'Validate Zod schema' },
};

export const SubagentRunning: Story = {
  decorators: [
    withStoryChannel({
      className: SCENARIO_CLASS,
      messages: makeSubagentRunning(),
    }),
  ],
  args: { title: 'Analyse protocol.md' },
};

export const SubagentDone: Story = {
  decorators: [
    withStoryChannel({
      className: SCENARIO_CLASS,
      messages: makeSubagentDone(),
    }),
  ],
  args: { title: 'Analyse protocol.md' },
};
