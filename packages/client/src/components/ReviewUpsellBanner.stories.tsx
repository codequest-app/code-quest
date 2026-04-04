import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { ReviewUpsellBanner } from './ReviewUpsellBanner';

const meta = {
  component: ReviewUpsellBanner,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const socket = createSocket();
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story">
                  <div className="max-w-2xl bg-surface text-text p-4">
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
} satisfies Meta<typeof ReviewUpsellBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('review-upsell-banner')).toBeInTheDocument();
    await expect(canvas.getByText(/try the new code review feature/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  },
};
