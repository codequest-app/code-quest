import * as Switch from '@radix-ui/react-switch';
import {
  useRightPaneCwd,
  useRightPaneScope,
  useRightPaneScopeActions,
} from '../contexts/RightPaneScopeContext';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';

export interface RightPanePaneBarProps {
  closeMode: 'collapse' | 'back';
  onCollapse?: () => void;
  onBack?: () => void;
}

export function RightPanePaneBar({ closeMode, onCollapse, onBack }: RightPanePaneBarProps) {
  const scope = useRightPaneScope();
  const { togglePin } = useRightPaneScopeActions();
  const cwd = useRightPaneCwd();
  const isPinned = scope.mode === 'pinned';
  const hasCwd = cwd !== null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-border shrink-0">
      <span
        data-testid="pane-bar-scope-label"
        className={cn(
          'flex-1 min-w-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs',
          hasCwd ? 'border-border bg-white/[.04] text-text' : 'border-transparent text-text-muted',
        )}
      >
        {hasCwd ? (
          <>
            <span className="text-text-muted truncate">{basename(cwd)}</span>
            <span className="text-text-muted">·</span>
            <span className="text-accent font-mono whitespace-nowrap">⎇ {basename(cwd)}</span>
          </>
        ) : (
          '— no scope —'
        )}
      </span>

      <Switch.Root
        checked={isPinned}
        onCheckedChange={togglePin}
        disabled={!hasCwd}
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-2xs cursor-pointer transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isPinned
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-text-muted hover:text-text',
        )}
      >
        {isPinned ? '📌 pinned' : '⇆ follow'}
      </Switch.Root>

      <button
        type="button"
        aria-label={closeMode === 'collapse' ? 'Collapse right pane' : 'Close right pane'}
        onClick={closeMode === 'collapse' ? onCollapse : onBack}
        className="shrink-0 px-1 text-text-muted hover:text-text text-xs"
      >
        {closeMode === 'collapse' ? '—' : '✕'}
      </button>
    </div>
  );
}
