import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChannelProvider } from '../contexts/channel';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import { InstalledPluginList } from './InstalledPluginList';

const meta = {
  component: InstalledPluginList,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const socket = createSocket();
      return (
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ChannelProvider channelId="story">
                  <div className="bg-bg text-text max-w-md p-4">
                    <Story />
                  </div>
                </ChannelProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>
      );
    },
  ],
  args: {
    onSearchChange: fn(),
    onToggle: fn(),
    onUninstall: fn(),
    onInstall: fn(),
  },
} satisfies Meta<typeof InstalledPluginList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInstalledPlugins: Story = {
  args: {
    installed: [
      {
        id: 'prettier@1.0.0',
        enabled: true,
        version: '1.0.0',
        scope: 'user',
        installPath: '/plugins/prettier',
        installedAt: '2026-01-01T00:00:00Z',
        lastUpdated: '2026-01-01T00:00:00Z',
      },
      {
        id: 'eslint@2.1.0',
        enabled: false,
        version: '2.1.0',
        scope: 'workspace',
        installPath: '/plugins/eslint',
        installedAt: '2026-01-15T00:00:00Z',
        lastUpdated: '2026-01-15T00:00:00Z',
      },
    ],
    available: [],
    marketplaces: [],
    searchQuery: '',
    installing: null,
  },
};

export const WithAvailablePlugins: Story = {
  args: {
    installed: [],
    available: [
      {
        pluginId: 'typescript-tools',
        name: 'TypeScript Tools',
        description: 'Enhanced TypeScript support',
        marketplaceName: 'official',
        version: '1.0.0',
        source: 'npm',
        installCount: 12500,
      },
      {
        pluginId: 'docker-helper',
        name: 'Docker Helper',
        description: 'Docker compose management',
        marketplaceName: 'community',
        version: '0.5.0',
        source: 'github',
        installCount: 340,
      },
    ],
    marketplaces: [
      {
        name: 'official',
        config: {
          source: { source: 'github', repo: 'anthropics/claude-plugins-official' },
          installLocation: '/plugins',
        },
        pluginCount: 10,
        installedCount: 0,
      },
    ],
    searchQuery: '',
    installing: null,
  },
};

export const Empty: Story = {
  args: {
    installed: [],
    available: [],
    marketplaces: [],
    searchQuery: 'nonexistent',
    installing: null,
  },
};
