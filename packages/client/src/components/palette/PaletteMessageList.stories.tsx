import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withThemePreset } from '@/test/story-decorator';
import type { Message } from '@/types/ui';
import { PaletteMessageList } from './PaletteMessageList.tsx';

const baseMessages: Message[] = [
  { id: '1', role: 'user', timestamp: 1000, type: 'text', content: 'Fix the login bug' },
  {
    id: '2',
    role: 'assistant',
    timestamp: 2000,
    type: 'text',
    content: 'Looking at the authentication logic now.',
  },
  {
    id: '3',
    role: 'assistant',
    timestamp: 3000,
    type: 'tool_use',
    content: 'Read',
    meta: { toolId: 't1', name: 'Read', input: {} },
  } as Message,
  {
    id: '4',
    role: 'assistant',
    timestamp: 4000,
    type: 'text',
    content: 'Found the issue in useSession hook.',
  },
  {
    id: '5',
    role: 'user',
    timestamp: 5000,
    type: 'text',
    content: 'Run the tests please',
  },
];

const meta: Meta<typeof PaletteMessageList> = {
  component: PaletteMessageList,
  tags: ['autodocs'],
  args: {
    activeIdx: 0,
    onActiveChange: fn(),
    onJumpTo: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-surface text-text w-160 p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaletteMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { messages: [], query: '' },
};

export const Recent: Story = {
  args: { messages: baseMessages, query: '' },
};

export const WithSearch: Story = {
  args: { messages: baseMessages, query: 'login' },
};

export const Active: Story = {
  args: { messages: baseMessages, query: '', activeIdx: 2 },
};

export const WithSectionHeader: Story = {
  args: { messages: baseMessages, query: '', showHeader: true },
};

export const Light: Story = {
  args: { messages: baseMessages, query: 'login', activeIdx: 0 },
  decorators: [withThemePreset({ theme: 'light' })],
};
