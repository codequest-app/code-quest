import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ModelPickerPopover } from './ModelPickerPopover.tsx';

const models = [
  { value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' },
  { value: 'claude-opus-4-6', displayName: 'Opus 4.6' },
  { value: 'claude-haiku-4-5', displayName: 'Haiku 4.5' },
];

const meta: Meta<typeof ModelPickerPopover> = {
  component: ModelPickerPopover,
  tags: ['autodocs'],
  args: { availableModels: models, onSwitch: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-sm bg-bg text-text p-6 relative">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModelPickerPopover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { currentModel: 'claude-sonnet-4-6' },
};
export const OpusSelected: Story = {
  args: { currentModel: 'claude-opus-4-6' },
};
export const HaikuSelected: Story = {
  args: { currentModel: 'claude-haiku-4-5' },
};
