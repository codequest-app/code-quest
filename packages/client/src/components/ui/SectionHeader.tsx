import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'prominent';
  'data-testid'?: string;
}

const BASE = 'px-4 pt-2 pb-1 m-0 text-xs font-mono font-bold tracking-widest uppercase';

const VARIANT_CLASS: Record<NonNullable<SectionHeaderProps['variant']>, string> = {
  default: 'text-text-dim',
  prominent: 'text-text-muted border-b border-border',
};

export function SectionHeader({
  children,
  className,
  variant = 'default',
  'data-testid': dataTestid,
}: SectionHeaderProps) {
  return (
    <h3 data-testid={dataTestid} className={cn(BASE, VARIANT_CLASS[variant], className)}>
      {children}
    </h3>
  );
}
