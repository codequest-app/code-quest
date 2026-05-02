import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Feature } from '@/lib/feature';
import { withThemePreset } from '@/test/story-decorator';
import { FeatureRow } from './FeatureRow.tsx';

const feat = (over: Partial<Feature> = {}): Feature => ({
  id: 'f',
  label: 'Feature',
  section: 'Settings',
  execute: fn(),
  ...over,
});

const meta: Meta<typeof FeatureRow> = {
  component: FeatureRow,
  tags: ['autodocs'],
  args: {
    isActive: false,
    onActiveChange: fn(),
    onExecute: fn(),
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-surface text-text w-160 p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeatureRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flat: Story = {
  args: { feature: feat({ label: 'Switch theme' }) },
};

export const FlatActive: Story = {
  args: { feature: feat({ label: 'Switch theme' }), isActive: true },
};

export const FlatDisabled: Story = {
  args: { feature: feat({ label: 'Rewind to message', disabled: true }) },
};

export const FlatWithToggle: Story = {
  args: {
    feature: feat({
      label: 'Raw events',
      state: { kind: 'toggle', active: true },
    }),
  },
};

export const GroupAllOn: Story = {
  args: {
    feature: feat({
      id: 'conversation',
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
  },
};

export const GroupPartial: Story = {
  args: {
    feature: feat({
      id: 'tools',
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
  },
};

export const GroupAllOff: Story = {
  args: {
    feature: feat({
      id: 'debug',
      label: 'Debug',
      section: 'Filters',
      state: {
        kind: 'group',
        items: [
          { value: 'meta', label: 'meta', on: false, toggle: fn() },
          { value: 'raw_event', label: 'raw_event', on: false, toggle: fn() },
        ],
      },
    }),
  },
};

export const GroupWithPreview: Story = {
  args: {
    feature: feat({
      id: 'conversation',
      label: 'Conversation',
      section: 'Filters',
      state: {
        kind: 'group',
        items: [
          {
            value: 'text',
            label: 'text',
            preview: 'Here is the latest text sample to show under the type…',
            on: true,
            toggle: fn(),
          },
          {
            value: 'thinking',
            label: 'thinking',
            preview: 'Thinking preview here',
            on: false,
            toggle: fn(),
          },
        ],
      },
    }),
  },
};

export const FlatLight: Story = {
  args: { feature: feat({ label: 'Switch theme' }) },
  decorators: [withThemePreset({ theme: 'light' })],
};

export const GroupLight: Story = {
  args: {
    feature: feat({
      id: 'tools',
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
  },
  decorators: [withThemePreset({ theme: 'light' })],
};
