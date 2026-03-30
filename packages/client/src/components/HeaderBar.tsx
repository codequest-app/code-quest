import { useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
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

export interface HeaderBarProps {
  title?: string | null;
  onToggleRaw?: () => void;
}

export function HeaderBar({ title, onToggleRaw }: HeaderBarProps) {
  const { status, channelId } = useChannelMessages();
  const { model, thinkingLevel, availableModels } = useChannelConfig();
  const { providerConfig } = useSession();

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
            shortModelName(model, providerConfig?.modelDisplayMap)}
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
      {onToggleRaw && (
        <button type="button" title="Raw Events" onClick={onToggleRaw} className={HDR_BTN}>
          Raw
        </button>
      )}
    </header>
  );
}
