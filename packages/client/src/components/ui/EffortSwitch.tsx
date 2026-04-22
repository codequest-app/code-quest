/** Effort level slider matching extension's toggle UI.
 *  Pill track with fill, notch dots, and a thumb handle. */

import { cn } from '../../utils/cn';

const EFFORT_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
};

export function effortLabel(level?: string): string {
  return level ? (EFFORT_LABELS[level] ?? level) : 'Auto';
}

interface EffortSwitchProps {
  level?: string;
  levels: string[];
  onSelect?: (level: string) => void;
}

// Thumb size in CSS terms — matches `w-3.5 h-3.5` so it scales with both the
// density axis (via --spacing) and the font-size axis (via rem). Layout is
// fully container-relative so the track width can be anything.
const THUMB_CSS = 'calc(var(--spacing) * 3.5)';

function pct(idx: number, count: number) {
  return count > 1 ? idx / (count - 1) : 0;
}

export function EffortSwitch({ level, levels, onSelect }: EffortSwitchProps) {
  const idx = level ? levels.indexOf(level) : 0;
  const count = levels.length;
  const ratio = pct(idx, count);

  const travel = `(100% - ${THUMB_CSS})`;
  const thumbLeft = `calc(${travel} * ${ratio})`;
  // Fill covers from left to thumb right edge — at max this equals 100%
  // (full container); at min it equals the thumb width (exactly under thumb).
  const fillWidth = `calc(${travel} * ${ratio} + ${THUMB_CSS})`;
  const notchLeft = (i: number) => `calc(${travel} * ${pct(i, count)} + ${THUMB_CSS} / 2)`;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!onSelect) return;
    e.stopPropagation();
    if (e.detail === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSelect(levels[Math.round(x * (count - 1))]);
  };

  const ticksAfterThumb = Array.from({ length: count - idx - 1 }, (_, k) => idx + 1 + k);

  return (
    <div
      data-testid="effort-switch"
      role="slider"
      tabIndex={0}
      aria-valuenow={idx}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-label="Effort level"
      className="relative w-19 h-5 rounded-full shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!onSelect) return;
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (dir) {
          e.preventDefault();
          onSelect(levels[Math.max(0, Math.min(count - 1, idx + dir))]);
        }
      }}
      title="Click a position to set effort level"
    >
      <div
        data-testid="effort-switch-track"
        className="absolute inset-0 rounded-full bg-surface-hover overflow-hidden"
      >
        <div
          data-testid="effort-switch-fill"
          className="absolute top-1/2 -translate-y-1/2 left-0 h-3.5 rounded-full bg-toggle transition-all duration-150"
          style={{ width: fillWidth }}
        />
        {ticksAfterThumb.map((i) => (
          <div
            key={levels[i]}
            data-testid="effort-switch-tick"
            className={cn(
              'absolute top-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2',
              'bg-[rgba(var(--color-text-rgb),0.35)]',
            )}
            style={{ left: notchLeft(i) }}
          />
        ))}
        <div
          data-testid="effort-switch-thumb"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full',
            'bg-white shadow-sm ring-1 ring-[rgba(0,0,0,0.2)]',
            'transition-all duration-150',
          )}
          style={{ left: thumbLeft }}
        />
      </div>
    </div>
  );
}
