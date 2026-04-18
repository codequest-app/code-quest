import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RawEventFilterBar } from './RawEventFilterBar';

const entries = [
  { type: 'stream', count: 120 },
  { type: 'control', count: 42 },
  { type: 'stderr', count: 12 },
  { type: 'stdout', count: 8 },
  { type: 'exit', count: 1 },
];

const meta = {
  component: RawEventFilterBar,
  tags: ['autodocs'],
  args: { entries, onChange: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RawEventFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllActive: Story = {
  args: { selected: new Set(entries.map((e) => e.type)) },
};
export const SomeActive: Story = {
  args: { selected: new Set(['stream', 'control']) },
};
export const NoneActive: Story = {
  args: { selected: new Set<string>() },
};
