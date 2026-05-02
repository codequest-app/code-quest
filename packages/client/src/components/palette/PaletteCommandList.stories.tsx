import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Feature } from '@/lib/feature';
import { PaletteCommandList } from './PaletteCommandList.tsx';

const feat = (over: Partial<Feature> = {}): Feature => ({
  id: 'f',
  label: 'Feature',
  section: 'Settings',
  execute: fn(),
  ...over,
});

const meta: Meta<typeof PaletteCommandList> = {
  component: PaletteCommandList,
  tags: ['autodocs'],
  args: {
    query: '',
    activeId: null,
    onActiveChange: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-surface text-text w-160 p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaletteCommandList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiCategory: Story = {
  args: {
    features: [
      feat({ id: 'f1', label: 'Hide tools', section: 'Filters', order: 0 }),
      feat({ id: 'f2', label: 'Hide thinking', section: 'Filters', order: 1 }),
      feat({ id: 'p1', label: 'Toggle raw events', section: 'Panels' }),
      feat({ id: 's1', label: 'Switch theme', section: 'Settings', order: 0 }),
      feat({ id: 's2', label: 'Toggle density', section: 'Settings', order: 1 }),
    ],
  },
};

export const Search: Story = {
  args: {
    features: MultiCategory.args?.features ?? [],
    query: 'theme',
  },
};

export const WithToggleState: Story = {
  args: {
    features: [
      feat({
        id: 'theme',
        label: 'Switch theme',
        section: 'Settings',
        state: { kind: 'toggle', active: true },
      }),
      feat({
        id: 'density',
        label: 'Toggle density',
        section: 'Settings',
        state: { kind: 'toggle', active: false },
      }),
    ],
  },
};

export const WithTriState: Story = {
  args: {
    features: [
      feat({
        id: 'f1',
        label: 'Conversation',
        section: 'Filters',
        state: {
          kind: 'group',
          items: [
            { value: 'text', label: 'text', on: true, toggle: fn() },
            { value: 'thinking', label: 'thinking', on: true, toggle: fn() },
          ],
        },
      }),
      feat({
        id: 'f2',
        label: 'Tools',
        section: 'Filters',
        state: {
          kind: 'group',
          items: [
            { value: 'tool_use', label: 'tool_use', on: true, toggle: fn() },
            { value: 'tool_result', label: 'tool_result', on: false, toggle: fn() },
          ],
          onPartial: fn(),
        },
      }),
      feat({
        id: 'f3',
        label: 'System',
        section: 'Filters',
        state: {
          kind: 'group',
          items: [{ value: 'meta', label: 'meta', on: false, toggle: fn() }],
        },
      }),
    ],
  },
};

export const Active: Story = {
  args: {
    features: MultiCategory.args?.features ?? [],
    activeId: 's1',
  },
};
