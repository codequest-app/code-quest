import type { Meta, StoryObj } from '@storybook/react-vite';
import { RightPaneScopeProvider } from '../contexts/RightPaneScopeContext';
import { RightPanePaneBar } from './RightPanePaneBar';

const meta = {
  title: 'Components/RightPanePaneBar',
  component: RightPanePaneBar,
  args: { closeMode: 'collapse' },
  decorators: [
    (Story) => (
      <div className="w-80 bg-surface border border-border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RightPanePaneBar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Follow: Story = {
  decorators: [
    (Story) => (
      <RightPaneScopeProvider activeCwd="/projects/my-app">
        <Story />
      </RightPaneScopeProvider>
    ),
  ],
};

export const Pinned: Story = {
  decorators: [
    (Story) => {
      sessionStorage.setItem(
        'right-pane-scope',
        JSON.stringify({ mode: 'pinned', cwd: '/projects/my-app' }),
      );
      return (
        <RightPaneScopeProvider activeCwd="/projects/other">
          <Story />
        </RightPaneScopeProvider>
      );
    },
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
