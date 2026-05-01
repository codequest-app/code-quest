import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../../test/story-decorator';
import { ChatInputArea } from './ChatInputArea';

// ChatInputArea lives at the bottom of ChatPanel as an absolute overlay.
// Wrap in a representative container so the story matches real usage.
const CLASS = 'relative flex flex-col justify-end h-80 max-w-2xl bg-bg text-text px-4 pb-4';

const meta: Meta<typeof ChatInputArea> = {
  component: ChatInputArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ChatInputArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [withStoryChannel({ className: CLASS })],
};

export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' }, className: CLASS })],
};

export const WithPermissionMode: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'acceptEdits' }, className: CLASS })],
};
