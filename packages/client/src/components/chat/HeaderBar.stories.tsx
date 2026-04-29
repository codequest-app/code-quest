import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryChannel } from '../../test/story-decorator';
import { HeaderBar } from './HeaderBar';

const meta: Meta<typeof HeaderBar> = {
  component: HeaderBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeaderBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  decorators: [
    withStoryChannel({
      messages: { status: 'idle' },
      config: {
        model: 'claude-sonnet-4-6',
        availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      },
    }),
  ],
};
export const Disconnected: Story = {
  decorators: [
    withStoryChannel({
      messages: { status: 'disconnected' },
      config: { availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }] },
    }),
  ],
};
export const Processing: Story = {
  decorators: [
    withStoryChannel({
      messages: { status: 'processing' },
      config: {
        model: 'claude-sonnet-4-6',
        availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      },
    }),
  ],
};
export const WithTitle: Story = {
  args: { title: 'Fix login bug' },
  decorators: [
    withStoryChannel({
      messages: { status: 'idle' },
      config: {
        model: 'claude-sonnet-4-6',
        availableModels: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      },
    }),
  ],
};
