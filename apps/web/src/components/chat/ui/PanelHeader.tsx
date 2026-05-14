import { cn } from '@/utils/cn';

export function PanelHeader({
  title,
  actions,
  className,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
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
