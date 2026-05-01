import type { Meta, StoryObj } from '@storybook/react-vite';
import { SCENARIO_CLASS, withStoryChannel } from '../../test/story-decorator';
import { ChatPanel } from './ChatPanel';

const meta: Meta<typeof ChatPanel> = {
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ className: SCENARIO_CLASS })],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Fix the login bug' },
};
