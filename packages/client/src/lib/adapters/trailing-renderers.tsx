import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { cn } from '../../utils/cn';
import type { FeatureState } from '../feature';

function TriStateIndicator({
  state,
  onPartial,
}: {
  state: 'all' | 'partial' | 'none';
  onPartial?: () => void;
}) {
  const symbol = state === 'all' ? 'ON' : state === 'none' ? 'OFF' : '∂';
  const clickable = state === 'partial' && !!onPartial;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: partial-only click; keyboard equivalent provided
    <span
      data-testid="tri-state-indicator"
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

export function renderMenuTrailing(state?: FeatureState): React.ReactNode {
  if (!state) return undefined;
  if (state.kind === 'toggle') {
    return (
      <span data-testid="toggle-switch" data-state={state.active ? 'on' : 'off'}>
        <ToggleSwitch isOn={state.active} />
      </span>
    );
  }
  if (state.kind === 'tri-state') {
    return <TriStateIndicator state={state.state} onPartial={state.onPartial} />;
  }
  if (state.kind === 'select') {
    return (
      <span data-testid="select-current" className="font-mono text-[11px] text-text-muted">
        {state.currentValue}
      </span>
    );
  }
  return undefined;
}

/** First iteration: palette trailing shares the menu renderer. Diverge later if needed. */
export const renderPaletteTrailing = renderMenuTrailing;
