import { Cog6ToothIcon, FolderIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ActivityBar } from './ActivityBar';

const items = [
  { id: 'projects', icon: <FolderIcon className="w-5 h-5" />, title: 'Projects' },
  { id: 'plugins', icon: <PuzzlePieceIcon className="w-5 h-5" />, title: 'Plugins' },
  { id: 'settings', icon: <Cog6ToothIcon className="w-5 h-5" />, title: 'Settings' },
];

const meta = {
  component: ActivityBar,
  tags: ['autodocs'],
  args: { items, onToggle: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-[240px] bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { activePanel: null } };
export const ProjectsActive: Story = { args: { activePanel: 'projects' } };
export const PluginsActive: Story = { args: { activePanel: 'plugins' } };
export const WithSettingsGear: Story = {
  args: { activePanel: null, onOpenSettings: fn() },
};
