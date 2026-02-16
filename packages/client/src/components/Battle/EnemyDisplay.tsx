import type { Enemy } from '@code-quest/shared';

interface EnemyDisplayProps {
  enemy: Enemy;
}

export function EnemyDisplay({ enemy }: EnemyDisplayProps) {
  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

  return (
    <div className="enemy-display" data-testid="enemy-display">
      <div className="enemy-info">
        <span className="enemy-name" data-testid="enemy-name">
          {enemy.name}
        </span>
        <span className="enemy-level" data-testid="enemy-level">
          Lv.{enemy.level}
        </span>
      </div>
      <div className="enemy-hp-bar" data-testid="enemy-hp-bar">
        <div
          className="enemy-hp-fill"
          data-testid="enemy-hp-fill"
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="enemy-hp-text" data-testid="enemy-hp-text">
        {enemy.hp} / {enemy.maxHp}
      </div>
    </div>
  );
}
