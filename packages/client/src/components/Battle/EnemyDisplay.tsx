import type { Enemy } from '@code-quest/shared';
import { ProgressBar } from './ProgressBar';

interface EnemyDisplayProps {
  enemy: Enemy;
}

export function EnemyDisplay({ enemy }: EnemyDisplayProps) {
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
      <ProgressBar value={enemy.hp} max={enemy.maxHp} type="hp" />
      <div className="enemy-hp-text" data-testid="enemy-hp-text">
        {enemy.hp} / {enemy.maxHp}
      </div>
    </div>
  );
}
