import { createChoiceFeature } from '@/lib/create-choice-feature';
import type { Feature } from '@/lib/feature';
import type { FontSize } from '@/stores/usePreferencesStore';

interface FontSizeFeatureDeps {
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
}

export function createFontSizeFeature({ fontSize, setFontSize }: FontSizeFeatureDeps): Feature {
  return createChoiceFeature<FontSize>({
    id: 'font-size',
    label: 'Font size',
    section: 'Settings',
    order: 12,
    tabs: ['actions'],
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    currentValue: fontSize,
    onSelect: setFontSize,
  });
}
