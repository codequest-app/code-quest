import { ChatBubbleLeftRightIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { EmptyState } from './EmptyState';

const meta = {
  component: EmptyState,
  tags: ['autodocs'],
  args: { onAction: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-[320px] bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSessions: Story = {
  args: {
    icon: <ChatBubbleLeftRightIcon className="w-10 h-10" />,
    message: 'No open sessions',
    actionLabel: 'New Session',
  },
};

export const NoProjects: Story = {
  args: {
    icon: <FolderOpenIcon className="w-10 h-10" />,
    message: 'Pick a project to get started',
    actionLabel: 'Add Project',
  },
};

export const WithoutIcon: Story = {
  args: { message: 'Nothing here yet', actionLabel: 'Create' },
};
