import type { SkillInfo } from '@code-quest/shared';
import { useEffect, useState } from 'react';

interface SkillCastEffectProps {
  skill: SkillInfo;
  onComplete?: () => void;
}

export function SkillCastEffect({ skill, onComplete }: SkillCastEffectProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="skill-cast-effect" data-testid="skill-cast-effect">
      <div className="skill-name">{skill.japaneseName}</div>
      <div className="skill-english">{skill.name}</div>

      <style>{`
        .skill-cast-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          animation: skill-flash 1s ease-out forwards;
          pointer-events: none;
          z-index: 20;
        }

        .skill-name {
          font-size: 28px;
          font-weight: bold;
          color: #64b5f6;
          text-shadow: 0 0 10px rgba(100, 181, 246, 0.5);
        }

        .skill-english {
          font-size: 14px;
          color: #90caf9;
          margin-top: 4px;
        }

        @keyframes skill-flash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
