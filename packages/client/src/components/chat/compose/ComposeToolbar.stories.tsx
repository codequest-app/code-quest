import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../../test/story-decorator';
import { ComposeToolbar } from './ComposeToolbar';

const meta: Meta<typeof ComposeToolbar> = {
  component: ComposeToolbar,
  tags: ['autodocs'],
} satisfies Meta<typeof ComposeToolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'normal' } })],
};
export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' } })],
};
export const AcceptEdits: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'acceptEdits' } })],
};
export const WithUsage: Story = {
  decorators: [withStoryChannel({ messages: { stats: { inputTokens: 120000 } } })],
};
