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
        className="absolute top-0 left-0 h-full rounded-[9px] bg-toggle transition-[width] duration-150"
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
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-[left] duration-150"
        style={{ left: thumbLeft }}
      />
    </>
  );

  // Always render as div — avoids button-in-button nesting when used inside menu items
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-valuenow={idx}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-label="Effort level"
      className="relative w-[76px] h-[18px] rounded-[9px] bg-surface-hover overflow-hidden shrink-0 cursor-pointer"
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
