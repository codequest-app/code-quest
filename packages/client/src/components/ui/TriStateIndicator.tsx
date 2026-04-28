import { cn } from '../../utils/cn';

export const TOGGLE_PILL_BASE =
  'text-xs font-mono font-bold rounded-sm px-1.5 py-0.5 border inline-block';

export function togglePillColor(state: 'all' | 'partial' | 'none'): string {
  return cn(
    state === 'all' && 'bg-accent text-white border-accent',
    state === 'none' && 'text-text-muted border-border',
    state === 'partial' && 'text-warning border-warning',
  );
}

export function togglePillSymbol(state: 'all' | 'partial' | 'none'): string {
  return state === 'all' ? 'ON' : state === 'none' ? 'OFF' : '∂';
}

interface TriStateIndicatorProps {
  state: 'all' | 'partial' | 'none';
  onPartial?: () => void;
  featureId?: string;
}

export function TriStateIndicator({
  state,
  onPartial,
  featureId,
}: TriStateIndicatorProps): React.JSX.Element {
  const clickable = state === 'partial' && !!onPartial;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: partial-only click; keyboard equivalent provided
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is always button|status (dynamic ternary)
    <span
      aria-label={featureId ? `${featureId}-toggle` : 'tri-state-indicator'}
      data-state={state}
      role={clickable ? 'button' : 'status'}
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
      className={cn(TOGGLE_PILL_BASE, togglePillColor(state), clickable && 'cursor-pointer')}
    >
      {togglePillSymbol(state)}
    </span>
  );
}
