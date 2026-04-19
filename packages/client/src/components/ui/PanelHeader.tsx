import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PanelHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, actions, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-border shrink-0',
        className,
      )}
    >
      <div className="text-sm font-medium text-text">{title}</div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
