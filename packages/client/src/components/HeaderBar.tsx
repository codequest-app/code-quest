import { useState } from 'react';
import { useChannelConfig, useChannelMessages } from '../contexts/channel';
import type { SessionStatus } from '../types/ui';
import { shortModelName } from '../utils/model-utils';

const statusConfig: Record<SessionStatus, { label: string; dotClass: string }> = {
  disconnected: { label: 'Disconnected', dotClass: 'bg-danger' },
  idle: { label: 'Connected', dotClass: 'bg-success' },
  processing: { label: 'Processing', dotClass: 'bg-accent animate-pulse' },
  connecting: { label: 'Connecting', dotClass: 'bg-accent animate-pulse' },
  busy: { label: 'Busy', dotClass: 'bg-accent animate-pulse' },
  cancelling: { label: 'Cancelling…', dotClass: 'bg-warning animate-pulse' },
};

const HDR_BTN = 'text-text-muted hover:text-text text-[11px] transition-colors';

function KillButton({ onKill }: { onKill: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px]">
        <span className="text-danger">Kill?</span>
        <button
          type="button"
          onClick={() => {
            onKill();
            setConfirming(false);
          }}
          className="text-danger hover:text-danger/80 font-medium transition-colors"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-text-muted hover:text-text transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      title="Kill Session"
      onClick={() => setConfirming(true)}
      className="text-danger hover:text-danger/80 text-[11px] transition-colors"
    >
      Kill
    </button>
  );
}

export interface HeaderBarProps {
  title?: string | null;
  onToggleRaw?: () => void;
}

export function HeaderBar({ title, onToggleRaw }: HeaderBarProps) {
  const { status, channelId, kill } = useChannelMessages();
  const { model, thinkingLevel, availableModels } = useChannelConfig();

  const cfg =
    status in statusConfig ? statusConfig[status as SessionStatus] : statusConfig.disconnected;
  const { label, dotClass } = cfg;
  const sessionLabel = title ?? (channelId ? `${channelId.slice(0, 8)}…` : null);

  return (
    <header className="flex items-center gap-3 px-4 h-11 bg-surface border-b border-border text-xs shrink-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-text-muted font-medium">{label}</span>
      {model && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
          {availableModels?.find((m: { value: string }) => m.value === model)?.displayName ??
            shortModelName(model)}
        </span>
      )}
      {thinkingLevel && thinkingLevel !== 'off' && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
          {thinkingLevel}
        </span>
      )}
      {sessionLabel && (
        <span className="flex-1 text-center text-text-muted/70 text-[11px] truncate px-2">
          {sessionLabel}
        </span>
      )}
      {!sessionLabel && <div className="flex-1" />}
      {channelId && <KillButton onKill={kill} />}
      {onToggleRaw && (
        <button type="button" title="Raw Events" onClick={onToggleRaw} className={HDR_BTN}>
          Raw
        </button>
      )}
    </header>
  );
}
