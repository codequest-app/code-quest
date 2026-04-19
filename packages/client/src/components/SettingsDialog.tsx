import { createColorThemeFeature } from '../features/color-theme/color-theme-feature';
import { createDensityFeature } from '../features/density/density-feature';
import { createFontSizeFeature } from '../features/font-size/font-size-feature';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { FeatureRow } from './palette/FeatureRow';
import { Button } from './ui/Button';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const colorTheme = usePreferencesStore((s) => s.colorTheme);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const density = usePreferencesStore((s) => s.density);
  const setColorTheme = usePreferencesStore((s) => s.setColorTheme);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const setDensity = usePreferencesStore((s) => s.setDensity);

  const features = [
    createColorThemeFeature({ colorTheme, setColorTheme }),
    createFontSizeFeature({ fontSize, setFontSize }),
    createDensityFeature({ density, setDensity }),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent title="Settings" className="w-110 max-w-[calc(100vw-32px)]">
        <p className="text-xs text-text-muted mb-4">
          Changes apply instantly and are saved automatically.
        </p>
        <div className="flex flex-col">
          {features.map((feature) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              isActive={false}
              onActiveChange={() => {}}
            />
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
