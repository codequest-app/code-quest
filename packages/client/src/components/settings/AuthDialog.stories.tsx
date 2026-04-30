import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../../test/story-decorator';
import { AuthDialog } from './AuthDialog';

const meta: Meta<typeof AuthDialog> = {
  component: AuthDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
  },
  decorators: [withStoryChannel({ className: 'bg-bg text-text min-h-75' })],
} satisfies Meta<typeof AuthDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
};

export const Closed: Story = {
  args: { open: false },
};

export const WithBrowserLogin: Story = {
  args: { open: true },
};
