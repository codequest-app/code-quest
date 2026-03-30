import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createSocket } from '../socket/client';
import { AuthDialog } from './AuthDialog';

const socket = createSocket();

const meta = {
  component: AuthDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <div className="bg-bg text-text min-h-[300px]">
            <Story />
          </div>
        </SessionProvider>
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof AuthDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
};

export const Closed: Story = {
  args: { open: false },
};
