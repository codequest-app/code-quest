import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

const BASE =
  'px-4 pt-2 pb-1 m-0 text-xs font-mono font-bold tracking-widest uppercase text-text-dim';

export function SectionHeader({
  children,
  className,
  'data-testid': dataTestid,
}: SectionHeaderProps) {
  return (
    <h3 data-testid={dataTestid} className={cn(BASE, className)}>
      {children}
    </h3>
  );
}
