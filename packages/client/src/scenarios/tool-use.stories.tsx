import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel.tsx';
import { expectTextbox, withScenario } from '../test/story-decorator.tsx';
import {
  makeBashExecution,
  makeEditWithDiff,
  makeLongConversation,
  makeReadAndGrep,
} from '../test/story-fixtures.ts';

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
  decorators: [withScenario(makeReadAndGrep())],
  play: expectTextbox,
};

export const EditWithDiff: Story = {
  args: { title: 'Add null-check' },
  decorators: [withScenario(makeEditWithDiff())],
  play: expectTextbox,
};

export const BashExecution: Story = {
  args: { title: 'Run tests' },
  decorators: [withScenario(makeBashExecution())],
  play: expectTextbox,
};

export const MultiToolChain: Story = {
  args: { title: 'Fix the login bug' },
  decorators: [withScenario(makeLongConversation())],
  play: expectTextbox,
};
