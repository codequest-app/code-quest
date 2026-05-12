import { cn } from '@/utils/cn';

interface LabeledProps {
  label: string;
  divider?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Labeled({ label, divider, children, className }: LabeledProps): React.JSX.Element {
  return (
    <div
      className={cn('flex items-baseline gap-3', divider && 'border-b border-border', className)}
    >
      <span className="text-xs font-mono text-text-muted/60 select-none shrink-0 pl-3 py-2 min-w-14">
        {label}
      </span>
      <div className="flex-1 min-w-0 overflow-x-auto py-2">{children}</div>
    </div>
  );
}
