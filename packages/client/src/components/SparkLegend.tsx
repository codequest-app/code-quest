import type { EffortLevel } from '@code-quest/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const EFFORT_ACTIVE: Record<string, number> = { low: 1, medium: 2, high: 3, xhigh: 4, max: 5 };
const DOT_CX = [3.5, 9.5, 15.5, 21.5];

export function SparkLegend({
  effort,
  isFastMode,
}: {
  effort?: EffortLevel;
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

  const active = effort ? (EFFORT_ACTIVE[effort] ?? 0) : 0;

  return (
    <div className="absolute top-[-7px] right-3 z-10 flex items-center gap-2 h-3 px-1 pointer-events-none">
      <div className="absolute inset-x-0 top-[5px] h-[3px] bg-bg -z-10" />
      {hasEffort && (
        <span className="flex items-center gap-1 text-text-muted">
          <svg
            aria-hidden="true"
            width="24"
            height="12"
            viewBox="0 0 24 12"
            style={{ display: 'block' }}
          >
            {DOT_CX.map((cx, i) => (
              <circle
                key={cx}
                cx={cx}
                cy="6"
                r="2.5"
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
