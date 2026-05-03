import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatSession } from '../components/chat/ChatSession.tsx';
import { expectTextbox, withScenario } from '../test/story-decorator.tsx';
import {
  makeDisconnectedSession,
  makeLongConversation,
  makeProcessingWithTool,
} from '../test/story-fixtures.ts';

const meta: Meta<typeof ChatSession> = {
  component: ChatSession,
  title: 'Scenarios/Session',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompletedSession: Story = {
  args: { title: 'Fix login bug' },
  decorators: [withScenario(makeLongConversation())],
  play: expectTextbox,
};

export const Processing: Story = {
  args: { title: 'Search TODOs' },
  decorators: [withScenario({ ...makeProcessingWithTool(), status: 'processing' })],
  play: expectTextbox,
};

export const Disconnected: Story = {
  args: { title: 'File listing' },
  decorators: [withScenario({ ...makeDisconnectedSession(), status: 'disconnected' })],
  play: expectTextbox,
};
