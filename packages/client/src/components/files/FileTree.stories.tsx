import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryApp } from '../../test/story-decorator';
import { FileTree } from './FileTree';

const meta: Meta<typeof FileTree> = {
  component: FileTree,
  tags: ['autodocs'],
  args: { onSelect: fn(), onHighlight: fn() },
  decorators: [withStoryApp({ className: 'w-90 h-100 bg-bg text-text p-2 overflow-auto' })],
} satisfies Meta<typeof FileTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HighlightedPath: Story = {
  args: { highlightedPath: '/Users/demo/project' },
};

export const WithDeepHighlight: Story = {
  args: { highlightedPath: '/Users/demo/project/src/components/deep/nested' },
};
