import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../test/story-decorator';
import { ChatPanel } from './ChatPanel';

const meta = {
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: 'h-150 bg-bg text-text' })],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};
