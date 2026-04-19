/** Effort level slider matching extension's toggle UI.
 *  Pill track with fill, notch dots, and white thumb. */

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

function pct(idx: number, count: number) {
  return count > 1 ? idx / (count - 1) : 0;
}

export function EffortSwitch({ level, levels, onSelect }: EffortSwitchProps) {
  const idx = level ? levels.indexOf(level) : 0;
  const count = levels.length;
  const ratio = pct(idx, count);

  // Layout: 76×18 track, 14px thumb, 2px inset
  const thumbLeft = `calc(2px + ${ratio} * (76px - 14px - 4px))`;
  const fillWidth = `calc(2px + ${ratio} * (76px - 14px - 4px) + 14px + 2px)`;
  const notchLeft = (i: number) => `calc(2px + ${pct(i, count)} * (76px - 14px - 4px) + 7px)`;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!onSelect) return;
    e.stopPropagation();
    if (e.detail === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSelect(levels[Math.round(x * (count - 1))]);
  };

  const content = (
    <>
      <div
        className="absolute top-0 left-0 h-full rounded-lg bg-toggle transition-all duration-150"
        style={{ width: fillWidth }}
      />
      {levels.map((_, i) =>
        i > idx ? (
          <div
            key={levels[i]}
            className="absolute top-1/2 w-1 h-1 rounded-full bg-white/30 -translate-x-1/2 -translate-y-1/2"
            style={{ left: notchLeft(i) }}
          />
        ) : null,
      )}
      <div
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-150"
        style={{ left: thumbLeft }}
      />
    </>
  );

  // Always render as div — avoids button-in-button nesting when used inside menu items
  return (
    <div
      data-testid="effort-switch"
      role="slider"
      tabIndex={0}
      aria-valuenow={idx}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-label="Effort level"
      className="relative w-19 h-5 rounded-lg bg-surface-hover overflow-hidden shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
      {content}
    </div>
  );
}
