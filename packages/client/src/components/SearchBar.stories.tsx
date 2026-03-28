import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SearchBar } from './SearchBar';

const meta = {
  component: SearchBar,
  tags: ['autodocs'],
  args: { setSearchQuery: fn(), setTypeFilter: fn() },
  decorators: [
    (Story) => (
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

export const WithTypeFilter: Story = {
  args: { searchQuery: '', typeFilter: [] },
};

export const WithActiveFilter: Story = {
  args: {
    searchQuery: '',
    typeFilter: ['raw_event', 'hook_started'],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/toggle type filter/i));
    const checkbox = await canvas.findByLabelText('raw_event');
    await userEvent.click(checkbox);
    await expect(args.setTypeFilter).toHaveBeenCalledWith(['hook_started']);
  },
};
