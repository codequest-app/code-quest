import type { BattleState } from '@code-quest/shared';
import { ProgressBar } from './ProgressBar';

interface PlayerStatusProps {
  battle: BattleState;
}

export function PlayerStatus({ battle }: PlayerStatusProps) {
  return (
    <div className="player-status" data-testid="player-status">
      <div className="player-stat">
        <span className="stat-label">HP</span>
        <ProgressBar value={battle.playerHp} max={battle.playerMaxHp} type="hp" />
        <span className="stat-value" data-testid="player-hp">
          {battle.playerHp}/{battle.playerMaxHp}
        </span>
      </div>
      <div className="player-stat">
        <span className="stat-label">MP</span>
        <ProgressBar value={battle.playerMp} max={battle.playerMaxMp} type="mp" />
        <span className="stat-value" data-testid="player-mp">
          {battle.playerMp}/{battle.playerMaxMp}
        </span>
      </div>
      <div className="player-stat">
        <span className="stat-label">EXP</span>
        <span className="stat-value" data-testid="player-exp">
          {battle.playerExp}
        </span>
      </div>
    </div>
  );
}
