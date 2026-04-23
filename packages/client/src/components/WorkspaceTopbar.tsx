import { Bars3Icon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { IconButton } from './ui/IconButton';

const ACTION_CLASS = 'w-8 h-8 text-text-muted hover:text-text hover:bg-white/5';

type Mode = 'desktop' | 'mobile';

interface Props {
  mode: Mode;
  onOpenSettings: () => void;
  /** When provided, renders a hamburger at the left that calls this on click. */
  onOpenMenu?: () => void;
  /** The rest of the topbar contents (currently the TopScopeSwitcher). */
  children: ReactNode;
}

const ROOT_CLASS: Record<Mode, string> = {
  desktop: 'flex items-center h-9 px-2 border-b border-border bg-surface shrink-0',
  mobile: 'flex items-center gap-2 h-11 px-3 border-b border-border bg-surface shrink-0',
};

export function WorkspaceTopbar({ mode, onOpenSettings, onOpenMenu, children }: Props) {
  return (
    <div data-testid={`${mode}-topbar`} className={ROOT_CLASS[mode]}>
      {onOpenMenu && (
        <IconButton variant="plain" aria-label="Menu" onClick={onOpenMenu} className={ACTION_CLASS}>
          <Bars3Icon className="w-5 h-5" />
        </IconButton>
      )}
      {children}
      <IconButton
        variant="plain"
        aria-label="Settings"
        onClick={onOpenSettings}
        className={`ml-auto ${ACTION_CLASS}`}
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </IconButton>
    </div>
  );
}
