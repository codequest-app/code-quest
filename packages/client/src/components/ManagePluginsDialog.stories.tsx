import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ManagePluginsDialog } from './ManagePluginsDialog';

const meta: Meta<typeof ManagePluginsDialog> = {
  component: ManagePluginsDialog,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'bg-bg text-text min-h-100' })],
} satisfies Meta<typeof ManagePluginsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
  },
};
