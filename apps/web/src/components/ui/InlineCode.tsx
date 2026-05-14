import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InlineCodeProps extends HTMLAttributes<HTMLElement> {
  subtle?: boolean;
}

export function InlineCode({
  subtle = false,
  className,
  children,
  ...rest
}: InlineCodeProps): React.JSX.Element {
  return (
    <code
      {...rest}
      className={cn('font-mono text-xs', !subtle && 'bg-surface px-1 rounded', className)}
    >
      {children}
    </code>
  );
}
