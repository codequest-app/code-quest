import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Density } from '../../stores/usePreferencesStore';
import { createDensityFeature } from './density-feature';

function DensityFeaturePreview({
  density,
  setDensity,
}: {
  density: Density;
  setDensity: (v: Density) => void;
}) {
  const feature = createDensityFeature({ density, setDensity });
  return (
    <button
      type="button"
      onClick={feature.execute}
      className="text-left px-3 py-1 w-80 flex items-center justify-between text-text hover:bg-white/10 rounded"
    >
      <span>{feature.menuItem.label}</span>
      {feature.menuItem.trailing}
    </button>
  );
}

const meta = {
  component: DensityFeaturePreview,
  tags: ['autodocs'],
  args: { setDensity: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-6 min-h-[120px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DensityFeaturePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comfortable: Story = { args: { density: 'comfortable' } };
export const Compact: Story = { args: { density: 'compact' } };
