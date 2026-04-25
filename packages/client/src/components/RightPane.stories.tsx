import type { Meta, StoryObj } from '@storybook/react-vite';
import { RightPaneScopeProvider } from '../contexts/RightPaneScopeContext';
import { withStoryApp } from '../test/story-decorator';
import { RightPane } from './RightPane';

const meta = {
  title: 'Components/RightPane',
  component: RightPane,
  args: { closeMode: 'collapse', onMention: () => {} },
  decorators: [withStoryApp({ className: 'h-screen w-80 bg-surface' })],
} satisfies Meta<typeof RightPane>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <RightPaneScopeProvider activeCwd="/projects/my-app">
        <Story />
      </RightPaneScopeProvider>
    ),
  ],
};

export const NoScope: Story = {
  decorators: [
    (Story) => (
      <RightPaneScopeProvider activeCwd={null}>
        <Story />
      </RightPaneScopeProvider>
    ),
  ],
};
