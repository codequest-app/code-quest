import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../test/story-decorator';
import { TerminalPanel } from './TerminalPanel';

const meta = { component: TerminalPanel, tags: ['autodocs'] } satisfies Meta<typeof TerminalPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithSession: Story = {
  decorators: [
    withStoryChannel({
      messages: {
        terminalSessions: {
          s1: { id: 's1', title: 'Terminal 1', outputLines: ['$ git status', 'On branch main'] },
        },
      },
      className: 'h-[400px] w-72 bg-bg text-text',
    }),
  ],
};
export const Empty: Story = {
  decorators: [
    withStoryChannel({
      messages: { terminalSessions: {} },
      className: 'h-[400px] w-72 bg-bg text-text',
    }),
  ],
};
