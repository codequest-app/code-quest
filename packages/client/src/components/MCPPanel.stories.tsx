import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { MCPPanel } from './MCPPanel';

const meta = {
  component: MCPPanel,
  tags: ['autodocs'],
  args: {
    onToggle: fn(),
    onReconnect: fn(),
    onRefresh: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-72 bg-surface text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MCPPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithServers: Story = {
  args: {
    servers: [
      { name: 'filesystem', enabled: true, status: 'connected' },
      { name: 'github', enabled: true, status: 'error' },
      { name: 'slack', enabled: false, status: 'disconnected' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/toggle filesystem/i));
    await expect(args.onToggle).toHaveBeenCalledWith('filesystem', false);
  },
};

export const Empty: Story = {
  args: { servers: [] },
};

export const WithAddServer: Story = {
  args: {
    servers: [{ name: 'filesystem', enabled: true, status: 'connected' }],
    onSetServers: fn().mockResolvedValue(undefined),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText(/server name/i), 'my-server');
    await userEvent.type(canvas.getByPlaceholderText(/command/i), 'npx my-mcp');
    await userEvent.click(canvas.getByRole('button', { name: /^add$/i }));
    await expect(args.onSetServers).toHaveBeenCalledWith({
      'my-server': { command: 'npx my-mcp' },
    });
  },
};

export const WithReconnect: Story = {
  args: {
    servers: [{ name: 'github', enabled: true, status: 'error' }],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTitle(/reconnect github/i));
    await expect(args.onReconnect).toHaveBeenCalledWith('github');
  },
};
