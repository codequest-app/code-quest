import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ChatPanel } from './ChatPanel';

const meta = {
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: 'h-[600px] bg-bg text-text' })],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SendMessage: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'Hello Claude');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Hello Claude')).toBeInTheDocument();
  },
};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};

export const Processing: Story = {};
