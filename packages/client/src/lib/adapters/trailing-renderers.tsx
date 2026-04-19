import { ChoicePills } from '../../components/ui/ChoicePills';
import { EffortSwitch } from '../../components/ui/EffortSwitch';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { cn } from '../../utils/cn';
import { deriveGroupAggregate, type FeatureState } from '../feature';

function TriStateIndicator({
  state,
  onPartial,
  featureId,
}: {
  state: 'all' | 'partial' | 'none';
  onPartial?: () => void;
  featureId?: string;
}) {
  const symbol = state === 'all' ? 'ON' : state === 'none' ? 'OFF' : '∂';
  const clickable = state === 'partial' && !!onPartial;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: partial-only click; keyboard equivalent provided
    <span
      data-testid={featureId ? `${featureId}-toggle` : 'tri-state-indicator'}
      data-state={state}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation();
              onPartial?.();
            }
          : undefined
      }
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                e.preventDefault();
                onPartial?.();
              }
            }
          : undefined
      }
      className={cn(
        'text-[9px] font-mono font-bold rounded-[3px] px-1.5 py-0.5 border inline-block',
        state === 'all' && 'bg-accent text-white border-accent',
        state === 'none' && 'text-text-muted border-border',
        state === 'partial' && 'text-warning border-warning cursor-pointer',
      )}
    >
      {symbol}
    </span>
  );
}

interface TrailingOpts {
  featureId?: string;
}

export function renderMenuTrailing(state?: FeatureState, opts?: TrailingOpts): React.ReactNode {
  if (!state) return undefined;
  if (state.kind === 'toggle') {
    return (
      <span
        data-testid={opts?.featureId ? `${opts.featureId}-switch` : 'toggle-switch'}
        data-state={state.active ? 'on' : 'off'}
      >
        <ToggleSwitch isOn={state.active} />
      </span>
    );
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
  if (state.kind === 'select') {
    return (
      <span data-testid="select-current" className="font-mono text-[11px] text-text-muted">
        {state.currentValue}
      </span>
    );
  }
  if (state.kind === 'segmented') {
    return (
      <EffortSwitch
        level={state.currentValue ?? undefined}
        levels={state.options}
        onSelect={state.onSelect}
      />
    );
  }
  if (state.kind === 'choice') {
    return (
      <ChoicePills
        options={state.options}
        currentValue={state.currentValue}
        onSelect={state.onSelect}
        featureId={opts?.featureId}
      />
    );
  }
  return undefined;
}

/**
 * Palette adapter owns palette-surface appearance. Toggles render as the same
 * ON/OFF pill used by filter groups (TriStateIndicator with 'all'/'none') so
 * the entire palette has a single trailing-visual vocabulary. Menu keeps the
 * ToggleSwitch because its rows use a different visual language.
 */
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
  // select: no palette case today — fall back to the menu rendering so a
  // future addition doesn't silently drop trailing content.
  return renderMenuTrailing(state, opts);
}
