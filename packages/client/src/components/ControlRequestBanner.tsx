import type { PendingControl } from '../stores/chat-store';

interface ControlRequestBannerProps {
  pending: PendingControl | null;
  onRespond: (response: Record<string, unknown>) => void;
}

export function ControlRequestBanner({ pending, onRespond }: ControlRequestBannerProps) {
  if (!pending) return null;

  const label = pending.toolName ?? pending.subtype;

  return (
    <div className="flex items-center justify-between bg-warning-bg border border-warning rounded-md px-4 py-2.5 mx-4 mb-2">
      <span>
        ⚠️ Approve tool: <strong>{label}</strong>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onRespond({ allowed: true })}
          className="px-3 py-1 bg-success text-white border-none rounded cursor-pointer text-[13px]"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onRespond({ allowed: false })}
          className="px-3 py-1 bg-danger text-white border-none rounded cursor-pointer text-[13px]"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
