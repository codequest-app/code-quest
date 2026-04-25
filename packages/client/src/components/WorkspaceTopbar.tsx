import type { SessionStateSummary } from '@code-quest/shared';
import { Bars3Icon, Cog6ToothIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { TopbarLiveSessions } from './TopbarLiveSessions';
import { IconButton } from './ui/IconButton';

const ACTION_CLASS = 'w-8 h-8 text-text-muted hover:text-text hover:bg-white/5';

type Mode = 'desktop' | 'mobile';

interface Props {
  mode: Mode;
  onOpenSettings: () => void;
  /** Toggle the left sidebar — desktop: collapse/expand Panel; tablet/mobile: open drawer. */
  onToggleLeft?: () => void;
  /** Toggle the right pane — desktop: collapse/expand Panel; tablet/mobile: open drawer. */
  onToggleRight?: () => void;
  /** The rest of the topbar contents (currently the TopScopeSwitcher). */
  children: ReactNode;
  /** Live sessions for the inline pill list. */
  sessions?: SessionStateSummary[];
  /** Activate a live session by its channelId. */
  onActivateSession?: (channelId: string) => void;
}

const ROOT_CLASS: Record<Mode, string> = {
  desktop: 'flex items-center h-11 px-2 border-b border-border bg-surface shrink-0',
  mobile: 'flex items-center gap-2 h-11 px-3 border-b border-border bg-surface shrink-0',
};

const Brand = () => (
  <span className="hidden md:inline-flex items-center gap-1.5 px-2 mr-1 text-sm font-semibold text-text">
    <span className="text-accent text-base leading-none">✦</span>
    <span className="font-mono text-xs tracking-wide">cc-office</span>
  </span>
);

export function WorkspaceTopbar({
  mode,
  onOpenSettings,
  onToggleLeft,
  onToggleRight,
  children,
  sessions,
  onActivateSession,
}: Props) {
  return (
    <div data-testid={`${mode}-topbar`} className={ROOT_CLASS[mode]}>
      <Brand />
      {onToggleLeft && (
        <IconButton
          variant="plain"
          aria-label="Toggle sidebar"
          onClick={onToggleLeft}
          className={ACTION_CLASS}
        >
          <Bars3Icon className="w-5 h-5" />
        </IconButton>
      )}
      {children}
      {sessions && onActivateSession && (
        <div className="ml-3">
          <TopbarLiveSessions sessions={sessions} onActivate={onActivateSession} />
        </div>
      )}
      {onToggleRight && (
        <IconButton
          variant="plain"
          aria-label="Toggle right pane"
          onClick={onToggleRight}
          className={`ml-auto ${ACTION_CLASS}`}
        >
          <RectangleGroupIcon className="w-5 h-5" />
        </IconButton>
      )}
      <IconButton
        variant="plain"
        aria-label="Settings"
        onClick={onOpenSettings}
        className={`${onToggleRight ? '' : 'ml-auto '}${ACTION_CLASS}`}
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </IconButton>
    </div>
  );
}
