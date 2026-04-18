import type { ColorTheme, Density, FontSize } from '../stores/usePreferencesStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { cn } from '../utils/cn';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-semibold text-text mb-1">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer text-sm',
                selected
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border text-text-muted hover:text-text hover:bg-white/5',
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="accent-accent"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const THEME_OPTIONS: readonly { value: ColorTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const FONT_OPTIONS: readonly { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const DENSITY_OPTIONS: readonly { value: Density; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const colorTheme = usePreferencesStore((s) => s.colorTheme);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const density = usePreferencesStore((s) => s.density);
  const setColorTheme = usePreferencesStore((s) => s.setColorTheme);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const setDensity = usePreferencesStore((s) => s.setDensity);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent title="Settings" className="w-[440px] max-w-[calc(100vw-32px)]">
        <p className="text-xs text-text-muted mb-4">
          Changes apply instantly and are saved automatically.
        </p>
        <div className="flex flex-col gap-5">
          <RadioGroup
            legend="Color theme"
            name="settings-color-theme"
            value={colorTheme}
            options={THEME_OPTIONS}
            onChange={setColorTheme}
          />
          <RadioGroup
            legend="Font size"
            name="settings-font-size"
            value={fontSize}
            options={FONT_OPTIONS}
            onChange={setFontSize}
          />
          <RadioGroup
            legend="Density"
            name="settings-density"
            value={density}
            options={DENSITY_OPTIONS}
            onChange={setDensity}
          />
        </div>
        <div className="flex justify-end mt-5">
          <DialogClose asChild>
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text rounded border border-border hover:bg-white/5"
            >
              Close
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
