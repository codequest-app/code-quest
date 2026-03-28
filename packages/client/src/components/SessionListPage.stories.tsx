import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createSocket } from '../socket/client';
import { SessionListPage } from './SessionListPage';

const socket = createSocket();

const meta = {
  component: SessionListPage,
  tags: ['autodocs'],
  args: { onSelect: fn() },
  decorators: [
    (Story) => (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <div className="h-[600px] w-80 bg-surface text-text flex">
            <Story />
          </div>
        </SessionProvider>
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof SessionListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
