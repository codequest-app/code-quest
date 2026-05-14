import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { CitationsPanel } from '../conversation/CitationsPanel';

const meta: Meta<typeof CitationsPanel> = {
  component: CitationsPanel,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CitationsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { citations: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link')).toBeNull();
  },
};

export const WithLinks: Story = {
  args: {
    citations: [
      { url: 'https://example.com', title: 'Example Site' },
      { url: 'https://docs.anthropic.com', title: 'Anthropic Docs' },
    ],
  },
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(2);
    await expect(links[0]).toHaveAttribute('href', 'https://example.com');
    await expect(links[0]).toHaveAttribute('target', '_blank');
  },
};

export const PlainText: Story = {
  args: {
    citations: [{ title: 'No URL citation' }, { citedText: 'Some quoted text without a URL' }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link')).toBeNull();
    await expect(canvas.getByText('No URL citation')).toBeInTheDocument();
  },
};

export const Mixed: Story = {
  args: {
    citations: [
      { url: 'https://example.com', title: 'Linked' },
      { title: 'Plain text' },
      { citedText: 'Quoted text' },
    ],
  },
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(1);
    await expect(canvas.getByText('Plain text')).toBeInTheDocument();
  },
};
