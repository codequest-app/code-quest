import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withStoryChannel, withThemePreset } from '../test/story-decorator';
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

export const DarkComfortable: Story = {
  decorators: [withThemePreset({ theme: 'dark', density: 'comfortable' })],
};
export const DarkCompact: Story = {
  decorators: [withThemePreset({ theme: 'dark', density: 'compact' })],
};
export const LightComfortable: Story = {
  decorators: [withThemePreset({ theme: 'light', density: 'comfortable' })],
  play: async () => {
    const dialog = document.querySelector<HTMLElement>('[data-testid="command-palette-dialog"]');
    if (!dialog) throw new Error('command-palette-dialog not found');
    await expect(document.documentElement.dataset.theme).toBe('light');
    // Assert the dialog responds to the theme token by comparing its
    // resolved background against the computed token value (both in the
    // browser's rgb(…) form, avoiding hex/rgb format skew).
    const probe = document.createElement('div');
    probe.style.background = 'var(--color-floating-bg-from)';
    document.body.appendChild(probe);
    const resolvedBgFrom = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(getComputedStyle(dialog).backgroundImage).toContain(resolvedBgFrom);
  },
};
export const LightCompact: Story = {
  decorators: [withThemePreset({ theme: 'light', density: 'compact' })],
};
