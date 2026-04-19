import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { PermissionModePicker } from './PermissionModePicker';

const meta = {
  component: PermissionModePicker,
  tags: ['autodocs'],
  args: { onSetPermissionMode: fn(), onSetEffort: fn() },
  decorators: [withStoryChannel({ className: 'bg-bg text-text p-4 flex justify-end min-h-15' })],
} satisfies Meta<typeof PermissionModePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { mode: 'normal', effort: 'high' } };
export const AcceptEdits: Story = { args: { mode: 'acceptEdits', effort: 'max' } };
export const PlanMode: Story = { args: { mode: 'plan', effort: 'medium' } };
export const BypassPermissions: Story = { args: { mode: 'bypassPermissions', effort: 'low' } };
