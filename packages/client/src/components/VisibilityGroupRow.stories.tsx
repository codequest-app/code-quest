import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { VISIBILITY_GROUPS } from '../contexts/channel/MessageVisibilityContext';
import { withStoryChannel } from '../test/story-decorator';
import { VisibilityGroupRow } from './VisibilityGroupRow';

const firstGroupId = VISIBILITY_GROUPS[0].id;

const meta = {
  component: VisibilityGroupRow,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'w-[320px] bg-bg text-text' })],
} satisfies Meta<typeof VisibilityGroupRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { groupId: firstGroupId } };
export const Flat: Story = { args: { groupId: firstGroupId, flat: true } };
export const OtherGroup: Story = { args: { groupId: 'other' } };
export const WithPartialHandler: Story = {
  args: { groupId: firstGroupId, onPartialClick: fn() },
};
