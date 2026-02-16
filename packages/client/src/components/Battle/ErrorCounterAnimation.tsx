import { useEffect } from 'react';

interface ErrorCounterAnimationProps {
  message: string;
  damage: number;
  onComplete: () => void;
}

export function ErrorCounterAnimation({ message, damage, onComplete }: ErrorCounterAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="error-counter" data-testid="error-counter">
      <div className="error-message">{message}</div>
      <div className="error-damage">{damage}</div>

      <style>{`
        .error-counter {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 18;
          pointer-events: none;
          animation: error-flash 0.3s ease-in-out 3;
        }

        .error-message {
          font-size: 18px;
          color: #ff7043;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }

        .error-damage {
          font-size: 32px;
          color: #ef5350;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-shadow: 0 0 10px #ff0000;
        }

        @keyframes error-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
