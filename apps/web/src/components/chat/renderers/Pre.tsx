import { cn } from '@/utils/cn';

interface PreProps {
  children: React.ReactNode;
  className?: string;
}

export function Pre({ children, className }: PreProps): React.JSX.Element {
  return <pre className={cn('whitespace-pre-wrap font-mono text-xs', className)}>{children}</pre>;
}
