import { useId } from 'react';
import { cn } from '../../utils/cn';

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoicePillsProps {
  options: ChoiceOption[];
  currentValue: string;
  onSelect: (v: string) => void;
  /** Optional testid prefix — individual pills get `${featureId}-pill-${value}`. */
  featureId?: string;
}

/**
 * Compact radio-pill group for discrete equal-weight choices
 * (theme / density / font-size). For ordered magnitudes use EffortSwitch.
 *
 * Uses native <input type="radio"> hidden inside styled <label>s so the
 * component is accessible without ARIA overrides.
 */
export function ChoicePills({ options, currentValue, onSelect, featureId }: ChoicePillsProps) {
  const name = useId();
  return (
    <span
      data-testid={featureId ? `${featureId}-pills` : 'choice-pills'}
      className="inline-flex gap-1"
    >
      {options.map((opt) => {
        const selected = opt.value === currentValue;
        return (
          <label
            key={opt.value}
            data-testid={featureId ? `${featureId}-pill-${opt.value}` : undefined}
            className={cn(
              'text-[10px] font-mono font-bold rounded-[3px] px-1.5 py-0.5 border cursor-pointer',
              selected
                ? 'bg-accent text-white border-accent'
                : 'text-text-muted border-border hover:text-text',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onSelect(opt.value)}
              onClick={(e) => e.stopPropagation()}
              className="sr-only"
              aria-label={opt.label}
            />
            {opt.label}
          </label>
        );
      })}
    </span>
  );
}
