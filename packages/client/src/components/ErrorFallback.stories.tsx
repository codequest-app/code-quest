import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { ErrorFallback } from './ErrorFallback';

const meta = {
  component: ErrorFallback,
  tags: ['autodocs'],
  args: { resetErrorBoundary: fn() },
  decorators: [
    (Story) => {
      const socket = createSocket();
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story">
                  <div className="h-[400px] bg-bg text-text flex items-center justify-center">
                    <Story />
                  </div>
                </ChannelProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>
      );
    },
  ],
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { error: new Error('Failed to load component') },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/failed to load component/i)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /try again/i }));
    await expect(args.resetErrorBoundary).toHaveBeenCalledOnce();
  },
};

export const LongMessage: Story = {
  args: {
    error: new Error(
      'TypeError: Failed to access property "map" on undefined value at MessageList.tsx:42:18',
    ),
  },
};

export const UnknownError: Story = {
  args: { error: 'Something went wrong unexpectedly' },
};
