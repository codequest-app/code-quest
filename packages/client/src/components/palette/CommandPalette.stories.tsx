import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { CommandPaletteProvider, useCommandPalette } from '@/contexts/CommandPaletteContext';
import { useMessageRegistryStore } from '@/stores/useMessageRegistryStore';
import { withStoryChannel, withThemePreset } from '@/test/story-decorator';
import type { Message } from '@/types/ui';
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

function AutoOpen({ tab }: { tab?: string }) {
  const { openPalette } = useCommandPalette();
  useEffect(() => {
    openPalette(tab ? { tab } : undefined);
  }, [openPalette, tab]);
  return null;
}

function SeedRegistry() {
  useEffect(() => {
    useMessageRegistryStore.getState().register('story', { projectCwd: '/demo', messages });
    return () => useMessageRegistryStore.getState().unregister('story');
  }, []);
  return null;
}

function PaletteStory({ tab }: { tab?: string }) {
  return (
    <CommandPaletteProvider>
      <SeedRegistry />
      <AutoOpen tab={tab} />
      <CommandPalette />
    </CommandPaletteProvider>
  );
}

const meta: Meta<typeof CommandPalette> = {
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withStoryChannel({ messages: { messages }, className: 'h-screen bg-bg text-text' })],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PaletteStory />,
};

export const MessagesTab: Story = {
  render: () => <PaletteStory tab="messages" />,
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <PaletteStory />,
};

export const DarkComfortable: Story = {
  decorators: [withThemePreset({ theme: 'dark', density: 'comfortable' })],
  render: () => <PaletteStory />,
};

export const DarkCompact: Story = {
  decorators: [withThemePreset({ theme: 'dark', density: 'compact' })],
  render: () => <PaletteStory />,
};

export const LightComfortable: Story = {
  decorators: [withThemePreset({ theme: 'light', density: 'comfortable' })],
  render: () => <PaletteStory />,
};

export const LightCompact: Story = {
  decorators: [withThemePreset({ theme: 'light', density: 'compact' })],
  render: () => <PaletteStory />,
};
