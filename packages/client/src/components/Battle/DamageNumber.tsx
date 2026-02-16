import { useEffect, useState } from 'react';

interface DamageNumberProps {
  value: number;
  isCritical?: boolean;
  onComplete?: () => void;
}

export function DamageNumber({ value, isCritical = false, onComplete }: DamageNumberProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const colorClass = value >= 60 ? 'damage-high' : value >= 30 ? 'damage-mid' : 'damage-low';

  return (
    <div
      className={`damage-number ${isCritical ? 'critical' : colorClass}`}
      data-testid="damage-number"
    >
      {isCritical && <span className="critical-label">CRITICAL! </span>}-{value}
      <style>{`
        .damage-number {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 24px;
          font-weight: bold;
          color: #ef5350;
          animation: float-up-fade 1.5s ease-out forwards;
          pointer-events: none;
          z-index: 20;
        }

        .damage-number.critical {
          color: #ffd54f;
          font-size: 32px;
        }

        .critical-label {
          font-size: 16px;
        }

        @keyframes float-up-fade {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px); }
        }
      `}</style>
    </div>
  );
}
