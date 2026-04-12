import { useChannelConfig, useChannelId } from '../contexts/channel';
import { shortModelName } from '../utils/model-utils';

const HDR_BTN = 'text-text-muted hover:text-text text-[11px] transition-colors';

export interface HeaderBarProps {
  title?: string | null;
  onToggleRaw?: () => void;
}

export function HeaderBar({ title, onToggleRaw }: HeaderBarProps) {
  const channelId = useChannelId();
  const { model, thinkingLevel, availableModels } = useChannelConfig();

  const sessionLabel = title ?? (channelId ? `${channelId.slice(0, 8)}…` : null);

  return (
    <header className="flex items-center gap-3 px-4 h-11 bg-surface border-b border-border text-xs shrink-0">
      {model && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
          {shortModelName(model, availableModels)}
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
