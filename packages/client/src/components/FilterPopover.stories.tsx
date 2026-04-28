import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FilterPopover } from './FilterPopover';

const entries = [
  { type: 'text', count: 42 },
  { type: 'tool_use', count: 28 },
  { type: 'tool_result', count: 24 },
  { type: 'thinking', count: 11 },
  { type: 'error', count: 3 },
];

const meta: Meta<typeof FilterPopover> = {
  component: FilterPopover,
  tags: ['autodocs'],
  args: { entries, onChange: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FilterPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSelected: Story = {
  args: { selected: new Set(entries.map((e) => e.type)) },
};
export const SomeSelected: Story = {
  args: { selected: new Set(['text', 'tool_use']) },
};
export const NoneSelected: Story = {
  args: { selected: new Set<string>() },
};
export const Empty: Story = {
  args: { entries: [], selected: new Set<string>() },
};
