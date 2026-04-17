import type { EffortLevel } from '@code-quest/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const DOT_SPACING = 6;
const DOT_R = 2.5;
const DOT_CY = 6;

function buildDotCx(count: number): number[] {
  return Array.from({ length: count }, (_, i) => DOT_R + i * DOT_SPACING);
}

export function SparkLegend({
  effort,
  effortLevels,
  isFastMode,
}: {
  effort?: EffortLevel;
  effortLevels?: EffortLevel[];
  isFastMode?: boolean;
}) {
  const [showLabel, setShowLabel] = useState(true);
  const prevEffortRef = useRef(effort);
  useLayoutEffect(() => {
    if (prevEffortRef.current !== effort) {
      prevEffortRef.current = effort;
      setShowLabel(true);
    }
  });
  useEffect(() => {
    if (!showLabel) return;
    const t = setTimeout(() => setShowLabel(false), 3000);
    return () => clearTimeout(t);
  }, [showLabel]);

  const hasEffort = !!effort;
  const hasSpark = !!isFastMode;
  if (!hasEffort && !hasSpark) return null;

  const levels = effortLevels ?? [];
  const active = effort ? levels.indexOf(effort) + 1 : 0;
  const dotCx = buildDotCx(levels.length);
  const svgWidth = levels.length > 0 ? dotCx[dotCx.length - 1] + DOT_R : 0;

  return (
    <div className="absolute top-[-7px] right-3 z-10 flex items-center gap-2 h-3 px-1 pointer-events-none">
      <div className="absolute inset-x-0 top-[5px] h-[3px] bg-bg -z-10" />
      {hasEffort && levels.length > 0 && (
        <span className="flex items-center gap-1 text-text-muted">
          <svg
            aria-hidden="true"
            width={svgWidth}
            height="12"
            viewBox={`0 0 ${svgWidth} 12`}
            style={{ display: 'block' }}
          >
            {dotCx.map((cx, i) => (
              <circle
                key={cx}
                cx={cx}
                cy={DOT_CY}
                r={DOT_R}
                fill="currentColor"
                opacity={i < active ? 1 : 0.15}
              />
            ))}
          </svg>
          {showLabel && <span className="text-[0.75em] leading-none capitalize">{effort}</span>}
        </span>
      )}
      {hasSpark && <span className="text-accent text-[9px] leading-none">⚡</span>}
    </div>
  );
}
