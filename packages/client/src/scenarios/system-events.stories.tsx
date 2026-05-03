import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatSession } from '../components/chat/ChatSession.tsx';
import { expectTextbox, withScenario } from '../test/story-decorator.tsx';
import {
  makeCompactBoundary,
  makeErrorRecovery,
  makeHookExecution,
  makeInterrupt,
  makeRateLimitEvent,
} from '../test/story-fixtures.ts';

const meta: Meta<typeof ChatSession> = {
  component: ChatSession,
  title: 'Scenarios/System Events',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorRecovery: Story = {
  args: { title: 'Database migration' },
  decorators: [withScenario(makeErrorRecovery())],
  play: expectTextbox,
};

export const RateLimit: Story = {
  args: { title: 'Test migration' },
  decorators: [withScenario(makeRateLimitEvent())],
  play: expectTextbox,
};

export const CompactBoundary: Story = {
  args: { title: 'Debug auth flow' },
  decorators: [withScenario(makeCompactBoundary())],
  play: expectTextbox,
};

export const Interrupt: Story = {
  args: { title: 'Test analysis' },
  decorators: [withScenario(makeInterrupt())],
  play: expectTextbox,
};

export const HookExecution: Story = {
  args: { title: 'Git commit' },
  decorators: [withScenario(makeHookExecution())],
  play: expectTextbox,
};
