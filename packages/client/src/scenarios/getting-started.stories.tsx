import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ChatSession } from '../components/chat/ChatSession.tsx';
import {
  expectTextbox,
  SCENARIO_CLASS,
  withScenario,
  withStoryChannel,
} from '../test/story-decorator.tsx';
import { makeSimpleQA } from '../test/story-fixtures.ts';

const meta: Meta<typeof ChatSession> = {
  component: ChatSession,
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
  decorators: [withScenario(makeSimpleQA())],
  play: expectTextbox,
};
