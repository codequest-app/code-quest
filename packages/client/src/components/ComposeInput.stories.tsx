import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../test/story-decorator';
import { ChatInputArea } from './ChatInputArea';

const meta = {
  component: ChatInputArea,
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof ChatInputArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [withStoryChannel()] };
export const WithSlashCommands: Story = {
  decorators: [withStoryChannel({ config: { slashCommands: ['compact', 'cost', 'review'] } })],
};
export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' } })],
};
