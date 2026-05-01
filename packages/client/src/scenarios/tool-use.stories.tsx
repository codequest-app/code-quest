import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, withScenario } from '../test/story-decorator';
import {
  makeBashExecution,
  makeEditWithDiff,
  makeLongConversation,
  makeReadAndGrep,
} from '../test/story-fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  title: 'Scenarios/Tool Use',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadAndGrep: Story = {
  args: { title: 'Find login function' },
  decorators: [withScenario({ messages: makeReadAndGrep() })],
  play: expectTextbox,
};

export const EditWithDiff: Story = {
  args: { title: 'Add null-check' },
  decorators: [withScenario({ messages: makeEditWithDiff() })],
  play: expectTextbox,
};

export const BashExecution: Story = {
  args: { title: 'Run tests' },
  decorators: [withScenario({ messages: makeBashExecution() })],
  play: expectTextbox,
};

export const MultiToolChain: Story = {
  args: { title: 'Fix the login bug' },
  decorators: [withScenario({ messages: makeLongConversation() })],
  play: expectTextbox,
};
