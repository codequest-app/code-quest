import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IconButton } from './IconButton.tsx';
import { PlusIcon, SearchIcon, TrashIcon, XIcon } from './Icons.tsx';

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    children: <PlusIcon className="w-5 h-5" />,
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 flex gap-2 items-start">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: 'Add item', children: <PlusIcon className="w-5 h-5" /> },
};

export const Disabled: Story = {
  args: { disabled: true, children: <PlusIcon className="w-5 h-5" /> },
};

export const Gallery: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <IconButton title="Add" onClick={fn()}>
        <PlusIcon className="w-5 h-5" />
      </IconButton>
      <IconButton title="Search" onClick={fn()}>
        <SearchIcon className="w-5 h-5" />
      </IconButton>
      <IconButton title="Close" onClick={fn()}>
        <XIcon className="w-5 h-5" />
      </IconButton>
      <IconButton title="Delete" onClick={fn()}>
        <TrashIcon className="w-5 h-5" />
      </IconButton>
    </div>
  ),
};
