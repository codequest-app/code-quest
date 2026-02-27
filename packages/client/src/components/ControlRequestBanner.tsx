import type { PendingControl } from '../stores/chat-store';

interface ControlRequestBannerProps {
  pending: PendingControl | null;
  onRespond: (response: Record<string, unknown>) => void;
}

export function ControlRequestBanner({ pending, onRespond }: ControlRequestBannerProps) {
  if (!pending) return null;

  const label = pending.toolName ?? pending.subtype;

  return (
    <div className="control-request-banner">
      <span>
        ⚠️ Approve tool: <strong>{label}</strong>
      </span>
      <div className="control-request-banner__actions">
        <button type="button" onClick={() => onRespond({ allowed: true })}>
          Approve
        </button>
        <button type="button" onClick={() => onRespond({ allowed: false })}>
          Deny
        </button>
      </div>
    </div>
  );
}
