import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../test/story-decorator';
import { ChatPanel } from './ChatPanel';

const CLASS = 'h-150 bg-bg text-text';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: CLASS })],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};
