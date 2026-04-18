import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ActionsTab } from './ActionsTab';

const meta = {
  component: ActionsTab,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'w-[320px] bg-bg text-text' })],
} satisfies Meta<typeof ActionsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onToggleRawPanel: fn(), rawPanelActive: false },
};

export const RawPanelActive: Story = {
  args: { onToggleRawPanel: fn(), rawPanelActive: true },
};

export const Flat: Story = {
  args: { flat: true, onToggleRawPanel: fn(), rawPanelActive: false },
};
