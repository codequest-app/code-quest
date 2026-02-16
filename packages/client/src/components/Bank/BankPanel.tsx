import { useBankStore } from '../../stores/bankStore';
import { CostChart } from './CostChart';

export function BankPanel() {
  const totalCost = useBankStore((s) => s.totalCost);
  const getTotalGold = useBankStore((s) => s.getTotalGold);
  const isBudgetWarning = useBankStore((s) => s.isBudgetWarning);
  const sessionCosts = useBankStore((s) => s.sessionCosts);

  const gold = getTotalGold();
  const warning = isBudgetWarning();

  return (
    <div className="bank-panel" data-testid="bank-panel">
      <div className="bank-header">銀行 (Bank)</div>

      <div className="bank-stats">
        <div className="bank-stat">
          <span className="stat-label">Gold:</span>
          <span className="stat-value" data-testid="total-gold">
            {gold} G
          </span>
        </div>
        <div className="bank-stat">
          <span className="stat-label">Cost:</span>
          <span className="stat-value" data-testid="total-cost">
            ${totalCost.toFixed(2)}
          </span>
        </div>
      </div>

      {warning && (
        <div className="budget-warning" data-testid="budget-warning">
          ⚠ 予算警告: 予算の80%を超過しました
        </div>
      )}

      <CostChart sessionCosts={sessionCosts} />

      <style>{`
        .bank-panel {
          background: #1a1a2e;
          border: 2px solid #ffd54f;
          border-radius: 4px;
          padding: 16px;
          font-family: 'Courier New', monospace;
          color: #fff;
        }

        .bank-header {
          font-size: 18px;
          font-weight: bold;
          color: #ffd54f;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #555;
        }

        .bank-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 12px;
        }

        .bank-stat {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .stat-label {
          color: #999;
          font-size: 14px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: bold;
        }

        .budget-warning {
          background: rgba(255, 87, 34, 0.2);
          border: 1px solid #ff5722;
          color: #ff7043;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
