import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { toMenuItem } from '../../lib/adapters/to-menu-item';
import type { ColorTheme } from '../../stores/usePreferencesStore';
import { createColorThemeFeature } from './color-theme-feature';

function ColorThemeFeaturePreview({
  colorTheme,
  setColorTheme,
}: {
  colorTheme: ColorTheme;
  setColorTheme: (v: ColorTheme) => void;
}) {
  const feature = toMenuItem(createColorThemeFeature({ colorTheme, setColorTheme }));
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
  component: ColorThemeFeaturePreview,
  tags: ['autodocs'],
  args: { setColorTheme: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-6 min-h-30">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ColorThemeFeaturePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = { args: { colorTheme: 'dark' } };
export const Light: Story = { args: { colorTheme: 'light' } };
