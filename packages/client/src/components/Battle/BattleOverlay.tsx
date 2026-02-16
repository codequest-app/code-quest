import type { DamageResult, SkillInfo } from '@code-quest/shared';
import { useCallback, useEffect, useState } from 'react';
import { useBattleStore } from '../../stores/battleStore';
import { BattleLog } from './BattleLog';
import { DamageNumber } from './DamageNumber';
import { EnemyDisplay } from './EnemyDisplay';
import { MessageBox } from './MessageBox';
import { PlayerStatus } from './PlayerStatus';
import { RPGPermissionModal } from './RPGPermissionModal';
import { RPGQuestionModal } from './RPGQuestionModal';
import { SkillCastEffect } from './SkillCastEffect';
import { StasisOverlay } from './StasisOverlay';

interface ActiveEffect {
  id: number;
  type: 'damage' | 'skill';
  damage?: DamageResult;
  skill?: SkillInfo;
}

let effectCounter = 0;

interface BattleOverlayProps {
  sessionId: string;
}

export function BattleOverlay({ sessionId }: BattleOverlayProps) {
  const battle = useBattleStore((s) => s.battles.get(sessionId));
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const removeEffect = useCallback((id: number) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Auto-fade after victory
  useEffect(() => {
    if (battle?.phase === 'victory') {
      const fadeTimer = setTimeout(() => setFading(true), 3000);
      const hideTimer = setTimeout(() => setHidden(true), 4000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    setFading(false);
    setHidden(false);
  }, [battle?.phase]);

  // Check for new effects based on last log entry
  const lastLog = battle?.log[battle.log.length - 1];
  const lastEffectLogRef = useState<string | null>(null);

  if (lastLog && lastLog.id !== lastEffectLogRef[0]) {
    lastEffectLogRef[1](lastLog.id);

    if (lastLog.type === 'damage') {
      const match = lastLog.message.match(/(\d+) のダメージ/);
      if (match) {
        const totalDamage = Number.parseInt(match[1], 10);
        const isCritical = lastLog.message.includes('会心');
        const id = ++effectCounter;
        queueMicrotask(() => {
          setEffects((prev) => [
            ...prev,
            {
              id,
              type: 'damage',
              damage: {
                baseDamage: totalDamage,
                affinityMultiplier: 1,
                totalDamage,
                isCritical,
              },
            },
          ]);
        });
      }
    }

    if (lastLog.type === 'skill') {
      const skillMatch = lastLog.message.match(/^(.+?)（(.+?)）/);
      if (skillMatch) {
        const id = ++effectCounter;
        queueMicrotask(() => {
          setEffects((prev) => [
            ...prev,
            {
              id,
              type: 'skill',
              skill: {
                name: skillMatch[2],
                japaneseName: skillMatch[1],
                category: 'execute',
                mpCost: 0,
              },
            },
          ]);
        });
      }
    }
  }

  if (!battle || hidden) return null;

  const message =
    battle.phase === 'victory'
      ? `勝利！ ${battle.goldEarned}G と ${battle.expEarned}EXP を獲得！`
      : (lastLog?.message ?? '戦闘開始！');

  return (
    <div
      className={`battle-overlay ${fading ? 'battle-overlay-fading' : ''}`}
      data-testid="battle-overlay"
    >
      <EnemyDisplay enemy={battle.enemy} />

      {/* Floating effects */}
      {effects.map((effect) =>
        effect.type === 'damage' && effect.damage ? (
          <DamageNumber
            key={effect.id}
            value={effect.damage.totalDamage}
            isCritical={effect.damage.isCritical}
            onComplete={() => removeEffect(effect.id)}
          />
        ) : effect.type === 'skill' && effect.skill ? (
          <SkillCastEffect
            key={effect.id}
            skill={effect.skill}
            onComplete={() => removeEffect(effect.id)}
          />
        ) : null,
      )}

      <BattleLog entries={battle.log} />
      <PlayerStatus battle={battle} />
      <MessageBox message={message} />

      {battle.isPaused && battle.pauseReason === 'plan_mode' && (
        <StasisOverlay visible reason="plan_mode" />
      )}

      {battle.isPaused && battle.pauseReason === 'question' && battle.activeDialogue && (
        <RPGQuestionModal
          question={battle.activeDialogue.question}
          options={battle.activeDialogue.options}
          onSelect={() => {}}
        />
      )}

      {battle.isPaused && battle.pauseReason === 'permission' && battle.activeTrap && (
        <RPGPermissionModal
          toolName={battle.activeTrap.toolName}
          description={battle.activeTrap.description}
          riskLevel={battle.activeTrap.riskLevel}
          onAllow={() => {}}
          onDeny={() => {}}
        />
      )}

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
          transition: opacity 1s ease-out;
        }

        .battle-overlay-fading {
          opacity: 0;
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

        .enemy-name { font-weight: bold; }

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

        .battle-log-entry { padding: 2px 0; font-size: 14px; }
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

        .stat-label { font-weight: bold; font-size: 14px; min-width: 30px; }

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

        .message-box-content { white-space: pre-wrap; }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
