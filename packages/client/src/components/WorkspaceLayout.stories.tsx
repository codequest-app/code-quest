import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryApp } from '../test/story-decorator';
import { WorkspaceLayout } from './WorkspaceLayout';

const meta = {
  component: WorkspaceLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryApp({ className: 'h-150 flex flex-col bg-bg text-text' })],
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
