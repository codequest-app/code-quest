import { cn } from '../../utils/cn';

interface TriStateIndicatorProps {
  state: 'all' | 'partial' | 'none';
  onPartial?: () => void;
  featureId?: string;
}

export function TriStateIndicator({ state, onPartial, featureId }: TriStateIndicatorProps) {
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
