import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ChatPanel } from '../components/chat/ChatPanel';
import {
  expectTextbox,
  SCENARIO_CLASS,
  withScenario,
  withStoryChannel,
} from '../test/story-decorator';
import { makeSimpleQA } from '../test/story-fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  title: 'Scenarios/Getting Started',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptySession: Story = {
  decorators: [withStoryChannel({ className: SCENARIO_CLASS })],
  play: async ({ canvas }) => {
    await expect(await canvas.findByPlaceholderText(/focus or unfocus/i)).toBeInTheDocument();
  },
};

export const SimpleQA: Story = {
  args: { title: 'Project overview' },
  decorators: [withScenario({ messages: makeSimpleQA() })],
  play: expectTextbox,
};
