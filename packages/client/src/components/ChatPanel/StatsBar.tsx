import type { ChatStats } from '@code-quest/shared';

interface StatsBarProps {
  stats: ChatStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items: string[] = [];

  if (stats.costUsd !== undefined) {
    items.push(`$${stats.costUsd.toFixed(4)}`);
  }
  if (stats.durationMs !== undefined) {
    items.push(`${(stats.durationMs / 1000).toFixed(1)}s`);
  }
  if (stats.inputTokens !== undefined) {
    items.push(`${stats.inputTokens} in`);
  }
  if (stats.outputTokens !== undefined) {
    items.push(`${stats.outputTokens} out`);
  }

  if (items.length === 0) return null;

  return (
    <div className="stats-bar" data-testid="stats-bar">
      {items.join(' · ')}

      <style>{`
        .stats-bar {
          margin-top: 8px;
          padding: 4px 0;
          font-size: 11px;
          color: #666;
          border-top: 1px solid #3e3e42;
        }
      `}</style>
    </div>
  );
}
