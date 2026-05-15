import { cn } from '@/utils/cn';

export function StatusLine({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className="inline-flex items-center">{icon}</span>
      {children}
    </div>
  );
}
