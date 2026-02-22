import type { WorkerInfo } from '@code-quest/shared';
import { useBattleStore } from '../../stores/battleStore.ts';

interface WorkerSidebarItemProps {
  index: number;
  worker: WorkerInfo;
  isSelected: boolean;
  onClick: () => void;
}

const statusIcons: Record<WorkerInfo['status'], string> = {
  pending: '\u23F3',
  running: '\u27F3',
  complete: '\u2713',
  error: '\u2717',
  skipped: '\u23ED',
};

export function WorkerSidebarItem({ index, worker, isSelected, onClick }: WorkerSidebarItemProps) {
  const battle = useBattleStore((state) => state.battles.get(worker.id));
  const enemyName = battle?.enemy.name;
  const enemyHp = battle?.enemy.hp ?? 0;
  const enemyMaxHp = battle?.enemy.maxHp ?? 0;
  const hpPct = enemyMaxHp > 0 ? Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100)) : 0;
  const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';
  const taskDesc =
    worker.task.description.length > 30
      ? `${worker.task.description.slice(0, 30)}...`
      : worker.task.description;

  const selectedClass = isSelected ? ' worker-sidebar-item--selected' : '';
  const statusClass = ` worker-sidebar-item--${worker.status}`;

  return (
    <button
      type="button"
      className={`worker-sidebar-item${selectedClass}${statusClass}`}
      onClick={onClick}
      data-testid={`worker-sidebar-item-${worker.id}`}
    >
      <div className="worker-sidebar-item__header">
        <span className={`worker-sidebar-item__icon worker-pane__status-icon--${worker.status}`}>
          {statusIcons[worker.status]}
        </span>
        <span className="worker-sidebar-item__label">Worker {index + 1}</span>
        <span className="worker-sidebar-item__provider">{providerLabel}</span>
      </div>
      <div className="worker-sidebar-item__enemy">{enemyName ?? taskDesc}</div>
      {enemyMaxHp > 0 && (
        <div className="worker-sidebar-item__hp-bar">
          <div className="worker-sidebar-item__hp-fill" style={{ width: `${hpPct}%` }} />
        </div>
      )}
    </button>
  );
}
