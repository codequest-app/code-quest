import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStoryApp } from '@/test/story-decorator';
import { TabContainer } from './TabContainer.tsx';

const meta: Meta<typeof TabContainer> = {
  component: TabContainer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryApp({ className: 'h-screen flex flex-col bg-bg text-text' })],
} satisfies Meta<typeof TabContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { projectCwd: '/projects/cc-office' },
};

export const WithProjectCwd: Story = {
  args: { projectCwd: '/Users/demo/my-app' },
};

export const LongProjectPath: Story = {
  args: { projectCwd: '/Users/demo/workspace/organizations/acme-corp/services/api-gateway' },
};
