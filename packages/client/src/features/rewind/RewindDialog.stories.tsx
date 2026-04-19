import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../../test/story-decorator';
import { RewindDialog } from './RewindDialog';

const meta = {
  component: RewindDialog,
  tags: ['autodocs'],
  decorators: [
    withStoryChannel({
      className: 'bg-bg text-text min-h-100 flex items-center justify-center',
    }),
  ],
} satisfies Meta<typeof RewindDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
  },
};
