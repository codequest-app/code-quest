import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ToolbarDialogs } from './ToolbarDialogs';

const baseArgs = {
  activeDialog: null,
  closeDialog: fn(),
  mcpServers: [],
  mcpToggle: fn(async () => ({ ok: true }) as never),
  mcpReconnect: fn(async () => ({ ok: true }) as never),
  mcpRefresh: fn(async () => {}),
  mcpAuthenticate: fn(async () => ({ ok: true, data: {} }) as never),
  mcpClearAuth: fn(async () => ({ ok: true, data: {} }) as never),
  initOptions: {},
  setInitOptions: fn(),
  usageQuota: null,
  contextUsage: null,
  stats: undefined,
  accountInfo: null,
  providerConfig: undefined,
  rewindToMessage: fn(async () => ({ ok: true, data: { canRewind: false } }) as never),
  forkSession: fn(
    async () => ({ ok: true, data: { channelId: 'c', parentChannelId: 'p' } }) as never,
  ),
  updateValue: fn(),
};

const meta: Meta<typeof ToolbarDialogs> = {
  component: ToolbarDialogs,
  tags: ['autodocs'],
  args: baseArgs,
  decorators: [withStoryChannel()],
} satisfies Meta<typeof ToolbarDialogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoActiveDialog: Story = {};
export const ManageMcp: Story = { args: { activeDialog: 'manageMcp' } };
export const McpStatus: Story = { args: { activeDialog: 'mcpStatus' } };
export const Plugins: Story = { args: { activeDialog: 'plugins' } };
