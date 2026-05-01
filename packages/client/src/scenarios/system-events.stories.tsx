import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatPanel } from '../components/chat/ChatPanel';
import { expectTextbox, withScenario } from '../test/story-decorator';
import {
  makeCompactBoundary,
  makeErrorRecovery,
  makeHookExecution,
  makeInterrupt,
  makeRateLimitEvent,
} from '../test/story-fixtures';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
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
