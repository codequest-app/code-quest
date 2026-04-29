import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { withStoryChannel } from '../../test/story-decorator';
import { McpServerRow } from './McpServerRow';

const meta: Meta<typeof McpServerRow> = {
  component: McpServerRow,
  tags: ['autodocs'],
  decorators: [
    withStoryChannel({ className: 'w-80 bg-surface text-text border border-border rounded' }),
  ],
  args: {
    onToggle: fn(),
    onReconnect: fn(),
    showFeedback: fn(),
  },
} satisfies Meta<typeof McpServerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    server: { name: 'filesystem', status: 'connected', enabled: true },
  },
};

export const Disconnected: Story = {
  args: {
    server: { name: 'github', status: 'disconnected', enabled: false },
  },
};

export const ErrorState: Story = {
  args: {
    server: { name: 'postgres', status: 'error', enabled: true },
  },
};

export const WithTools: Story = {
  args: {
    server: { name: 'filesystem', status: 'connected', enabled: true },
    onListTools: fn(async () => [
      { name: 'read_file', description: 'Read a file from the filesystem' },
      { name: 'write_file', description: 'Write content to a file' },
      { name: 'list_directory', description: 'List directory contents' },
    ]),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByTitle(/Tools filesystem/i));
    const toolList = await canvas.findByLabelText('tools-filesystem');
    await expect(toolList).toBeInTheDocument();
    await expect(canvas.getByText('read_file')).toBeInTheDocument();
  },
};

export const WithAuth: Story = {
  args: {
    server: { name: 'github', status: 'disconnected', enabled: false },
    onAuthenticate: fn(async () => ({
      ok: true as const,
      data: { authUrl: 'https://github.com/login/oauth/authorize?client_id=xxx' },
    })),
    onOAuthCallback: fn(async () => ({ ok: true as const, data: {} })),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByTitle(/Auth github/i));
    const authLink = await canvas.findByText(/Complete authentication/i);
    await expect(authLink).toBeInTheDocument();
  },
};

export const AllActions: Story = {
  name: 'All action buttons',
  args: {
    server: { name: 'github', status: 'connected', enabled: true },
    onListTools: fn(async () => [{ name: 'read_file', description: 'Read a file' }]),
    onAuthenticate: fn(async () => ({
      ok: true as const,
      data: { authUrl: 'https://example.com/auth' },
    })),
    onClearAuth: fn(async () => ({ ok: true as const, data: {} })),
  },
};

export const ToggleOn: Story = {
  args: {
    server: { name: 'filesystem', status: 'connected', enabled: false },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByTitle(/Toggle filesystem/i));
    await expect(args.onToggle).toHaveBeenCalledWith('filesystem', true);
  },
};
