import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, withScenario } from '../test/story-decorator';
import {
  makeDisconnectedSession,
  makeLongConversation,
  makeProcessingWithTool,
} from '../test/story-fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  title: 'Scenarios/Session',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompletedSession: Story = {
  args: { title: 'Fix login bug' },
  decorators: [withScenario({ messages: makeLongConversation() })],
  play: expectTextbox,
};

export const Processing: Story = {
  args: { title: 'Search TODOs' },
  decorators: [withScenario({ messages: makeProcessingWithTool(), status: 'processing' })],
  play: expectTextbox,
};

export const Disconnected: Story = {
  args: { title: 'File listing' },
  decorators: [withScenario({ messages: makeDisconnectedSession(), status: 'disconnected' })],
  play: expectTextbox,
};
