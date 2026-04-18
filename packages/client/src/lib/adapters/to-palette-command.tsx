import type { Feature } from '../feature';
import { renderPaletteTrailing } from './trailing-renderers';

export interface PaletteCommand {
  id: string;
  label: string;
  category: string;
  description?: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onExecute: () => void;
}

export function toPaletteCommand(f: Feature): PaletteCommand {
  return {
    id: f.id,
    label: f.label,
    category: f.category,
    description: f.description,
    disabled: f.disabled,
    trailing: renderPaletteTrailing(f.state),
    onExecute: f.execute,
  };
}
