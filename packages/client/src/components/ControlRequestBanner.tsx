import type { PendingControl } from '../stores/chat-store';

interface ControlRequestBannerProps {
  pending: PendingControl | null;
  onRespond: (response: Record<string, unknown>) => void;
}

export function ControlRequestBanner({ pending, onRespond }: ControlRequestBannerProps) {
  if (!pending) return null;

  const label = pending.toolName ?? pending.subtype;

  return (
    <div className="flex items-center justify-between bg-warning-bg border border-warning/30 rounded-md px-4 py-2.5 ">
      <span className="text-sm">
        <span className="text-warning">⚠</span> Approve tool:{' '}
        <strong className="text-text-bright">{label}</strong>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onRespond({ allowed: true })}
          className="px-3 py-1.5 bg-success text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:glow-success"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onRespond({ allowed: false })}
          className="px-3 py-1.5 bg-danger text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:glow-danger"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
