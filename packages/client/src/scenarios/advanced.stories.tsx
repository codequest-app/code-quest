import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatSession } from '../components/chat/ChatSession.tsx';
import { expectTextbox, withScenario } from '../test/story-decorator.tsx';
import {
  makeMultiToolChainAdvanced,
  makeStreamlinedOutput,
  makeTaskStarted,
  makeThinkingBlock,
} from '../test/story-fixtures.ts';

const meta: Meta<typeof ChatSession> = {
  component: ChatSession,
  title: 'Scenarios/Advanced',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThinkingBlock: Story = {
  args: { title: 'Caching strategy' },
  decorators: [withScenario(makeThinkingBlock())],
  play: expectTextbox,
};

export const MultiToolChain: Story = {
  args: { title: 'TODO report' },
  decorators: [withScenario(makeMultiToolChainAdvanced())],
  play: expectTextbox,
};

export const StreamlinedOutput: Story = {
  args: { title: 'ESLint setup' },
  decorators: [withScenario(makeStreamlinedOutput())],
  play: expectTextbox,
};

export const TaskStarted: Story = {
  args: { title: 'Auth refactor' },
  decorators: [withScenario(makeTaskStarted())],
  play: expectTextbox,
};
