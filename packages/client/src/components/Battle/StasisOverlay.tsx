import type { PauseReason } from '@code-quest/shared';

interface StasisOverlayProps {
  visible: boolean;
  reason: PauseReason;
}

const REASON_LABELS: Record<PauseReason, string> = {
  plan_mode: '思考中...',
  question: '質問を受けた...',
  permission: '許可を求められている...',
  error: 'エラー発生...',
};

export function StasisOverlay({ visible, reason }: StasisOverlayProps) {
  if (!visible) return null;

  return (
    <div className="stasis-overlay" data-testid="stasis-overlay">
      <div className="snowflake">❄</div>
      <div className="snowflake snowflake-2">❅</div>
      <div className="snowflake snowflake-3">❆</div>
      <div className="stasis-text">時空凍結</div>
      <div className="stasis-reason">{REASON_LABELS[reason]}</div>

      <style>{`
        .stasis-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 40, 0.7);
          z-index: 15;
          pointer-events: none;
          animation: stasis-pulse 2s ease-in-out infinite;
        }

        .stasis-text {
          font-size: 32px;
          font-weight: bold;
          color: #80ceff;
          text-shadow: 0 0 20px #4080ff, 0 0 40px #2060cc;
          font-family: 'Courier New', monospace;
        }

        .stasis-reason {
          font-size: 16px;
          color: #99ccff;
          margin-top: 12px;
          font-family: 'Courier New', monospace;
        }

        @keyframes stasis-pulse {
          0%, 100% { background: rgba(0, 0, 40, 0.7); }
          50% { background: rgba(0, 0, 60, 0.85); }
        }

        @keyframes snowfall {
          0% { transform: translateY(-10%) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110%) translateX(20px); opacity: 0; }
        }

        .snowflake {
          position: absolute;
          font-size: 18px;
          color: rgba(180, 220, 255, 0.5);
          animation: snowfall 6s linear infinite;
          left: 20%;
          top: 0;
        }

        .snowflake-2 {
          left: 50%;
          animation-delay: 2s;
          animation-duration: 8s;
          font-size: 14px;
        }

        .snowflake-3 {
          left: 75%;
          animation-delay: 4s;
          animation-duration: 7s;
          font-size: 22px;
        }
      `}</style>
    </div>
  );
}
