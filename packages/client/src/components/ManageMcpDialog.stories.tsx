import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ManageMcpDialog } from './ManageMcpDialog';

const meta = {
  component: ManageMcpDialog,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'bg-bg text-text min-h-[400px]' })],
} satisfies Meta<typeof ManageMcpDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithServers: Story = {
  args: {
    open: true,
    onClose: fn(),
    servers: [
      { name: 'filesystem', enabled: true, status: 'connected', scope: 'project' },
      { name: 'github', enabled: true, status: 'failed' },
    ],
    onReconnect: fn(),
  },
};
export const Empty: Story = { args: { open: true, onClose: fn(), servers: [] } };
