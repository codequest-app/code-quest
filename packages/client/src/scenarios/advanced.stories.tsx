import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, withScenario } from '../test/story-decorator';
import {
  makeMultiToolChainAdvanced,
  makeStreamlinedOutput,
  makeTaskStarted,
  makeThinkingBlock,
} from '../test/story-fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  title: 'Scenarios/Advanced',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThinkingBlock: Story = {
  args: { title: 'Caching strategy' },
  decorators: [withScenario({ messages: makeThinkingBlock() })],
  play: expectTextbox,
};

export const MultiToolChain: Story = {
  args: { title: 'TODO report' },
  decorators: [withScenario({ messages: makeMultiToolChainAdvanced() })],
  play: expectTextbox,
};

export const StreamlinedOutput: Story = {
  args: { title: 'ESLint setup' },
  decorators: [withScenario({ messages: makeStreamlinedOutput() })],
  play: expectTextbox,
};

export const TaskStarted: Story = {
  args: { title: 'Auth refactor' },
  decorators: [withScenario({ messages: makeTaskStarted() })],
  play: expectTextbox,
};
