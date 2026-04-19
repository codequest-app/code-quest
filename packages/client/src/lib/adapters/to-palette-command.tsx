import type { Feature } from '../feature';
import { renderPaletteTrailing } from './trailing-renderers';

interface PaletteCommand {
  id: string;
  label: string;
  section: string;
  description?: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onExecute: () => void;
}

export function toPaletteCommand(f: Feature): PaletteCommand {
  return {
    id: f.id,
    label: f.label,
    section: f.section,
    description: f.description,
    disabled: f.disabled,
    trailing: renderPaletteTrailing(f.state, { featureId: f.id }),
    onExecute: f.execute,
  };
}
