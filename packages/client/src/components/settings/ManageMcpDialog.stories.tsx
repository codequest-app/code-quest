import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../../test/story-decorator';
import { ManageMcpDialog } from './ManageMcpDialog';

const meta: Meta<typeof ManageMcpDialog> = {
  component: ManageMcpDialog,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'bg-bg text-text min-h-100' })],
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

export const ManageableDetail: Story = {
  name: '← Back button (detail view)',
  args: {
    open: true,
    onClose: fn(),
    servers: [
      { name: 'filesystem', enabled: true, status: 'connected', scope: 'project' },
      { name: 'github', enabled: false, status: 'disconnected', scope: 'user' },
    ],
    onReconnect: fn(async () => {}),
    onToggle: fn(async () => {}),
  },
  play: async ({ canvas }) => {
    const { userEvent } = await import('storybook/test');
    const row = canvas.getByText('filesystem');
    await userEvent.click(row);
  },
};
