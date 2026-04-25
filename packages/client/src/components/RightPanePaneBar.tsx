import * as Switch from '@radix-ui/react-switch';
import {
  useRightPaneCwd,
  useRightPaneScope,
  useRightPaneScopeActions,
} from '../contexts/RightPaneScopeContext';
import { basename } from '../utils/basename';

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

  const label = hasCwd ? `📁 ${basename(cwd)}` : '— no scope —';

  return (
    <div className="flex items-center gap-2 px-3 h-9 border-b border-border text-xs text-text-muted">
      <span data-testid="pane-bar-scope-label" className="flex-1 truncate">
        {label}
      </span>
      <Switch.Root
        checked={isPinned}
        onCheckedChange={togglePin}
        disabled={!hasCwd}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-surface-hover transition-colors data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Switch.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-text shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
      </Switch.Root>
      <span className="text-2xs">{isPinned ? '📌' : '⇆'}</span>
      {closeMode === 'collapse' ? (
        <button
          type="button"
          aria-label="Collapse right pane"
          onClick={onCollapse}
          className="px-1 hover:text-text"
        >
          —
        </button>
      ) : (
        <button
          type="button"
          aria-label="Close right pane"
          onClick={onBack}
          className="px-1 hover:text-text"
        >
          ✕
        </button>
      )}
    </div>
  );
}
