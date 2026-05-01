import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, withScenario } from '../test/story-decorator';
import {
  multiToolChainState,
  streamlinedOutputState,
  taskStartedState,
  thinkingBlockState,
} from './advanced.fixtures';

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
  decorators: [withScenario(thinkingBlockState)],
  play: expectTextbox,
};

export const MultiToolChain: Story = {
  args: { title: 'TODO report' },
  decorators: [withScenario(multiToolChainState)],
  play: expectTextbox,
};

export const StreamlinedOutput: Story = {
  args: { title: 'ESLint setup' },
  decorators: [withScenario(streamlinedOutputState)],
  play: expectTextbox,
};

export const TaskStarted: Story = {
  args: { title: 'Auth refactor' },
  decorators: [withScenario(taskStartedState)],
  play: expectTextbox,
};
