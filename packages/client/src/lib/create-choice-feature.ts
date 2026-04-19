import type { Feature, FeatureSection, PaletteTab } from './feature';

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface CreateChoiceFeatureDeps<T extends string> {
  id: string;
  label: string;
  section: FeatureSection;
  order: number;
  options: ChoiceOption<T>[];
  currentValue: T;
  onSelect: (v: T) => void;
  tabs?: readonly PaletteTab[];
}

/**
 * Template for discrete equal-weight choice features (theme / density /
 * font-size). All three share the same shape — `state.kind: 'choice'`,
 * `ui.closeSilent: true`, and an `execute()` that cycles through options
 * so the row responds to Enter-key activation. The helper narrows the
 * adapter's generic `(v: string) => void` into a typed `(v: T) => void`
 * so callers don't have to cast inside onSelect.
 */
export function createChoiceFeature<T extends string>({
  id,
  label,
  section,
  order,
  options,
  currentValue,
  onSelect,
  tabs,
}: CreateChoiceFeatureDeps<T>): Feature {
  const values = options.map((o) => o.value);
  return {
    id,
    label,
    section,
    order,
    ...(tabs ? { tabs } : {}),
    state: {
      kind: 'choice',
      options,
      currentValue,
      onSelect: (v) => onSelect(v as T),
    },
    ui: { closeSilent: true },
    execute() {
      const idx = values.indexOf(currentValue);
      onSelect(values[(idx + 1) % values.length]);
    },
  };
}
