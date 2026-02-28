import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderBar } from './HeaderBar';

const meta = {
  component: HeaderBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { status: 'idle', sessionId: 'session-abc-123' },
};

export const Disconnected: Story = {
  args: { status: 'disconnected', sessionId: null },
};

export const Processing: Story = {
  args: { status: 'processing', sessionId: 'session-abc-123' },
};
