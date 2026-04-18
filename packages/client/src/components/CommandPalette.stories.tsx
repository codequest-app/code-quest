import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import type { Message } from '../types/ui';
import { CommandPalette } from './CommandPalette';

const messages: Message[] = [
  {
    id: '1',
    role: 'user',
    timestamp: Date.now() - 3000,
    type: 'text',
    content: 'Fix the login bug',
  },
  {
    id: '2',
    role: 'assistant',
    timestamp: Date.now() - 2000,
    type: 'text',
    content: 'Looking at the authentication logic now.',
  },
  {
    id: '3',
    role: 'assistant',
    timestamp: Date.now() - 1000,
    type: 'tool_use',
    content: 'Read',
    meta: { toolId: 't1', name: 'Read', input: {} },
  } as Message,
];

const meta = {
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: fn(), onJumpTo: fn(), onToggleRawPanel: fn() },
  decorators: [withStoryChannel({ messages: { messages }, className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const RawPanelActive: Story = { args: { rawPanelActive: true } };
export const Closed: Story = { args: { open: false } };
