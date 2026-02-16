import type { BattleState } from '@code-quest/shared';

interface PlayerStatusProps {
  battle: BattleState;
}

export function PlayerStatus({ battle }: PlayerStatusProps) {
  const hpPercent = Math.max(0, (battle.playerHp / battle.playerMaxHp) * 100);
  const mpPercent = Math.max(0, (battle.playerMp / battle.playerMaxMp) * 100);

  return (
    <div className="player-status" data-testid="player-status">
      <div className="player-stat">
        <span className="stat-label">HP</span>
        <div className="stat-bar hp-bar">
          <div className="stat-fill hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="stat-value" data-testid="player-hp">
          {battle.playerHp}/{battle.playerMaxHp}
        </span>
      </div>
      <div className="player-stat">
        <span className="stat-label">MP</span>
        <div className="stat-bar mp-bar">
          <div className="stat-fill mp-fill" style={{ width: `${mpPercent}%` }} />
        </div>
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
