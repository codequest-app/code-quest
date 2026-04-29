import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../../test/story-decorator';
import { ChatInputArea } from './ChatInputArea';

const meta: Meta<typeof ChatInputArea> = {
  component: ChatInputArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ChatInputArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [withStoryChannel()] };

export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' } })],
};

export const WithPermissionMode: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'acceptEdits' } })],
};
