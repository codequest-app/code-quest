import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { useChannelConfig, useChannelId } from '../contexts/channel';
import { shortModelName } from '../utils/model-utils';
import { isThinkingActive } from '../utils/thinking';

const HDR_BTN = 'text-text-muted hover:text-text text-xs transition-colors cursor-pointer';

const THINKING_LABELS: Record<string, string> = {
  default_on: 'Thinking',
  always_on: 'Thinking · Always',
  adaptive: 'Thinking · Adaptive',
};

function thinkingLevelLabel(level: string): string {
  return THINKING_LABELS[level] ?? `Thinking · ${level}`;
}

export { HDR_BTN };

export interface HeaderBarProps {
  title?: string | null;
  onOpenCommandPalette?: () => void;
  resumeSlot?: ReactNode;
}

export function HeaderBar({ title, onOpenCommandPalette, resumeSlot }: HeaderBarProps) {
  const channelId = useChannelId();
  const { model, thinkingLevel, availableModels } = useChannelConfig();

  const sessionLabel = title ?? (channelId ? `${channelId.slice(0, 8)}…` : null);

  return (
    <header className="flex items-center gap-3 px-4 h-11 bg-surface border-b border-border text-xs shrink-0">
      {model && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
          {shortModelName(model, availableModels)}
        </span>
      )}
      {isThinkingActive(thinkingLevel) && (
        <span
          className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-text-muted"
          title={`Thinking: ${thinkingLevel}`}
        >
          {thinkingLevelLabel(thinkingLevel)}
        </span>
      )}
      {sessionLabel && (
        <span className="text-text-muted/60 text-xs truncate flex-1 min-w-0">{sessionLabel}</span>
      )}
      {!sessionLabel && <div className="flex-1" />}

      {resumeSlot}
      <button
        type="button"
        title="Command Palette (⌘K)"
        aria-label="Command Palette (⌘K)"
        onClick={onOpenCommandPalette}
        className={HDR_BTN}
      >
        <MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />
      </button>
    </header>
  );
}
