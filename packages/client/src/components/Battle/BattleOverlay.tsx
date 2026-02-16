import { useBattleStore } from '../../stores/battleStore';
import { BattleLog } from './BattleLog';
import { EnemyDisplay } from './EnemyDisplay';
import { MessageBox } from './MessageBox';
import { PlayerStatus } from './PlayerStatus';

interface BattleOverlayProps {
  sessionId: string;
}

export function BattleOverlay({ sessionId }: BattleOverlayProps) {
  const battle = useBattleStore((s) => s.battles.get(sessionId));

  if (!battle) return null;

  const lastLog = battle.log[battle.log.length - 1];
  const message =
    battle.phase === 'victory'
      ? `勝利！ ${battle.goldEarned}G と ${battle.expEarned}EXP を獲得！`
      : (lastLog?.message ?? '戦闘開始！');

  return (
    <div className="battle-overlay" data-testid="battle-overlay">
      <EnemyDisplay enemy={battle.enemy} />
      <BattleLog entries={battle.log} />
      <PlayerStatus battle={battle} />
      <MessageBox message={message} />

      <style>{`
        .battle-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.85);
          color: #fff;
          font-family: 'Courier New', monospace;
          padding: 16px;
          gap: 12px;
          z-index: 10;
          pointer-events: none;
        }

        .enemy-display {
          text-align: center;
          padding: 12px;
          border: 2px solid #fff;
          border-radius: 4px;
          background: rgba(30, 30, 30, 0.9);
        }

        .enemy-info {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 18px;
        }

        .enemy-name {
          font-weight: bold;
        }

        .enemy-hp-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .enemy-hp-fill {
          height: 100%;
          background: #e53935;
          transition: width 0.3s ease-out;
        }

        .enemy-hp-text {
          font-size: 12px;
          margin-top: 4px;
          color: #ccc;
        }

        .battle-log {
          flex: 1;
          overflow-y: auto;
          border: 2px solid #fff;
          border-radius: 4px;
          padding: 8px;
          background: rgba(30, 30, 30, 0.9);
          min-height: 100px;
          max-height: 200px;
        }

        .battle-log-entry {
          padding: 2px 0;
          font-size: 14px;
        }

        .log-skill { color: #64b5f6; }
        .log-damage { color: #ef5350; }
        .log-heal { color: #66bb6a; }
        .log-victory { color: #ffd54f; }
        .log-error { color: #ff7043; }
        .log-info { color: #ccc; }

        .player-status {
          display: flex;
          gap: 16px;
          padding: 12px;
          border: 2px solid #fff;
          border-radius: 4px;
          background: rgba(30, 30, 30, 0.9);
        }

        .player-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .stat-label {
          font-weight: bold;
          font-size: 14px;
          min-width: 30px;
        }

        .stat-bar {
          flex: 1;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .stat-fill {
          height: 100%;
          transition: width 0.3s ease-out;
        }

        .hp-fill { background: #66bb6a; }
        .mp-fill { background: #42a5f5; }

        .stat-value {
          font-size: 12px;
          min-width: 60px;
          text-align: right;
          color: #ccc;
        }

        .message-box {
          border: 2px solid #fff;
          border-radius: 4px;
          padding: 12px 16px;
          background: rgba(30, 30, 30, 0.9);
          font-size: 16px;
          min-height: 48px;
          display: flex;
          align-items: center;
        }

        .message-box-content {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
