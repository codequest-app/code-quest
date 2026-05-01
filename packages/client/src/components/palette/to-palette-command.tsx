import { renderMenuTrailing } from '@/lib/adapters/to-menu-item';
import { deriveGroupAggregate } from '@/lib/derive-group-aggregate';
import type { Feature, FeatureState } from '@/lib/feature';
import { TriStateIndicator } from '../ui/TriStateIndicator';

interface PaletteCommand {
  id: string;
  label: string;
  section: string;
  description?: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onExecute: () => void;
}

interface TrailingOpts {
  featureId?: string;
}

export function renderPaletteTrailing(state?: FeatureState, opts?: TrailingOpts): React.ReactNode {
  if (!state) return undefined;
  if (state.kind === 'toggle') {
    return <TriStateIndicator state={state.active ? 'all' : 'none'} featureId={opts?.featureId} />;
  }
  if (state.kind === 'group') {
    return (
      <TriStateIndicator
        state={deriveGroupAggregate(state.items)}
        onPartial={state.onPartial}
        featureId={opts?.featureId}
      />
    );
  }
  return renderMenuTrailing(state, opts);
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
