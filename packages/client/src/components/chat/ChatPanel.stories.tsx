import type { Meta, StoryObj } from '@storybook/react-vite';
import { SCENARIO_CLASS, withScenario, withStoryChannel } from '../../test/story-decorator';
import { ChatPanel } from './ChatPanel';
import {
  heavyToolUseState,
  skillInvocationState,
  subagentDoneState,
  subagentRunningState,
} from './ChatPanel.fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: SCENARIO_CLASS })],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};

export const HeavyToolUse: Story = {
  decorators: [withScenario(heavyToolUseState)],
  args: { title: 'Migrate old API' },
};

export const WithSkillInvocation: Story = {
  decorators: [withScenario(skillInvocationState)],
  args: { title: 'Validate Zod schema' },
};

export const SubagentRunning: Story = {
  decorators: [withScenario(subagentRunningState)],
  args: { title: 'Analyse protocol.md' },
};

export const SubagentDone: Story = {
  decorators: [withScenario(subagentDoneState)],
  args: { title: 'Analyse protocol.md' },
};
