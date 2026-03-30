import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MarketplaceSection } from './MarketplaceSection';

const meta = {
  component: MarketplaceSection,
  tags: ['autodocs'],
  args: {
    newSource: '',
    onNewSourceChange: fn(),
    onAdd: fn(),
    onRemove: fn(),
    onRefresh: fn(),
    adding: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarketplaceSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    marketplaces: [],
  },
};

export const WithMarketplaces: Story = {
  args: {
    marketplaces: [
      {
        name: 'official-plugins',
        config: {
          source: { source: 'npm', package: '@claude/plugins' },
          installLocation: '/tmp/plugins',
        },
        pluginCount: 12,
        installedCount: 5,
      },
      {
        name: 'community-hub',
        config: {
          source: { source: 'github', repo: 'community/claude-plugins' },
          installLocation: '/tmp/community',
        },
        pluginCount: 30,
        installedCount: 0,
      },
    ],
  },
};

export const Adding: Story = {
  args: {
    marketplaces: [],
    newSource: 'https://example.com/plugins',
    adding: true,
  },
};
