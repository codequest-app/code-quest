import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AttachMenu } from './AttachMenu';

const meta = {
  component: AttachMenu,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttachMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBothActions: Story = {
  args: {
    onAttachFile: fn(),
    onMentionFile: fn(),
  },
};

export const AttachOnly: Story = {
  args: {
    onAttachFile: fn(),
  },
};

export const MentionOnly: Story = {
  args: {
    onMentionFile: fn(),
  },
};
