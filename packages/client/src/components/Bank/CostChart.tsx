import type { ModelTier } from '@code-quest/shared';

interface SessionCost {
  total: number;
  byModel: Partial<Record<ModelTier, number>>;
}

interface CostChartProps {
  sessionCosts: Map<string, SessionCost>;
}

const MODEL_ICONS: Record<ModelTier, string> = {
  haiku: '🌸',
  sonnet: '🎵',
  opus: '👑',
};

export function CostChart({ sessionCosts }: CostChartProps) {
  const entries = [...sessionCosts.entries()].sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="cost-chart" data-testid="cost-chart">
      <div className="chart-header">Session History</div>
      {entries.length === 0 ? (
        <div className="chart-empty">No sessions yet</div>
      ) : (
        <div className="chart-rows">
          {entries.map(([sessionId, cost]) => (
            <div key={sessionId} className="cost-row" data-testid={`cost-row-${sessionId}`}>
              <span className="cost-session">{sessionId}</span>
              <span className="cost-models">
                {(Object.keys(cost.byModel) as ModelTier[]).map((model) => (
                  <span key={model} className="cost-model-badge">
                    {MODEL_ICONS[model]}
                  </span>
                ))}
              </span>
              <span className="cost-amount">${cost.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .cost-chart {
          margin-top: 8px;
        }

        .chart-header {
          font-size: 14px;
          color: #999;
          margin-bottom: 8px;
        }

        .chart-empty {
          font-size: 13px;
          color: #666;
          font-style: italic;
        }

        .chart-rows {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cost-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          font-size: 13px;
        }

        .cost-session {
          flex: 1;
          color: #ccc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cost-models {
          display: flex;
          gap: 2px;
        }

        .cost-amount {
          color: #ffd54f;
          font-weight: bold;
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
