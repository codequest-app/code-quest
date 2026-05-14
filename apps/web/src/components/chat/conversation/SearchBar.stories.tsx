import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SearchBar } from '@/components/chat/session/SearchBar';

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
  tags: ['autodocs'],
  args: { setSearchQuery: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { searchQuery: '' },
};

export const WithQuery: Story = {
  args: { searchQuery: 'hello' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/clear search/i));
    await expect(args.setSearchQuery).toHaveBeenCalledWith('');
  },
};

export const WithRawToggle: Story = {
  args: {
    searchQuery: '',
    onToggleRaw: fn(),
    rawActive: false,
  },
};
