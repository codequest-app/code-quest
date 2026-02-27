import type { ChatStats } from '@code-quest/shared';

interface StatsBarProps {
  stats: ChatStats | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  return (
    <div className="flex gap-4 px-4 py-1 text-xs text-text-muted font-mono">
      {stats.costUsd != null && <span>${stats.costUsd}</span>}
      {stats.durationMs != null && <span>{(stats.durationMs / 1000).toFixed(1)}s</span>}
      {stats.inputTokens != null && <span>↑{stats.inputTokens}</span>}
      {stats.outputTokens != null && <span>↓{stats.outputTokens}</span>}
    </div>
  );
}
