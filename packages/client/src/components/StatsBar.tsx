import type { ChatStats } from '@code-quest/shared';

interface StatsBarProps {
  stats: ChatStats | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  return (
    <div className="stats-bar">
      {stats.costUsd != null && <span>${stats.costUsd}</span>}
      {stats.durationMs != null && <span>{(stats.durationMs / 1000).toFixed(1)}s</span>}
      {stats.inputTokens != null && <span>↑{stats.inputTokens}</span>}
      {stats.outputTokens != null && <span>↓{stats.outputTokens}</span>}
    </div>
  );
}
